import test from "node:test";
import assert from "node:assert/strict";
import { selectEvents, type Filters } from "../src/lib/analytics";
import { overviewMetrics } from "../src/lib/overview-metrics";
import {
  defaultSettings,
  type Snapshot,
  type UsageEvent,
} from "../src/lib/types";

const base: UsageEvent = {
  id: "base",
  provider: "codex",
  channel: "tool",
  timestamp: "2026-10-07T12:00:00Z",
  model: "gpt-4o-mini",
  project: "alpha",
  sessionId: "s1",
  inputTokens: 1000,
  cachedTokens: 800,
  outputTokens: 200,
  cacheWriteTokens: 0,
  reasoningTokens: 0,
  totalTokens: 1200,
  costUSD: null,
};
const events: UsageEvent[] = [
  base,
  {
    ...base,
    id: "other",
    provider: "claude",
    timestamp: "2026-10-05T12:00:00Z",
    model: "unknown-model",
    project: "beta",
    sessionId: "s2",
    inputTokens: 100,
    cachedTokens: 0,
    outputTokens: 50,
    totalTokens: 150,
  },
  {
    ...base,
    id: "previous",
    timestamp: "2026-09-28T12:00:00Z",
    model: "unknown-model",
    sessionId: "s0",
    inputTokens: 500,
    cachedTokens: 0,
    outputTokens: 100,
    totalTokens: 600,
  },
];
const filters: Filters = {
  channel: "tool",
  days: 7,
  provider: "all",
  project: "",
};
const snapshot: Snapshot = {
  events,
  sources: [],
  generatedAt: "2026-10-07T15:00:00Z",
  timezone: "America/Sao_Paulo",
  historyDays: 90,
  settings: {
    ...defaultSettings,
    monthlyTokenGoal: 10_000,
    subscriptions: { codex: 20, claude: 100, grok: null, gemini: null },
    customPricing: {
      "gpt-4o-mini": { inputPer1M: 2, outputPer1M: 3, cacheReadPer1M: 1 },
    },
  },
};
const selected = selectEvents(events, filters, new Date(snapshot.generatedAt));

test("overview metrics combine totals, cache savings and coverage", () => {
  const result = overviewMetrics(snapshot, selected, filters);
  assert.equal(result.metrics.tokens, 1350);
  assert.deepEqual(result.values, {
    codex: 1200,
    claude: 150,
    grok: 0,
    gemini: 0,
  });
  assert.equal(result.models.length, 2);
  assert.equal(result.projects[0].name, "alpha");
  // One record is priced by the custom table, one has no price at all.
  assert.equal(result.unestimatedRecords, 1);
  // saved 0.0008 of 0.0018 modeled cost + 0.0008 savings.
  assert.ok(Math.abs(result.savingsShare - 0.0008 / 0.0026) < 1e-9);
  assert.equal(result.hasCost, true);
  assert.equal(result.hasSavings, true);
  assert.equal(result.unpricedCache, 0);
  assert.equal(result.cacheEvents.length, 1);
  assert.deepEqual(
    result.uncoveredModels.map((row) => row.name),
    ["unknown-model"],
  );
  assert.equal(result.rate, 5.75);
  assert.deepEqual(result.available, []);
  assert.equal(result.subscriptions, 120);
  assert.equal(result.goal, 10_000);
  assert.equal(result.monthTokens, 1350);
});

test("overview metrics compare against the previous period", () => {
  const result = overviewMetrics(snapshot, selected, filters);
  assert.equal(result.change, (1350 - 600) / 600);
  const long = overviewMetrics(snapshot, selected, { ...filters, days: 90 });
  assert.equal(long.change, null);
});

test("overview metrics stay neutral without data or goal", () => {
  const empty = overviewMetrics(
    {
      ...snapshot,
      settings: { ...defaultSettings },
    },
    [],
    filters,
  );
  assert.equal(empty.metrics.tokens, 0);
  assert.equal(empty.models.length, 0);
  assert.equal(empty.savingsShare, 0);
  assert.equal(empty.hasCost, false);
  assert.equal(empty.hasSavings, false);
  assert.equal(empty.unestimatedRecords, 0);
  assert.equal(empty.subscriptions, 0);
  assert.equal(empty.goal, null);
});

test("cache savings are unknown, not zero, when no cached event has a tariff", () => {
  const unpriced = [
    { ...base, id: "unpriced", model: "unknown-model", cachedTokens: 500 },
  ];
  const result = overviewMetrics(snapshot, unpriced, filters);
  assert.equal(result.hasSavings, false);
  assert.equal(result.unpricedCache, 1);
  assert.equal(result.cacheEvents.length, 1);
  assert.equal(result.hasCost, false);
});

test("sources that are connected on the channel are reported as available", () => {
  const connected = {
    ...snapshot,
    sources: [
      {
        id: "codex",
        provider: "codex" as const,
        channel: "tool" as const,
        name: "Codex",
        state: "connected" as const,
        files: 1,
        events: 1,
        detail: "",
        location: "",
        latest: null,
        warnings: 0,
      },
      {
        id: "claude-api",
        provider: "claude" as const,
        channel: "api" as const,
        name: "Claude API",
        state: "connected" as const,
        files: 1,
        events: 1,
        detail: "",
        location: "",
        latest: null,
        warnings: 0,
      },
    ],
  };
  assert.deepEqual(overviewMetrics(connected, selected, filters).available, [
    "codex",
  ]);
});
