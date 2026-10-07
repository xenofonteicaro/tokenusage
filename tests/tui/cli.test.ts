import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

// Runs the real entry point through tsx, against a synthetic profile. Without
// an explicit data directory it uses an empty one, so a developer's saved
// language never changes the result.
const emptyData = join(tmpdir(), `tokenusage-cli-empty-${process.pid}`);
async function tui(args: string[], env: Record<string, string> = {}) {
  try {
    const { stdout, stderr } = await run(
      process.execPath,
      ["--import", "tsx", "src/tui/main.tsx", ...args],
      {
        cwd: root,
        env: { ...process.env, TOKENUSAGE_DATA_DIR: emptyData, ...env },
      },
    );
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code: number; stdout: string; stderr: string };
    return {
      code: failure.code,
      stdout: failure.stdout,
      stderr: failure.stderr,
    };
  }
}

test("--help lists the options", async () => {
  const result = await tui(["--help"]);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Uso: tokenusage tui/);
  assert.match(result.stdout, /--once/);
});

test("invalid options exit with code 2 and a Portuguese message", async () => {
  const result = await tui(["--days", "15"]);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /7, 30 ou 90/);
});

test("without a terminal the TUI refuses to start and points to --once", async () => {
  const result = await tui([]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /terminal interativo/);
});

test("--once prints the overview for a synthetic profile", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "tokenusage-once-test-"));
  try {
    const session = join(
      fixture,
      "profile/.claude/projects/project-test/session.jsonl",
    );
    await mkdir(dirname(session), { recursive: true });
    await writeFile(
      session,
      JSON.stringify({
        type: "assistant",
        timestamp: new Date().toISOString(),
        sessionId: "claude-test",
        cwd: "/synthetic/project-beta",
        message: {
          id: "message-test",
          model: "claude-test",
          usage: {
            input_tokens: 100,
            cache_read_input_tokens: 800,
            cache_creation_input_tokens: 100,
            output_tokens: 200,
          },
        },
      }) + "\n",
    );
    const result = await tui(["--once", "--days", "7"], {
      TOKENUSAGE_PROFILE_DIR: join(fixture, "profile"),
      TOKENUSAGE_DATA_DIR: join(fixture, "data"),
      NO_COLOR: "1",
    });
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /tokenusage · Visão geral/);
    assert.match(result.stdout, /Período: 7 dias/);
    assert.match(result.stdout, /TOKENS/);
    assert.match(result.stdout, /project-beta/);
    assert.match(result.stdout, /claude-test/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("--lang en switches help, errors and the --once frame to English", async () => {
  const help = await tui(["--help", "--lang", "en"]);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /Usage: tokenusage tui/);
  const bad = await tui(["--days", "15", "--lang", "en"]);
  assert.equal(bad.code, 2);
  assert.match(bad.stderr, /Use --days with 7, 30 or 90/);
  const fixture = await mkdtemp(join(tmpdir(), "tokenusage-lang-test-"));
  try {
    const once = await tui(["--once", "--lang", "en"], {
      TOKENUSAGE_PROFILE_DIR: join(fixture, "vazio"),
      TOKENUSAGE_DATA_DIR: join(fixture, "data"),
      NO_COLOR: "1",
    });
    assert.equal(once.code, 0, once.stderr);
    assert.match(once.stdout, /tokenusage · Overview/);
    assert.match(once.stdout, /Period: 30 days/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("--once and --help follow the language saved in the preferences", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "tokenusage-lang-saved-"));
  try {
    const data = join(fixture, "data");
    await mkdir(data, { recursive: true });
    await writeFile(
      join(data, "settings.json"),
      JSON.stringify({
        monthlyTokenGoal: null,
        subscriptions: { codex: null, claude: null, grok: null, gemini: null },
        language: "en",
      }),
    );
    const env = {
      TOKENUSAGE_PROFILE_DIR: join(fixture, "vazio"),
      TOKENUSAGE_DATA_DIR: data,
      NO_COLOR: "1",
    };
    const once = await tui(["--once"], env);
    assert.match(once.stdout, /tokenusage · Overview/);
    const help = await tui(["--help"], env);
    assert.match(help.stdout, /Usage: tokenusage tui/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
