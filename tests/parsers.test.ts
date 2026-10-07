import { test } from "node:test";
import assert from "node:assert/strict";
import {
  claudeParser,
  codexParser,
  geminiParser,
  grokEvents,
} from "../src/lib/collectors/parsers";
import {
  compactEvents,
  dailySeries,
  dayKey,
  exportCSV,
  selectEvents,
  totals,
} from "../src/lib/analytics";
import { event } from "../src/lib/collectors/normalize";
import { mergeImports, parseImport } from "../src/lib/import-usage";
import { isLocalRequest } from "../src/lib/local-security";
const time = "2026-10-07T12:00:00Z";

test("Codex counts deltas, ignores repeated cumulative snapshots and retains model changes", () => {
  const parser = codexParser("session");
  parser.push({
    type: "session_meta",
    payload: { id: "session", cwd: "/work/project" },
  });
  parser.push({ type: "turn_context", payload: { model: "gpt-test" } });
  const push = (
    input: number,
    output: number,
    cache: number,
    timestamp = time,
  ) =>
    parser.push({
      type: "event_msg",
      timestamp,
      payload: {
        type: "token_count",
        info: {
          total_token_usage: {
            input_tokens: input,
            output_tokens: output,
            cached_input_tokens: cache,
          },
        },
      },
    });
  push(100, 10, 60);
  push(100, 10, 60);
  push(300, 30, 200, "2026-10-07T12:01:00Z");
  parser.push({ type: "turn_context", payload: { model: "gpt-other" } });
  push(350, 35, 220, "2026-10-07T12:02:00Z");
  const rows = parser.finish();
  assert.equal(rows.length, 3);
  assert.equal(totals(rows).tokens, 385);
  assert.equal(totals(rows).cache, 220);
  assert.equal(rows[2].inputTokens, 50);
  assert.equal(rows[2].model, "gpt-other");
  assert.equal(rows[0].project, "project");
});

test("Codex resets do not subtract consumed tokens and copied fork history has identical event IDs", () => {
  const make = (id: string) => {
    const parser = codexParser(id);
    parser.push({
      type: "event_msg",
      timestamp: time,
      payload: {
        type: "token_count",
        info: { total_token_usage: { input_tokens: 100, output_tokens: 20 } },
      },
    });
    return parser;
  };
  const parser = make("a");
  assert.equal(parser.finish()[0].id, make("fork").finish()[0].id);
  parser.push({
    type: "event_msg",
    timestamp: "2026-10-07T12:02:00Z",
    payload: {
      type: "token_count",
      info: { total_token_usage: { input_tokens: 30, output_tokens: 5 } },
    },
  });
  assert.equal(totals(parser.finish()).tokens, 155);
});

test("Claude deduplicates streaming message snapshots and includes both input cache buckets once", () => {
  const parser = claudeParser("session");
  const push = (output: number, id = "msg-a") =>
    parser.push({
      type: "assistant",
      timestamp: time,
      sessionId: "session",
      cwd: "/work/project",
      message: {
        id,
        model: "claude-test",
        usage: {
          input_tokens: 10,
          cache_read_input_tokens: 80,
          cache_creation_input_tokens: 20,
          output_tokens: output,
        },
      },
    });
  push(5);
  push(15);
  push(2);
  push(10, "msg-b");
  const rows = parser.finish();
  assert.equal(rows.length, 2);
  assert.equal(totals(rows).tokens, 245);
  assert.equal(totals(rows).cache, 160);
  assert.equal(rows[0].outputTokens, 15);
});

test("Grok uses per-turn timestamps, full ledger input and exact USD tick conversion", () => {
  const rows = grokEvents(
    {
      sessionId: "s",
      turns: [
        {
          turnNumber: 1,
          endedAt: time,
          modelUsage: {
            "grok-test": {
              inputTokens: 100,
              outputTokens: 20,
              cachedReadTokens: 80,
              reasoningTokens: 15,
              totalTokens: 120,
              costUsdTicks: 1250000000,
            },
          },
        },
      ],
    },
    { info: { id: "s", cwd: "/work/project" } },
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].totalTokens, 120);
  assert.equal(rows[0].inputTokens, 100);
  assert.equal(rows[0].reasoningTokens, 15);
  assert.equal(rows[0].costUSD, 0.125);
  assert.equal(rows[0].timestamp, time.replace("Z", ".000Z"));
});

test("Grok zero or incomplete cost remains unknown", () => {
  for (const turn of [
    { costUsdTicks: 0 },
    { costUsdTicks: 1250000000, cost_is_partial: true },
  ]) {
    const rows = grokEvents(
      {
        sessionId: "s",
        turns: [{ ...turn, endedAt: time, inputTokens: 100, outputTokens: 20 }],
      },
      {},
    );
    assert.equal(rows[0].costUSD, null);
  }
});

test("Gemini supports legacy JSON and append-only JSONL metadata, retaining consumed tokens after rewind", () => {
  const message = {
    id: "m",
    type: "gemini",
    timestamp: time,
    model: "gemini-test",
    tokens: { input: 100, output: 20, thoughts: 10, cached: 80, total: 130 },
  };
  const parser = geminiParser("s");
  parser.push({
    sessionId: "s",
    directories: ["/work/project"],
    messages: [message],
  });
  parser.push(message);
  parser.push({ $rewindTo: "m" });
  assert.equal(parser.finish().length, 1);
  assert.equal(parser.finish()[0].outputTokens, 30);
  assert.equal(parser.finish()[0].reasoningTokens, 10);
  assert.equal(parser.finish()[0].project, "project");
  const jsonl = geminiParser("other");
  jsonl.push({ sessionId: "s", projectHash: "hash" });
  jsonl.push(message);
  assert.equal(jsonl.finish()[0].totalTokens, 130);
});

test("Gemini old message-only logs cannot be counted as token usage", () => {
  const parser = geminiParser("s");
  parser.push({
    sessionId: "s",
    messageId: "m",
    type: "gemini",
    message: "private conversation",
    timestamp: time,
  });
  assert.deepEqual(parser.finish(), []);
});

test("API imports normalize OpenAI, xAI, Claude and Gemini usage formats", () => {
  const rows = parseImport(
    JSON.stringify([
      {
        provider: "codex",
        timestamp: time,
        model: "gpt-test",
        usage: {
          input_tokens: 100,
          output_tokens: 20,
          input_tokens_details: { cached_tokens: 80 },
        },
      },
      {
        provider: "grok",
        timestamp: time,
        model: "grok-test",
        usage: { prompt_tokens: 100, completion_tokens: 20 },
      },
      {
        provider: "claude",
        timestamp: time,
        model: "claude-test",
        usage: {
          input_tokens: 10,
          cache_read_input_tokens: 80,
          cache_creation_input_tokens: 10,
          output_tokens: 20,
        },
      },
      {
        provider: "gemini",
        timestamp: time,
        model: "gemini-test",
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 15,
          thoughtsTokenCount: 5,
          cachedContentTokenCount: 80,
        },
      },
    ]),
  );
  assert.equal(rows.length, 4);
  rows.forEach((row) => {
    assert.equal(row.channel, "api");
    assert.equal(row.totalTokens, 120);
    assert.equal(row.costUSD, null);
  });
});

test("API imports are idempotent across repeated uploads, reject corrupt and invalid counts", () => {
  const record = {
    provider: "grok",
    id: "request",
    timestamp: time,
    model: "test",
    usage: { prompt_tokens: 10, completion_tokens: 2 },
  };
  const rows = parseImport(
    `${JSON.stringify(record)}\n${JSON.stringify(record)}\n`,
  );
  assert.equal(rows.length, 1);
  assert.equal(mergeImports(rows, rows).length, 1);
  for (const bad of [
    "not json",
    JSON.stringify({ ...record, timestamp: "bad" }),
    JSON.stringify({
      ...record,
      usage: { prompt_tokens: -10, completion_tokens: 2 },
    }),
    JSON.stringify({
      ...record,
      usage: { prompt_tokens: "10", completion_tokens: 2 },
    }),
    JSON.stringify({
      ...record,
      usage: {
        prompt_tokens: 10,
        completion_tokens: 2,
        prompt_tokens_details: { cached_tokens: -1 },
      },
    }),
  ])
    assert.throws(() => parseImport(bad));
});

test("Periods are inclusive and grouped by São Paulo local day; API and tools are never summed together", () => {
  const make = (timestamp: string, channel: "tool" | "api" = "tool") =>
    event("codex", {
      id: timestamp + channel,
      sessionId: "s",
      timestamp,
      channel,
      inputTokens: 100,
    });
  const rows = [
    make("2026-10-01T03:00:00Z"),
    make("2026-10-01T02:59:59Z"),
    make("2026-10-07T12:00:00Z"),
    make("2026-10-07T12:00:00Z", "api"),
    make("2026-10-08T03:00:00Z"),
  ];
  assert.equal(dayKey("2026-10-01T02:59:59Z"), "2026-09-30");
  const chosen = selectEvents(
    rows,
    { channel: "tool", days: 7, provider: "all", project: "" },
    new Date(time),
  );
  assert.equal(chosen.length, 2);
  assert.equal(
    dailySeries(chosen, 7, new Date(time)).reduce(
      (sum, day) => sum + day.total,
      0,
    ),
    200,
  );
});

test("Compacting for browser delivery preserves tokens, session counts and partial cost coverage", () => {
  const a = event("codex", {
    id: "a",
    sessionId: "s",
    timestamp: time,
    inputTokens: 100,
    outputTokens: 20,
    cachedTokens: 80,
    costUSD: 0.2,
  });
  const b = event("codex", {
    id: "b",
    sessionId: "s",
    timestamp: time,
    inputTokens: 300,
    outputTokens: 60,
    cachedTokens: 120,
  });
  const compact = compactEvents([a, b]);
  assert.equal(compact.length, 2);
  assert.deepEqual(totals(compact), totals([a, b]));
  assert.equal(totals(compact).costsKnown, 1);
  assert.equal(totals(compact).records, 2);
});

test("Unknown costs remain null and CSV protects spreadsheet formulas and embedded separators", () => {
  const row = event("grok", {
    id: "a",
    sessionId: "s",
    timestamp: time,
    model: "=HYPERLINK()",
    project: 'project;"test',
    inputTokens: 10,
  });
  const csv = exportCSV([row]);
  assert.ok(csv.includes("'=HYPERLINK()"));
  assert.ok(csv.includes('project;""test'));
  assert.equal(row.costUSD, null);
  assert.ok(!JSON.stringify(row).includes("content"));
});

test("Local endpoints reject foreign Host, cross-site fetches and unauthorized mutation origins", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://127.0.0.1:3000/api/usage", { headers });
  assert.equal(isLocalRequest(req({ host: "127.0.0.1:3000" })), true);
  assert.equal(isLocalRequest(req({ host: "evil.example" })), false);
  assert.equal(
    isLocalRequest(
      req({ host: "127.0.0.1:3000", origin: "https://evil.example" }),
    ),
    false,
  );
  assert.equal(
    isLocalRequest(
      req({ host: "127.0.0.1:3000", "sec-fetch-site": "cross-site" }),
    ),
    false,
  );
  assert.equal(isLocalRequest(req({ host: "127.0.0.1:3000" }), true), false);
  assert.equal(
    isLocalRequest(
      req({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }),
      true,
    ),
    true,
  );
});
