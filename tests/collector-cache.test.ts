import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function withDataDirectory<T>(
  work: (directory: string) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "tokenusage-emitted-"));
  const previousData = process.env.TOKENUSAGE_DATA_DIR;
  const previousProfile = process.env.TOKENUSAGE_PROFILE_DIR;
  process.env.TOKENUSAGE_DATA_DIR = directory;
  process.env.TOKENUSAGE_PROFILE_DIR = join(directory, "profile");
  try {
    return await work(directory);
  } finally {
    if (previousData === undefined) delete process.env.TOKENUSAGE_DATA_DIR;
    else process.env.TOKENUSAGE_DATA_DIR = previousData;
    if (previousProfile === undefined)
      delete process.env.TOKENUSAGE_PROFILE_DIR;
    else process.env.TOKENUSAGE_PROFILE_DIR = previousProfile;
    await rm(directory, { recursive: true, force: true });
  }
}

test("a collector cache from an earlier release is discarded so fallback labels refresh", async () => {
  await withDataDirectory(async (directory) => {
    const sessions = join(directory, "profile", ".codex", "sessions", "2026");
    await mkdir(sessions, { recursive: true });
    const file = join(sessions, "rollout-test.jsonl");
    const now = new Date().toISOString();
    await writeFile(
      file,
      [
        { type: "turn_context", payload: {} },
        {
          type: "event_msg",
          timestamp: now,
          payload: {
            type: "token_count",
            info: { total_token_usage: { input_tokens: 10, output_tokens: 2 } },
          },
        },
      ]
        .map((line) => JSON.stringify(line))
        .join("\n"),
    );
    const info = await stat(file);
    const key = createHash("sha256").update(file).digest("hex").slice(0, 24);
    const stale = {
      id: "stale",
      provider: "codex",
      channel: "tool",
      timestamp: now,
      sessionId: "stale",
      model: "Modelo não informado",
      project: "Sem projeto",
      inputTokens: 10,
      outputTokens: 2,
      cachedTokens: 0,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
      totalTokens: 12,
      costUSD: null,
    };
    await writeFile(
      join(directory, "collector-cache.json"),
      JSON.stringify({
        version: 3,
        files: {
          [key]: {
            stamp: `${info.mtimeMs}:${info.size}`,
            events: [stale],
            warnings: 0,
          },
        },
      }),
    );
    const { collectLocal } = await import("../src/lib/collectors/local");
    const { events } = await collectLocal();
    assert.equal(events.length, 1);
    assert.equal(events[0].project, "No project");
    assert.equal(events[0].model, "Model not provided");
    const cache = JSON.parse(
      await readFile(join(directory, "collector-cache.json"), "utf8"),
    ) as { version: number };
    assert.equal(cache.version, 4);
  });
});
