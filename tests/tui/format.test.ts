import test from "node:test";
import assert from "node:assert/strict";
import {
  bar,
  clampCursor,
  percent,
  plural,
  shortDate,
  tint,
  visibleWindow,
} from "../../src/tui/format";

test("bar fills proportionally and clamps", () => {
  assert.equal(bar(0.5, 10), "█████░░░░░");
  assert.equal(bar(2, 3), "███");
  assert.equal(bar(-1, 3), "░░░");
  assert.equal(bar(Number.NaN, 4), "░░░░");
});

test("percent uses a decimal comma", () => {
  assert.equal(percent(0.1234), "12,3%");
  assert.equal(percent(0.5, 0), "50%");
});

test("shortDate turns an ISO day into dd/MM", () => {
  assert.equal(shortDate("2026-10-07"), "07/10");
});

test("visibleWindow keeps the cursor in view", () => {
  assert.deepEqual(visibleWindow(100, 0, 10), { start: 0, end: 10 });
  assert.deepEqual(visibleWindow(100, 50, 10), { start: 45, end: 55 });
  assert.deepEqual(visibleWindow(100, 99, 10), { start: 90, end: 100 });
  assert.deepEqual(visibleWindow(3, 1, 10), { start: 0, end: 3 });
  assert.deepEqual(visibleWindow(0, 0, 10), { start: 0, end: 0 });
});

test("clampCursor stays inside the list", () => {
  assert.equal(clampCursor(-3, 5), 0);
  assert.equal(clampCursor(9, 5), 4);
  assert.equal(clampCursor(2, 0), 0);
});

test("tint drops colors when NO_COLOR is set", () => {
  const previous = process.env.NO_COLOR;
  try {
    delete process.env.NO_COLOR;
    assert.equal(tint("#fff"), "#fff");
    process.env.NO_COLOR = "1";
    assert.equal(tint("#fff"), undefined);
  } finally {
    if (previous === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = previous;
  }
});

test("plural picks the singular only for one", () => {
  assert.equal(plural(1, "modelo", "modelos"), "1 modelo");
  assert.equal(plural(0, "modelo", "modelos"), "0 modelos");
  assert.equal(plural(3, "modelo", "modelos"), "3 modelos");
});
