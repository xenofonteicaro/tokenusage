import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { UsageEvent } from "../../src/lib/types";

const apiEvent: UsageEvent = {
  id: "synthetic-api",
  provider: "codex",
  channel: "api",
  timestamp: "2026-10-07T01:00:00Z",
  model: "gpt-4o-mini",
  project: "synthetic",
  sessionId: "synthetic",
  inputTokens: 100,
  cachedTokens: 10,
  outputTokens: 10,
  cacheWriteTokens: 0,
  reasoningTokens: 0,
  totalTokens: 110,
  costUSD: null,
};

test("buildUsagePayload merges imported logs, sources and channel costs", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "tokenusage-snapshot-test-"));
  const previousData = process.env.TOKENUSAGE_DATA_DIR;
  const previousProfile = process.env.TOKENUSAGE_PROFILE_DIR;
  process.env.TOKENUSAGE_DATA_DIR = fixture;
  process.env.TOKENUSAGE_PROFILE_DIR = join(fixture, "empty-profile");
  try {
    await writeFile(
      join(fixture, "api-usage.json"),
      JSON.stringify([apiEvent]),
    );
    await writeFile(
      join(fixture, "settings.json"),
      JSON.stringify({
        monthlyTokenGoal: null,
        subscriptions: { codex: null, claude: null, grok: null, gemini: null },
        usdToBrlRate: 6,
        customPricing: {
          "gpt-4o-mini": { inputPer1M: 2, outputPer1M: 3, cacheReadPer1M: 1 },
        },
      }),
    );
    const { buildUsagePayload } = await import("../../src/lib/usage-snapshot");
    const payload = await buildUsagePayload();
    assert.equal(payload.events.length, 1);
    assert.equal(
      payload.sources.filter((row) => row.channel === "tool").length,
      4,
    );
    const api = payload.sources.filter((row) => row.channel === "api");
    assert.equal(api.length, 4);
    assert.equal(
      api.find((row) => row.provider === "codex")?.state,
      "connected",
    );
    assert.equal(
      api.find((row) => row.provider === "claude")?.state,
      "missing",
    );
    assert.equal(payload.costMetrics.api.estimatedRecords, 1);
    assert.equal(payload.costMetrics.api.estimatedCostBRL, 0.00022 * 6);
    assert.equal(payload.costMetrics.tool.records, 0);
    assert.equal(payload.timezone, "America/Sao_Paulo");
    assert.equal(payload.historyDays, 90);
    assert.ok(!Number.isNaN(Date.parse(payload.generatedAt)));
  } finally {
    if (previousData === undefined) delete process.env.TOKENUSAGE_DATA_DIR;
    else process.env.TOKENUSAGE_DATA_DIR = previousData;
    if (previousProfile === undefined)
      delete process.env.TOKENUSAGE_PROFILE_DIR;
    else process.env.TOKENUSAGE_PROFILE_DIR = previousProfile;
    await rm(fixture, { recursive: true, force: true });
  }
});
