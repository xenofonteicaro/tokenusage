import test from "node:test";
import assert from "node:assert/strict";
import {
  initialFilters,
  nextChannel,
  nextPeriod,
  nextProvider,
  projectOptions,
} from "../../src/tui/filters";
import type { UsageEvent } from "../../src/lib/types";

test("period cycles 7 -> 30 -> 90 -> 7", () => {
  assert.equal(nextPeriod(7), 30);
  assert.equal(nextPeriod(30), 90);
  assert.equal(nextPeriod(90), 7);
  assert.equal(nextPeriod(15), 7);
});

test("provider cycles through every service and back to all", () => {
  const seen: string[] = [];
  let current: ReturnType<typeof nextProvider> = "all";
  for (let step = 0; step < 5; step++) {
    current = nextProvider(current);
    seen.push(current);
  }
  assert.deepEqual(seen, ["codex", "claude", "grok", "gemini", "all"]);
});

test("channel toggles and initial filters follow the options", () => {
  assert.equal(nextChannel("tool"), "api");
  assert.equal(nextChannel("api"), "tool");
  assert.deepEqual(
    initialFilters({ once: false, help: false, days: 7, channel: "api" }),
    { channel: "api", days: 7, provider: "all", project: "" },
  );
});

test("project options respect channel and service, sorted and unique", () => {
  const row = (
    provider: UsageEvent["provider"],
    channel: UsageEvent["channel"],
    project: string,
  ) => ({ provider, channel, project }) as UsageEvent;
  const events = [
    row("codex", "tool", "zeta"),
    row("claude", "tool", "alpha"),
    row("claude", "tool", "alpha"),
    row("claude", "api", "from-api"),
  ];
  const filters = {
    channel: "tool",
    days: 30,
    provider: "all",
    project: "",
  } as const;
  assert.deepEqual(projectOptions(events, filters), ["alpha", "zeta"]);
  assert.deepEqual(projectOptions(events, { ...filters, provider: "codex" }), [
    "zeta",
  ]);
  assert.deepEqual(projectOptions(events, { ...filters, channel: "api" }), [
    "from-api",
  ]);
});
