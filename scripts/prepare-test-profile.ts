import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const profile = path.resolve(".test-profile");
const now = new Date().toISOString();
async function save(relative: string, data: unknown, lines = false) {
  const target = path.join(profile, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(
    target,
    lines
      ? (data as unknown[]).map((row) => JSON.stringify(row)).join("\n") + "\n"
      : JSON.stringify(data),
  );
}
async function main() {
  await save(
    ".codex/sessions/2026/10/07/session.jsonl",
    [
      {
        type: "session_meta",
        payload: { id: "codex-test", cwd: "/synthetic/project-alpha" },
      },
      { type: "turn_context", payload: { model: "gpt-test" } },
      {
        type: "event_msg",
        timestamp: now,
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              input_tokens: 1000,
              output_tokens: 200,
              cached_input_tokens: 800,
            },
          },
        },
      },
    ],
    true,
  );
  await save(
    ".claude/projects/project-test/session.jsonl",
    [
      {
        type: "assistant",
        timestamp: now,
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
      },
    ],
    true,
  );
  await save(".grok/sessions/project-test/grok-test/summary.json", {
    info: { id: "grok-test", cwd: "/synthetic/project-alpha" },
  });
  await save(".grok/sessions/project-test/grok-test/usage.json", {
    sessionId: "grok-test",
    turns: [
      {
        turnNumber: 1,
        endedAt: now,
        inputTokens: 1000,
        outputTokens: 200,
        cachedReadTokens: 800,
        totalTokens: 1200,
        costUsdTicks: 1000000000,
        primaryModelId: "grok-test",
      },
    ],
  });
  await mkdir(path.join(profile, ".gemini/tmp/project-test"), {
    recursive: true,
  });
  console.log(
    "Prepared isolated synthetic profile. No user history was changed.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
