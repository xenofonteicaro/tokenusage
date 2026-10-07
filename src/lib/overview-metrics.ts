import {
  dayKey,
  groupEvents,
  previousChange,
  totals,
  type Filters,
} from "./analytics";
import { calculateEventCost, findModelPrice } from "./pricing/calculator";
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
  const available = snapshot.sources
    .filter(
      (source) =>
        source.channel === filters.channel && source.state === "connected",
    )
    .map((source) => source.provider);
  const now = new Date(snapshot.generatedAt);
  const change = previousChange(snapshot.events, filters, now),
    hasData = events.length > 0;
  const hasCost = metrics.costsKnown + metrics.estimatedRecords > 0;
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
  const cacheEvents = events.filter((event) => event.cachedTokens > 0);
  const unpricedCache = cacheEvents.filter(
    (event) => !findModelPrice(event.model, pricingConfig.customPrices),
  ).length;
  // Cache tokens with no tariff make the saving unknown, not zero.
  const hasSavings =
    hasData &&
    !(cacheEvents.length > 0 && unpricedCache === cacheEvents.length);
  const savingsShare =
    modeledCostUSD + metrics.cacheSavingsUSD > 0
      ? metrics.cacheSavingsUSD / (modeledCostUSD + metrics.cacheSavingsUSD)
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
  const uncoveredModels = models.filter(
    (row) => row.records > row.costsKnown + row.estimatedRecords,
  );
  const rate = snapshot.settings.usdToBrlRate ?? 5.75;
  return {
    metrics,
    models,
    projects,
    values,
    available,
    change,
    hasCost,
    unestimatedRecords,
    cacheEvents,
    unpricedCache,
    hasSavings,
    savingsShare,
    subscriptions,
    goal,
    monthTokens,
    uncoveredModels,
    rate,
  };
}
