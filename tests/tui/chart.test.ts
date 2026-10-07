import test from "node:test";
import assert from "node:assert/strict";
import {
  bucketSeries,
  stackedColumns,
  type Bucket,
  type DayPoint,
} from "../../src/tui/chart";

const day = (
  date: string,
  values: Partial<Record<string, number>>,
): DayPoint => {
  const point = { date, codex: 0, claude: 0, grok: 0, gemini: 0, ...values };
  return {
    ...point,
    total: point.codex + point.claude + point.grok + point.gemini,
  };
};
const bucket = (values: Partial<Record<string, number>>): Bucket => {
  const point = day("2026-10-07", values);
  return {
    start: point.date,
    end: point.date,
    total: point.total,
    values: {
      codex: point.codex,
      claude: point.claude,
      grok: point.grok,
      gemini: point.gemini,
    },
  };
};

test("bucketSeries merges consecutive days to fit the width", () => {
  const series = [
    day("2026-10-01", { codex: 1 }),
    day("2026-10-02", { codex: 2 }),
    day("2026-10-03", { claude: 3 }),
    day("2026-10-04", {}),
    day("2026-10-05", { grok: 5 }),
    day("2026-10-06", { grok: 1 }),
  ];
  const buckets = bucketSeries(series, 3);
  assert.equal(buckets.length, 3);
  assert.deepEqual(
    buckets.map((item) => [item.start, item.end, item.total]),
    [
      ["2026-10-01", "2026-10-02", 3],
      ["2026-10-03", "2026-10-04", 3],
      ["2026-10-05", "2026-10-06", 6],
    ],
  );
  assert.equal(bucketSeries(series, 10).length, 6);
});

test("stackedColumns draws top-down rows scaled to the tallest bucket", () => {
  const rows = stackedColumns(
    [bucket({ codex: 100 }), bucket({ claude: 50 })],
    2,
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], [
    { char: "█", provider: "codex" },
    { char: " ", provider: null },
  ]);
  assert.deepEqual(rows[1], [
    { char: "█", provider: "codex" },
    { char: "█", provider: "claude" },
  ]);
});

test("tiny non-zero buckets still show one eighth", () => {
  const rows = stackedColumns(
    [bucket({ codex: 1 }), bucket({ codex: 1000 })],
    1,
  );
  assert.deepEqual(rows[0][0], { char: "▁", provider: "codex" });
});

test("a mixed bar takes the color of the larger share, first on ties", () => {
  const rows = stackedColumns([bucket({ codex: 50, claude: 50 })], 1);
  assert.deepEqual(rows[0][0], { char: "█", provider: "codex" });
  const lopsided = stackedColumns([bucket({ codex: 10, claude: 90 })], 1);
  assert.deepEqual(lopsided[0][0], { char: "█", provider: "claude" });
});

test("empty data renders blank rows", () => {
  const rows = stackedColumns([bucket({}), bucket({})], 3);
  assert.equal(rows.length, 3);
  assert.ok(rows.flat().every((cell) => cell.char === " " && !cell.provider));
});
