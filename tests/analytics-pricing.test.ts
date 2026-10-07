import test from "node:test";
import assert from "node:assert/strict";
import { compactEvents, totals, dayKey } from "../src/lib/analytics";
import type { UsageEvent } from "../src/lib/types";

const event: UsageEvent = {
  id: "synthetic",
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

test("compaction preserves native/estimated coverage, including zero native costs", () => {
  const events = [
    event,
    { ...event, id: "native", costUSD: 0.123456789 },
    { ...event, id: "free", costUSD: 0 },
  ];
  const compact = compactEvents(events);
  assert.equal(compact.length, 2);
  const config = {
    usdToBrlRate: 6,
    customPrices: {
      "gpt-4o-mini": { inputPer1M: 2, outputPer1M: 3, cacheReadPer1M: 1 },
    },
  };
  assert.deepEqual(totals(compact, config), totals(events, config));
  assert.equal(totals(compact, config).estimatedRecords, 1);
  assert.equal(totals(compact, config).costsKnown, 2);
  assert.equal(totals(compact, config).realCostUSD, 0.123456789);
  assert.equal(compact.find((row) => row.costUSD === null)?.inputTokens, 100);
  assert.equal(event.costUSD, null);
});

test("tiny costs aggregate before display rounding with and without compaction", () => {
  const events = Array.from({ length: 1000 }, (_, index) => ({
    ...event,
    id: `tiny-${index}`,
    inputTokens: 1,
    cachedTokens: 0,
    outputTokens: 0,
    totalTokens: 1,
  }));
  const raw = totals(events);
  const compact = totals(compactEvents(events));
  assert.ok(Math.abs(raw.estimatedCostUSD - 0.00015) < 1e-12);
  assert.ok(Math.abs(raw.totalCostBRL - 0.00015 * 5.75) < 1e-12);
  assert.ok(Math.abs(raw.totalCostUSD - compact.totalCostUSD) < 1e-12);
  assert.equal(compact.estimatedRecords, 1000);
});

test("unknown-model records remain uncovered and day grouping stays in Sao Paulo", () => {
  const summary = totals([{ ...event, model: "gpt-4o-unrelated" }]);
  assert.equal(summary.totalCostUSD, 0);
  assert.equal(summary.costsKnown, 0);
  assert.equal(summary.estimatedRecords, 0);
  assert.equal(dayKey(event.timestamp), "2026-10-06");
});

test("usage API computes channel-specific costs with saved settings and preserves native events", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const fixture = await mkdtemp(join(tmpdir(), "tokenusage-pricing-test-"));
  const previousData = process.env.TOKENUSAGE_DATA_DIR;
  const previousProfile = process.env.TOKENUSAGE_PROFILE_DIR;
  process.env.TOKENUSAGE_DATA_DIR = fixture;
  process.env.TOKENUSAGE_PROFILE_DIR = join(fixture, "empty-profile");
  try {
    await writeFile(
      join(fixture, "api-usage.json"),
      JSON.stringify([
        event,
        { ...event, id: "synthetic-native", costUSD: 0.123456789 },
      ]),
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
    const { GET } = await import("../src/app/api/usage/route");
    const response = await GET(
      new Request("http://127.0.0.1:3000/api/usage", {
        headers: { host: "127.0.0.1:3000" },
      }),
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.events.length, 2);
    assert.equal(
      payload.events.find((row: UsageEvent) => row.costUSD !== null).costUSD,
      0.123456789,
    );
    assert.equal(payload.costMetrics.api.realCostUSD, 0.123456789);
    assert.equal(payload.costMetrics.api.estimatedCostUSD, 0.00022);
    assert.equal(payload.costMetrics.api.estimatedCostBRL, 0.00022 * 6);
    assert.equal(payload.costMetrics.api.estimatedRecords, 1);
    assert.equal(payload.costMetrics.tool.totalCostUSD, 0);
    assert.equal(payload.timezone, "America/Sao_Paulo");
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  } finally {
    if (previousData === undefined) delete process.env.TOKENUSAGE_DATA_DIR;
    else process.env.TOKENUSAGE_DATA_DIR = previousData;
    if (previousProfile === undefined)
      delete process.env.TOKENUSAGE_PROFILE_DIR;
    else process.env.TOKENUSAGE_PROFILE_DIR = previousProfile;
    await rm(fixture, { recursive: true, force: true });
  }
});
