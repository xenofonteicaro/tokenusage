import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import type { Provider, SourceStatus, UsageEvent } from "../types";
import { readJson, writeJson } from "../local-store";
import { hash, object, projectName, str } from "./normalize";
import {
  claudeParser,
  codexParser,
  geminiParser,
  grokEvents,
  type LineParser,
} from "./parsers";

export const HISTORY_DAYS = 90;
// Bump when parsed event fields change so cached files are parsed again.
const CACHE_VERSION = 4;
interface CachedFile {
  stamp: string;
  events: UsageEvent[];
  warnings: number;
}
interface FileCache {
  version: number;
  files: Record<string, CachedFile>;
}
interface Collection {
  events: UsageEvent[];
  sources: SourceStatus[];
}
const homePath = (env: string, fallback: string) =>
  process.env.TOKENUSAGE_PROFILE_DIR
    ? path.join(process.env.TOKENUSAGE_PROFILE_DIR, fallback)
    : process.env[env] || path.join(homedir(), fallback);

async function filesUnder(
  root: string,
  depth: number,
  match: (name: string) => boolean,
): Promise<string[]> {
  const found: string[] = [];
  async function visit(directory: string, remaining: number) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const item of entries) {
      if (item.isSymbolicLink()) continue;
      if (item.isFile() && match(item.name))
        found.push(path.join(directory, item.name));
      else if (
        item.isDirectory() &&
        remaining > 0 &&
        ![
          "node_modules",
          "vendor",
          ".git",
          "logs",
          "compaction_checkpoints",
        ].includes(item.name)
      ) {
        await visit(path.join(directory, item.name), remaining - 1);
      }
    }
  }
  await visit(root, depth);
  return found;
}

async function parseLines(
  file: string,
  parser: LineParser,
  provider: Provider,
): Promise<CachedFile> {
  let warnings = 0;
  const input = createReadStream(file, { encoding: "utf8" });
  const lines = createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      if (!line.trim()) continue;
      // Avoid parsing screenshots, tool outputs, and unrelated conversation payloads.
      if (
        provider === "codex" &&
        !/"type"\s*:\s*"(session_meta|turn_context|event_msg)"/.test(line)
      )
        continue;
      if (provider === "claude" && !/"type"\s*:\s*"assistant"/.test(line))
        continue;
      try {
        parser.push(JSON.parse(line));
      } catch {
        warnings++;
      }
    }
  } finally {
    lines.close();
    input.destroy();
  }
  return { stamp: "", events: parser.finish(), warnings };
}

async function readObject(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

async function scanProvider(
  provider: Provider,
  roots: string[],
  depth: number,
  cache: FileCache,
  cutoff: number,
): Promise<{
  events: UsageEvent[];
  status: SourceStatus;
  cache: Record<string, CachedFile>;
}> {
  const location: Record<Provider, string> = {
    codex: "~/.codex/sessions + archived_sessions",
    claude: "~/.claude/projects",
    grok: "~/.grok/sessions",
    gemini: "~/.gemini/tmp/*/chats",
  };
  const names: Record<Provider, string> = {
    codex: "Codex · local history",
    claude: "Claude Code · local history",
    grok: "Grok Build · local history",
    gemini: "Gemini CLI · local history",
  };
  const status: SourceStatus = {
    id: `${provider}-local`,
    provider,
    channel: "tool",
    name: names[provider],
    state: "missing",
    files: 0,
    events: 0,
    detail: "Local history was not found for this user.",
    location: location[provider],
    latest: null,
    warnings: 0,
  };
  let available = false;
  const updated: Record<string, CachedFile> = {};
  const allFiles: string[] = [];
  for (const root of roots) {
    try {
      const files = await filesUnder(root, depth, (name) =>
        provider === "grok"
          ? name === "usage.json"
          : provider === "gemini"
            ? /^session-.*\.(json|jsonl)$/.test(name)
            : name.endsWith(".jsonl"),
      );
      available = true;
      allFiles.push(...files);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        status.state = "error";
        status.detail =
          "Could not read part of the history. Check permissions.";
        status.warnings++;
      }
    }
  }
  // Parent Grok ledgers already include completed child usage. Exclude known child ledgers.
  const childSessions = new Set<string>();
  if (provider === "grok") {
    for (const file of allFiles) {
      try {
        const metadataFiles = await filesUnder(
          path.join(path.dirname(file), "subagents"),
          1,
          (name) => name === "meta.json",
        );
        for (const metadataFile of metadataFiles)
          childSessions.add(
            str(object(await readObject(metadataFile)).child_session_id),
          );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT")
          status.warnings++;
      }
    }
  }
  const events = new Map<string, UsageEvent>();
  let cursor = 0;
  async function worker() {
    while (cursor < allFiles.length) {
      const file = allFiles[cursor++];
      if (
        provider === "grok" &&
        childSessions.has(path.basename(path.dirname(file)))
      )
        continue;
      try {
        const info = await stat(file);
        if (info.mtimeMs < cutoff) continue;
        status.files++;
        const key = hash(file);
        const stamp = `${info.mtimeMs}:${info.size}`;
        let parsed = cache.files[key];
        if (parsed?.stamp !== stamp) {
          if (provider === "grok") {
            const summary = await readObject(
              path.join(path.dirname(file), "summary.json"),
            );
            parsed = {
              stamp,
              events: grokEvents(await readObject(file), summary),
              warnings: 0,
            };
          } else if (provider === "gemini") {
            const projectHash = path.basename(path.dirname(path.dirname(file)));
            const parser = geminiParser(
              path.basename(file),
              `Project ${projectHash.slice(0, 8)}`,
            );
            if (file.endsWith(".json")) {
              parser.push(await readObject(file));
              parsed = { stamp, events: parser.finish(), warnings: 0 };
            } else
              parsed = { ...(await parseLines(file, parser, provider)), stamp };
          } else {
            const parser =
              provider === "codex"
                ? codexParser(path.basename(file))
                : claudeParser(path.basename(file));
            parsed = { ...(await parseLines(file, parser, provider)), stamp };
          }
        }
        updated[key] = parsed;
        status.warnings += parsed.warnings;
        for (const row of parsed.events) {
          if (Date.parse(row.timestamp) < cutoff) continue;
          const previous = events.get(row.id);
          if (!previous || row.totalTokens >= previous.totalTokens)
            events.set(row.id, row);
        }
      } catch {
        status.warnings++;
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  status.events = events.size;
  status.latest =
    [...events.values()]
      .map((row) => row.timestamp)
      .sort()
      .at(-1) ?? null;
  if (events.size) {
    status.state = "connected";
    status.detail =
      provider === "grok"
        ? "Tokens per turn and model. Tool-reported costs when available."
        : "Actual token counts from sessions saved on this computer.";
  } else if (available && status.state !== "error") {
    status.state = status.warnings ? "error" : "empty";
    status.detail = status.warnings
      ? "History exists, but some files could not be parsed."
      : provider === "gemini"
        ? "Gemini found, but no sessions have token counters. Older message logs do not report usage."
        : "No token records available in the last 90 days.";
  }
  return { events: [...events.values()], status, cache: updated };
}

let currentScan: Promise<Collection> | null = null;
let lastScan: { time: number; collection: Collection } | null = null;
export async function collectLocal(): Promise<Collection> {
  if (lastScan && Date.now() - lastScan.time < 15_000)
    return lastScan.collection;
  if (currentScan) return currentScan;
  currentScan = (async () => {
    const saved = await readJson<FileCache>("collector-cache.json");
    const cache: FileCache =
      saved?.version === CACHE_VERSION
        ? saved
        : { version: CACHE_VERSION, files: {} };
    const cutoff = Date.now() - (HISTORY_DAYS + 1) * 86400000;
    const codex = homePath("CODEX_HOME", ".codex");
    const roots: Record<Provider, string[]> = {
      codex: [
        path.join(codex, "sessions"),
        path.join(codex, "archived_sessions"),
      ],
      claude: [path.join(homePath("CLAUDE_CONFIG_DIR", ".claude"), "projects")],
      grok: [path.join(homePath("GROK_HOME", ".grok"), "sessions")],
      gemini: [path.join(homePath("GEMINI_HOME", ".gemini"), "tmp")],
    };
    const results = await Promise.all(
      (Object.keys(roots) as Provider[]).map((provider) =>
        scanProvider(
          provider,
          roots[provider],
          provider === "grok" ? 2 : provider === "gemini" ? 3 : 5,
          cache,
          cutoff,
        ),
      ),
    );
    await writeJson("collector-cache.json", {
      version: CACHE_VERSION,
      files: Object.assign({}, ...results.map((result) => result.cache)),
    });
    const collection = {
      events: results.flatMap((result) => result.events),
      sources: results.map((result) => result.status),
    };
    lastScan = { time: Date.now(), collection };
    return collection;
  })().finally(() => {
    currentScan = null;
  });
  return currentScan;
}

export { projectName };
