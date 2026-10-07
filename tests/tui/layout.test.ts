import test from "node:test";
import assert from "node:assert/strict";
import { fitSections, overviewLayout } from "../../src/tui/layout";

test("fitSections serves minimums by priority, then distributes the rest", () => {
  assert.deepEqual(
    fitSections(10, [
      { key: "a", min: 4, max: 6 },
      { key: "b", min: 4, max: 6 },
      { key: "c", min: 4, max: 6 },
    ]),
    { a: 6, b: 4, c: 0 },
  );
});

test("overview layout at the 80x24 minimum keeps chart, services and models", () => {
  // 24 rows minus header, filters and footer.
  const layout = overviewLayout(80, 21, 0);
  assert.equal(layout.wide, false);
  assert.equal(layout.cardColumns, 3);
  assert.equal(layout.chartRows, 3);
  assert.equal(layout.showServices, true);
  assert.equal(layout.modelRows, 2);
  assert.equal(layout.projectRows, 0);
});

test("100 columns go side by side but keep three cards per line", () => {
  const layout = overviewLayout(100, 37, 0);
  assert.equal(layout.wide, true);
  assert.equal(layout.cardColumns, 3);
  assert.equal(layout.cardWidth, 33);
});

test("wide terminals place services beside the chart and grow both", () => {
  const layout = overviewLayout(120, 37, 0);
  assert.equal(layout.wide, true);
  assert.equal(layout.cardColumns, 5);
  assert.equal(layout.cardWidth, 24);
  assert.equal(layout.chartRows, 9);
  assert.equal(layout.modelRows, 8);
  assert.equal(layout.projectRows, 8);
});

test("notes take lines away from the sections", () => {
  assert.ok(
    overviewLayout(80, 21, 2).modelRows < overviewLayout(80, 21, 0).modelRows,
  );
  const tiny = overviewLayout(120, 8, 0);
  assert.equal(tiny.chartRows, 0);
  assert.equal(tiny.showServices, false);
});
