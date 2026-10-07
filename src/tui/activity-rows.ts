import { dayKey, groupEvents, sessionGroups, totals } from "../lib/analytics";
import type { PricingConfig } from "../lib/pricing/types";
import { providerInfo, type Provider, type UsageEvent } from "../lib/types";
import { createTuiI18n, type TuiI18n, type Translate } from "./i18n";

export type GroupMode = "session" | "model" | "project" | "day";
export const GROUP_MODES: GroupMode[] = ["session", "model", "project", "day"];
export function groupLabel(mode: GroupMode, t: Translate): string {
  if (mode === "session") return t("Session");
  if (mode === "model") return t("Model");
  if (mode === "project") return t("Project");
  return t("Day");
}

export type CostKind = "actual" | "est." | "mixed";

export interface ActivityRow {
  key: string;
  providers: Provider[];
  label: string;
  detail: string;
  timestamp: string;
  tokens: number;
  cacheRate: number;
  costUSD: number | null;
  costKind: CostKind | null;
  uncovered: number;
}

type Totals = ReturnType<typeof totals>;

function summary(metrics: Totals) {
  const known = metrics.costsKnown + metrics.estimatedRecords;
  return {
    tokens: metrics.tokens,
    cacheRate: metrics.cacheRate,
    costUSD: known > 0 ? metrics.totalCostUSD : null,
    costKind: (known === 0
      ? null
      : metrics.estimatedRecords
        ? metrics.costsKnown
          ? "mixed"
          : "est."
        : "actual") as CostKind | null,
    uncovered: Math.max(0, metrics.records - known),
  };
}

function latestBy(events: UsageEvent[], key: (row: UsageEvent) => string) {
  const latest = new Map<string, string>();
  for (const row of events) {
    const name = key(row);
    if ((latest.get(name) ?? "") < row.timestamp)
      latest.set(name, row.timestamp);
  }
  return latest;
}

const providerNames = (providers: Provider[]) =>
  providers.map((provider) => providerInfo[provider].name).join(", ");

export function activityRows(
  events: UsageEvent[],
  mode: GroupMode,
  search: string,
  pricing?: PricingConfig,
  i18n: Pick<TuiI18n, "tn" | "shortDate"> = createTuiI18n("en"),
): ActivityRow[] {
  let rows: ActivityRow[];
  if (mode === "session") {
    rows = sessionGroups(events, pricing).map((group) => ({
      key: group.id,
      providers: [group.provider],
      label: group.project,
      detail: group.models.join(", "),
      timestamp: group.timestamp,
      ...summary(group),
    }));
  } else if (mode === "day") {
    const days = new Map<string, UsageEvent[]>();
    for (const row of events) {
      const day = dayKey(row.timestamp);
      days.set(day, [...(days.get(day) ?? []), row]);
    }
    rows = [...days]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([day, group]) => {
        const metrics = totals(group, pricing);
        return {
          key: day,
          providers: [...new Set(group.map((row) => row.provider))],
          label: i18n.shortDate(day),
          detail: i18n.tn(metrics.sessions, "session", "sessions"),
          timestamp: group
            .map((row) => row.timestamp)
            .sort()
            .at(-1)!,
          ...summary(metrics),
        };
      });
  } else {
    const latest = latestBy(events, (row) =>
      mode === "model" ? `${row.provider}:${row.model}` : row.project,
    );
    rows = groupEvents(events, mode, pricing).map((group) => {
      const key =
        mode === "model" ? `${group.provider}:${group.name}` : group.name;
      return {
        key,
        providers: group.providers,
        label: group.name,
        detail: providerNames(group.providers),
        timestamp: latest.get(key) ?? "",
        ...summary(group),
      };
    });
  }
  const needle = search.trim().toLocaleLowerCase("pt-BR");
  if (!needle) return rows;
  return rows.filter((row) =>
    `${row.label} ${row.detail} ${providerNames(row.providers)}`
      .toLocaleLowerCase("pt-BR")
      .includes(needle),
  );
}
