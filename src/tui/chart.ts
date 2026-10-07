import { PROVIDERS, type Provider } from "../lib/types";

export type DayPoint = { date: string; total: number } & Record<
  Provider,
  number
>;

export interface Bucket {
  start: string;
  end: string;
  values: Record<Provider, number>;
  total: number;
}

export interface Cell {
  char: string;
  provider: Provider | null;
}

const EIGHTHS = " ▁▂▃▄▅▆▇█";
const emptyValues = (): Record<Provider, number> => ({
  codex: 0,
  claude: 0,
  grok: 0,
  gemini: 0,
});

// Merge consecutive days so the series fits in `maxColumns` columns.
export function bucketSeries(series: DayPoint[], maxColumns: number): Bucket[] {
  const size = Math.max(1, Math.ceil(series.length / Math.max(1, maxColumns)));
  const buckets: Bucket[] = [];
  for (let index = 0; index < series.length; index += size) {
    const days = series.slice(index, index + size);
    const values = emptyValues();
    for (const day of days)
      for (const provider of PROVIDERS) values[provider] += day[provider];
    buckets.push({
      start: days[0].date,
      end: days[days.length - 1].date,
      values,
      total: PROVIDERS.reduce((sum, provider) => sum + values[provider], 0),
    });
  }
  return buckets;
}

// Split `filled` eighths between providers by share (largest remainder).
function allocate(
  values: Record<Provider, number>,
  total: number,
  filled: number,
) {
  const result = emptyValues();
  if (!total || !filled) return result;
  const exact = PROVIDERS.map(
    (provider) => (values[provider] / total) * filled,
  );
  let used = 0;
  PROVIDERS.forEach((provider, index) => {
    result[provider] = Math.floor(exact[index]);
    used += result[provider];
  });
  const order = PROVIDERS.map((provider, index) => ({
    provider,
    remainder: exact[index] - result[provider],
  })).sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; used < filled; index = (index + 1) % order.length) {
    if (values[order[index].provider] > 0) {
      result[order[index].provider]++;
      used++;
    }
  }
  return result;
}

// Rows from top to bottom; each cell is a block character plus the provider
// that owns most of it. Bars are stacked in PROVIDERS order, bottom first.
export function stackedColumns(buckets: Bucket[], height: number): Cell[][] {
  const max = Math.max(0, ...buckets.map((bucket) => bucket.total));
  const columns = buckets.map((bucket) => {
    const exact = max ? Math.round((bucket.total / max) * height * 8) : 0;
    const filled = bucket.total > 0 ? Math.max(1, exact) : 0;
    return {
      filled,
      segments: allocate(bucket.values, bucket.total, filled),
    };
  });
  const rows: Cell[][] = [];
  for (let row = height - 1; row >= 0; row--) {
    const low = row * 8;
    rows.push(
      columns.map(({ filled, segments }) => {
        const fill = Math.min(8, Math.max(0, filled - low));
        if (!fill) return { char: " ", provider: null };
        let start = 0;
        let best: Provider | null = null;
        let bestOverlap = 0;
        for (const provider of PROVIDERS) {
          const end = start + segments[provider];
          const overlap = Math.min(end, low + 8) - Math.max(start, low);
          if (overlap > bestOverlap) {
            best = provider;
            bestOverlap = overlap;
          }
          start = end;
        }
        return { char: EIGHTHS[fill], provider: best };
      }),
    );
  }
  return rows;
}
