import { calculateEventCost } from "./pricing/calculator";
import type { PricingConfig } from "./pricing/types";
import {
  PROVIDERS,
  type Channel,
  type Provider,
  type UsageEvent,
} from "./types";

export const TIMEZONE = "America/Sao_Paulo";
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function dayKey(value: string | Date): string {
  const parts = dayFormatter.formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((part) => parts.find((item) => item.type === part)!.value)
    .join("-");
}
export function shiftDay(day: string, delta: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return dayKey(date);
}
export interface Filters {
  channel: Channel;
  days: number;
  provider: Provider | "all";
  project: string;
}
export function selectEvents(
  events: UsageEvent[],
  filters: Filters,
  now = new Date(),
): UsageEvent[] {
  const today = dayKey(now),
    start = shiftDay(today, 1 - filters.days);
  return events.filter(
    (row) =>
      row.channel === filters.channel &&
      (filters.provider === "all" || row.provider === filters.provider) &&
      (!filters.project || row.project === filters.project) &&
      dayKey(row.timestamp) >= start &&
      dayKey(row.timestamp) <= today,
  );
}

export function totals(events: UsageEvent[], pricingConfig?: PricingConfig) {
  let estimatedCostUSD = 0;
  let estimatedCostBRL = 0;
  let realCostUSD = 0;
  let realCostBRL = 0;
  let cacheSavingsUSD = 0;
  let cacheSavingsBRL = 0;
  let estimatedRecords = 0;

  for (const row of events) {
    const cost = calculateEventCost(row, pricingConfig);
    if (cost.isEstimated && cost.costUSD !== null) {
      estimatedCostUSD += cost.costUSD;
      estimatedCostBRL += cost.costBRL ?? 0;
      estimatedRecords += row.records ?? 1;
    } else if (cost.costUSD !== null) {
      realCostUSD += cost.costUSD;
      realCostBRL += cost.costBRL ?? 0;
    }
    cacheSavingsUSD += cost.cacheSavingsUSD;
    cacheSavingsBRL += cost.cacheSavingsBRL;
  }

  const sum = events.reduce(
    (result, row) => ({
      input: result.input + row.inputTokens,
      output: result.output + row.outputTokens,
      cache: result.cache + row.cachedTokens,
      write: result.write + row.cacheWriteTokens,
      reasoning: result.reasoning + row.reasoningTokens,
      tokens: result.tokens + row.totalTokens,
      cost: result.cost + (row.costUSD ?? 0),
      records: result.records + (row.records ?? 1),
      costsKnown:
        result.costsKnown +
        (row.costRecords ?? (row.costUSD == null ? 0 : (row.records ?? 1))),
    }),
    {
      input: 0,
      output: 0,
      cache: 0,
      write: 0,
      reasoning: 0,
      tokens: 0,
      cost: 0,
      costsKnown: 0,
      records: 0,
    },
  );
  return {
    ...sum,
    cacheRate: sum.input ? sum.cache / sum.input : 0,
    sessions: new Set(events.map((row) => row.sessionId)).size,
    realCostUSD,
    realCostBRL,
    estimatedCostUSD,
    estimatedCostBRL,
    totalCostUSD: realCostUSD + estimatedCostUSD,
    totalCostBRL: realCostBRL + estimatedCostBRL,
    cacheSavingsUSD,
    cacheSavingsBRL,
    estimatedRecords,
  };
}
export function dailySeries(
  events: UsageEvent[],
  days: number,
  now = new Date(),
) {
  const today = dayKey(now);
  const buckets = new Map<string, Record<Provider, number>>();
  for (let i = days - 1; i >= 0; i--)
    buckets.set(shiftDay(today, -i), {
      codex: 0,
      claude: 0,
      grok: 0,
      gemini: 0,
    });
  for (const row of events) {
    const bucket = buckets.get(dayKey(row.timestamp));
    if (bucket) bucket[row.provider] += row.totalTokens;
  }
  return [...buckets].map(([date, values]) => ({
    date,
    ...values,
    total: PROVIDERS.reduce((sum, provider) => sum + values[provider], 0),
  }));
}
export function groupEvents(
  events: UsageEvent[],
  by: "model" | "project",
  pricingConfig?: PricingConfig,
) {
  const groups = new Map<string, UsageEvent[]>();
  for (const row of events) {
    const key = by === "model" ? `${row.provider}:${row.model}` : row.project;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      name: group[0][by],
      provider: group[0].provider,
      providers: [...new Set(group.map((row) => row.provider))],
      ...totals(group, pricingConfig),
    }))
    .sort((a, b) => b.tokens - a.tokens);
}
export function sessionGroups(
  events: UsageEvent[],
  pricingConfig?: PricingConfig,
) {
  const groups = new Map<string, UsageEvent[]>();
  for (const row of events) {
    const group = groups.get(row.sessionId) ?? [];
    group.push(row);
    groups.set(row.sessionId, group);
  }
  return [...groups]
    .map(([id, group]) => ({
      id,
      provider: group[0].provider,
      project: group.at(-1)!.project,
      models: [...new Set(group.map((row) => row.model))],
      timestamp: group
        .map((row) => row.timestamp)
        .sort()
        .at(-1)!,
      ...totals(group, pricingConfig),
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
export function previousChange(
  events: UsageEvent[],
  filters: Filters,
  now = new Date(),
): number | null {
  if (filters.days > 30) return null;
  const previousNow = new Date(
    `${shiftDay(dayKey(now), -filters.days)}T12:00:00Z`,
  );
  const previous = totals(selectEvents(events, filters, previousNow)).tokens;
  const current = totals(selectEvents(events, filters, now)).tokens;
  return previous ? (current - previous) / previous : null;
}
export function formatTokens(value: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
export function compactEvents(events: UsageEvent[]): UsageEvent[] {
  const groups = new Map<string, UsageEvent>();
  for (const row of events) {
    const key = [
      row.provider,
      row.channel,
      row.sessionId,
      row.model,
      row.project,
      dayKey(row.timestamp),
      row.costUSD == null ? "unknown-cost" : "native-cost",
    ].join("\u001f");
    const previous = groups.get(key);
    if (!previous) {
      groups.set(key, {
        ...row,
        records: row.records ?? 1,
        costRecords:
          row.costRecords ?? (row.costUSD == null ? 0 : (row.records ?? 1)),
      });
      continue;
    }
    for (const field of [
      "inputTokens",
      "outputTokens",
      "cachedTokens",
      "cacheWriteTokens",
      "reasoningTokens",
      "totalTokens",
    ] as const)
      previous[field] += row[field];
    previous.records! += row.records ?? 1;
    previous.costRecords! +=
      row.costRecords ?? (row.costUSD == null ? 0 : (row.records ?? 1));
    if (row.costUSD != null)
      previous.costUSD = (previous.costUSD ?? 0) + row.costUSD;
    if (row.timestamp > previous.timestamp) previous.timestamp = row.timestamp;
  }
  return [...groups.values()];
}
export function formatNumber(value: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale).format(value);
}
export function formatUSD(value: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}
export function formatBRL(value: number, locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
export function formatDate(value: string, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}
export function formatTime(value: string, locale = "pt-BR"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function exportCSV(events: UsageEvent[]): string {
  const protect = (value: string | number | null) => {
    let text = value === null ? "" : String(value);
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = events.map((row) => [
    row.timestamp,
    row.provider,
    row.channel,
    row.model,
    row.project,
    row.inputTokens,
    row.outputTokens,
    row.cachedTokens,
    row.cacheWriteTokens,
    row.reasoningTokens,
    row.totalTokens,
    row.costUSD,
  ]);
  const headers = [
    "data_utc",
    "servico",
    "origem",
    "modelo",
    "projeto",
    "tokens_entrada",
    "tokens_saida",
    "tokens_cache",
    "tokens_escrita_cache",
    "tokens_raciocinio",
    "tokens_total",
    "custo_usd_informado",
  ];
  return (
    "\ufeff" +
    [headers, ...rows].map((row) => row.map(protect).join(";")).join("\r\n")
  );
}
