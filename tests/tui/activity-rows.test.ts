import test from "node:test";
import assert from "node:assert/strict";
import { activityRows } from "../../src/tui/activity-rows";
import { buildContext } from "../../src/tui/context";
import { createTuiI18n } from "../../src/tui/i18n";
import { payload } from "./fixtures";

const filters = {
  channel: "tool",
  days: 30,
  provider: "all",
  project: "",
} as const;
const { events, pricing } = buildContext(payload(), filters, "", "session");

test("session rows are newest first with cost coverage", () => {
  const rows = activityRows(events, "session", "", pricing);
  assert.deepEqual(
    rows.map((row) => [row.label, row.providers[0], row.tokens]),
    [
      ["project-alpha", "codex", 1200],
      ["project-beta", "claude", 5000],
      ["project-alpha", "grok", 1000],
    ],
  );
  assert.equal(rows[0].costKind, "est."); // priced by the custom table
  assert.equal(rows[1].costKind, null); // no price, no native cost
  assert.equal(rows[1].costUSD, null);
  assert.equal(rows[1].uncovered, 1);
  assert.equal(rows[2].costKind, "actual");
  assert.equal(rows[2].costUSD, 0.05);
});

test("model, project and day grouping sum tokens", () => {
  const byProject = activityRows(events, "project", "", pricing);
  assert.deepEqual(
    byProject.map((row) => [row.label, row.tokens]),
    [
      ["project-beta", 5000],
      ["project-alpha", 2200],
    ],
  );
  assert.equal(byProject[1].detail, "Codex, Grok");
  const byModel = activityRows(events, "model", "", pricing);
  assert.equal(byModel.length, 3);
  assert.equal(byModel[0].label, "unpriced-model");
  const byDay = activityRows(events, "day", "", pricing);
  assert.deepEqual(
    byDay.map((row) => [row.label, row.tokens]),
    [
      ["10/07", 1200],
      ["10/06", 5000],
      ["10/03", 1000],
    ],
  );
  assert.equal(byDay[0].detail, "1 session");
  const pt = activityRows(events, "day", "", pricing, createTuiI18n("pt-BR"));
  assert.equal(pt[0].label, "07/10");
  assert.equal(pt[0].detail, "1 sessão");
});

test("search matches label, detail and service name, ignoring case", () => {
  assert.equal(activityRows(events, "session", "BETA", pricing).length, 1);
  assert.equal(
    activityRows(events, "session", "grok-synth", pricing).length,
    1,
  );
  assert.equal(activityRows(events, "session", "claude", pricing).length, 1);
  assert.equal(activityRows(events, "session", "nothing", pricing).length, 0);
  assert.equal(activityRows(events, "session", "  ", pricing).length, 3);
});

test("buildContext filters by channel and period relative to the snapshot", () => {
  assert.equal(
    buildContext(payload(), filters, "", "session").events.length,
    3,
  );
  assert.equal(
    buildContext(payload(), { ...filters, channel: "api" }, "", "session")
      .events.length,
    1,
  );
  assert.equal(
    buildContext(payload(), { ...filters, days: 7 }, "", "session").events
      .length,
    3,
  );
  assert.equal(
    buildContext(payload(), { ...filters, days: 3 }, "", "session").events
      .length,
    2,
  );
});
