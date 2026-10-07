import test from "node:test";
import assert from "node:assert/strict";
import {
  findModelPrice,
  calculateEventCost,
  calculateCacheSavings,
} from "../src/lib/pricing/calculator";
import type { UsageEvent } from "../src/lib/types";

test("findModelPrice resolves exact matches, prefix variations and custom overrides", () => {
  // Exact match
  const sonnet = findModelPrice("claude-3-7-sonnet");
  assert.ok(sonnet);
  assert.equal(sonnet?.inputPer1M, 3.0);
  assert.equal(sonnet?.outputPer1M, 15.0);
  assert.equal(sonnet?.cacheReadPer1M, 0.3);

  // Prefix with date snapshot
  const sonnetSnapshot = findModelPrice("claude-3-7-sonnet-20250219");
  assert.ok(sonnetSnapshot);
  assert.equal(sonnetSnapshot?.inputPer1M, 3.0);

  // OpenAI model prefix
  const gpt4o = findModelPrice("gpt-4o-2024-08-06");
  assert.ok(gpt4o);
  assert.equal(gpt4o?.inputPer1M, 2.5);

  // Custom price override
  const custom = findModelPrice("custom-llm", {
    "custom-llm": { inputPer1M: 10, outputPer1M: 20, cacheReadPer1M: 1 },
  });
  assert.ok(custom);
  assert.equal(custom?.inputPer1M, 10);

  // Unknown model
  const unknown = findModelPrice("some-nonexistent-model-xyz");
  assert.equal(unknown, null);
});

test("calculateEventCost preserves native cost and flags isEstimated=false", () => {
  const event: UsageEvent = {
    id: "grok-1",
    provider: "grok",
    channel: "tool",
    timestamp: "2026-10-07T12:00:00Z",
    model: "grok-2",
    project: "proj",
    sessionId: "sess-1",
    inputTokens: 100_000,
    outputTokens: 20_000,
    cachedTokens: 50_000,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    totalTokens: 120_000,
    costUSD: 0.42, // Native cost reported by Grok
  };

  const cost = calculateEventCost(event, { usdToBrlRate: 6.0 });
  assert.equal(cost.isEstimated, false);
  assert.equal(cost.costUSD, 0.42);
  assert.equal(cost.costBRL, 2.52);
  // Cache savings still calculated from model rates
  assert.ok(cost.cacheSavingsUSD > 0);
});

test("calculateEventCost estimates cost accurately when native cost is missing", () => {
  const event: UsageEvent = {
    id: "claude-1",
    provider: "claude",
    channel: "tool",
    timestamp: "2026-10-07T12:00:00Z",
    model: "claude-3-7-sonnet",
    project: "proj",
    sessionId: "sess-2",
    // 1M input total: 400k cached, 600k fresh input
    inputTokens: 1_000_000,
    outputTokens: 100_000,
    cachedTokens: 400_000,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    totalTokens: 1_100_000,
    costUSD: null,
  };

  // claude-3-7-sonnet rates: input: $3, output: $15, cacheRead: $0.30
  // fresh input: 600,000 * 3 / 1M = $1.80
  // cached input: 400,000 * 0.30 / 1M = $0.12
  // output: 100,000 * 15 / 1M = $1.50
  // total expected: 1.80 + 0.12 + 1.50 = $3.42
  // cache savings: 400,000 * (3 - 0.30) / 1M = $1.08

  const cost = calculateEventCost(event, { usdToBrlRate: 5.0 });
  assert.equal(cost.isEstimated, true);
  assert.equal(cost.costUSD, 3.42);
  assert.equal(cost.costBRL, 17.1);
  assert.equal(cost.cacheSavingsUSD, 1.08);
  assert.equal(cost.cacheSavingsBRL, 5.4);
});

test("calculateCacheSavings returns 0 when no tokens are cached", () => {
  const event: UsageEvent = {
    id: "no-cache",
    provider: "claude",
    channel: "tool",
    timestamp: "2026-10-07T12:00:00Z",
    model: "claude-3-5-haiku",
    project: "proj",
    sessionId: "sess-3",
    inputTokens: 50_000,
    outputTokens: 10_000,
    cachedTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    totalTokens: 60_000,
    costUSD: null,
  };

  const savings = calculateCacheSavings([event], { usdToBrlRate: 5.75 });
  assert.equal(savings.tokensSaved, 0);
  assert.equal(savings.amountUSD, 0);
  assert.equal(savings.amountBRL, 0);
});

test("calculateEventCost handles unknown model gracefully", () => {
  const event: UsageEvent = {
    id: "unknown-1",
    provider: "codex",
    channel: "tool",
    timestamp: "2026-10-07T12:00:00Z",
    model: "completely-unknown-custom-model",
    project: "proj",
    sessionId: "sess-4",
    inputTokens: 50_000,
    outputTokens: 10_000,
    cachedTokens: 5_000,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    totalTokens: 60_000,
    costUSD: null,
  };

  const cost = calculateEventCost(event);
  assert.equal(cost.isEstimated, false);
  assert.equal(cost.costUSD, null);
  assert.equal(cost.costBRL, null);
  assert.equal(cost.cacheSavingsUSD, 0);
});
