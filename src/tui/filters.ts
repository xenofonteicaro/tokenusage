import type { Filters } from "../lib/analytics";
import {
  PROVIDERS,
  type Channel,
  type Provider,
  type UsageEvent,
} from "../lib/types";
import { PERIODS, type TuiOptions } from "./args";

export function initialFilters(options: TuiOptions): Filters {
  return {
    channel: options.channel,
    days: options.days,
    provider: "all",
    project: "",
  };
}

export function nextPeriod(days: number): number {
  const index = (PERIODS as readonly number[]).indexOf(days);
  return PERIODS[(index + 1) % PERIODS.length];
}

export function nextProvider(current: Provider | "all"): Provider | "all" {
  if (current === "all") return PROVIDERS[0];
  const index = PROVIDERS.indexOf(current);
  return PROVIDERS[index + 1] ?? "all";
}

export function nextChannel(current: Channel): Channel {
  return current === "tool" ? "api" : "tool";
}

// Same project list the web dashboard offers: current channel and service.
export function projectOptions(
  events: UsageEvent[],
  filters: Filters,
): string[] {
  return [
    ...new Set(
      events
        .filter(
          (row) =>
            row.channel === filters.channel &&
            (filters.provider === "all" || row.provider === filters.provider),
        )
        .map((row) => row.project),
    ),
  ].sort();
}
