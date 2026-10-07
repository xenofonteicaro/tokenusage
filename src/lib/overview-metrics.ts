import {
  dayKey,
  groupEvents,
  previousChange,
  totals,
  type Filters,
} from "./analytics";
import { calculateEventCost } from "./pricing/calculator";
import {
  PROVIDERS,
  type Provider,
  type Snapshot,
  type UsageEvent,
} from "./types";

// Derived numbers behind the overview cards, shared by the web and terminal UIs.
export function overviewMetrics(
  snapshot: Snapshot,
  events: UsageEvent[],
  filters: Filters,
) {
  const pricingConfig = {
    customPrices: snapshot.settings.customPricing,
    usdToBrlRate: snapshot.settings.usdToBrlRate,
  };
  const metrics = totals(events, pricingConfig),
    models = groupEvents(events, "model", pricingConfig),
    projects = groupEvents(events, "project", pricingConfig);
  const values = Object.fromEntries(
    PROVIDERS.map((provider) => [
      provider,
      totals(
        events.filter((row) => row.provider === provider),
        pricingConfig,
      ).tokens,
    ]),
  ) as Record<Provider, number>;
  const now = new Date(snapshot.generatedAt);
  const change = previousChange(snapshot.events, filters, now);
  const unestimatedRecords = Math.max(
    0,
    metrics.records - metrics.costsKnown - metrics.estimatedRecords,
  );
  const modeledCostUSD = events.reduce(
    (sum, event) =>
      sum +
      (calculateEventCost({ ...event, costUSD: null }, pricingConfig).costUSD ??
        0),
    0,
  );
  const savingsPercentage =
    modeledCostUSD + metrics.cacheSavingsUSD > 0
      ? (metrics.cacheSavingsUSD / (modeledCostUSD + metrics.cacheSavingsUSD)) *
        100
      : 0;
  const subscriptions = Object.values(
    snapshot.settings.subscriptions,
  ).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const goal = snapshot.settings.monthlyTokenGoal;
  const monthTokens = totals(
    snapshot.events.filter(
      (row) =>
        row.channel === filters.channel &&
        (filters.provider === "all" || row.provider === filters.provider) &&
        (!filters.project || row.project === filters.project) &&
        dayKey(row.timestamp).slice(0, 7) === dayKey(now).slice(0, 7),
    ),
  ).tokens;
  return {
    metrics,
    models,
    projects,
    values,
    change,
    unestimatedRecords,
    savingsPercentage,
    subscriptions,
    goal,
    monthTokens,
  };
}
