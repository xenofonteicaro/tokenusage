export interface SectionSpec {
  key: string;
  min: number;
  max: number;
}

// Give each section its minimum height in priority order (skipping the ones
// that do not fit), then hand leftover lines out up to each maximum.
export function fitSections(
  available: number,
  sections: SectionSpec[],
): Record<string, number> {
  const sizes: Record<string, number> = {};
  let left = available;
  for (const section of sections) {
    sizes[section.key] = 0;
    if (section.min <= left) {
      sizes[section.key] = section.min;
      left -= section.min;
    }
  }
  for (const section of sections) {
    if (!sizes[section.key]) continue;
    const extra = Math.min(left, section.max - sizes[section.key]);
    sizes[section.key] += extra;
    left -= extra;
  }
  return sizes;
}

export interface OverviewLayout {
  cardColumns: number;
  cardWidth: number;
  wide: boolean;
  chartRows: number;
  showServices: boolean;
  modelRows: number;
  projectRows: number;
}

const CARD_COUNT = 5;
const CARD_LINES = 3;
const CHART_CHROME = 3; // title, date axis and legend
const TABLE_CHROME = 2; // title and column header

export function overviewLayout(
  width: number,
  height: number,
  noteLines: number,
): OverviewLayout {
  const wide = width >= 100;
  const cardColumns = width >= 120 ? CARD_COUNT : 3;
  const available =
    height - Math.ceil(CARD_COUNT / cardColumns) * CARD_LINES - noteLines;
  const base = {
    cardColumns,
    cardWidth: Math.floor(width / cardColumns),
    wide,
  };
  if (wide) {
    const sizes = fitSections(available, [
      { key: "chart", min: 8, max: 12 },
      { key: "rankings", min: 5, max: 10 },
    ]);
    const rows = sizes.rankings ? sizes.rankings - TABLE_CHROME : 0;
    return {
      ...base,
      chartRows: sizes.chart ? sizes.chart - CHART_CHROME : 0,
      showServices: sizes.chart > 0,
      modelRows: rows,
      projectRows: rows,
    };
  }
  const sizes = fitSections(available, [
    { key: "chart", min: 6, max: 11 },
    { key: "services", min: 5, max: 5 },
    { key: "models", min: 4, max: 9 },
    { key: "projects", min: 4, max: 9 },
  ]);
  return {
    ...base,
    chartRows: sizes.chart ? sizes.chart - CHART_CHROME : 0,
    showServices: sizes.services > 0,
    modelRows: sizes.models ? sizes.models - TABLE_CHROME : 0,
    projectRows: sizes.projects ? sizes.projects - TABLE_CHROME : 0,
  };
}
