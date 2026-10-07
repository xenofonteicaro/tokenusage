import type { UsageEvent } from "../types";
import { DEFAULT_MODEL_PRICES, DEFAULT_USD_TO_BRL_RATE } from "./defaults";
import type {
  CacheSavings,
  CalculatedEventCost,
  ModelPrice,
  PricingConfig,
} from "./types";

function exchangeRate(config: PricingConfig): number {
  const rate = config.usdToBrlRate;
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0
    ? rate
    : DEFAULT_USD_TO_BRL_RATE;
}

function matchesModel(model: string, key: string): boolean {
  if (model === key) return true;
  // Only dated snapshots inherit a base model's rates. Other suffixes can be
  // distinct products and must remain uncovered until explicitly configured.
  return (
    model.startsWith(`${key}-`) &&
    /^(?:\d{8}|\d{4}-\d{2}-\d{2})$/.test(model.slice(key.length + 1))
  );
}

export function findModelPrice(
  rawModel: string,
  customPrices?: Record<string, ModelPrice>,
): ModelPrice | null {
  const normalized = rawModel.trim().toLowerCase();
  if (!normalized) return null;
  for (const prices of [customPrices, DEFAULT_MODEL_PRICES]) {
    if (!prices) continue;
    const entries = Object.entries(prices).sort(
      (a, b) => b[0].length - a[0].length,
    );
    for (const [key, price] of entries) {
      if (matchesModel(normalized, key.trim().toLowerCase())) return price;
    }
  }
  return null;
}

export function calculateEventCost(
  event: UsageEvent,
  config: PricingConfig = {},
): CalculatedEventCost {
  const rate = exchangeRate(config);
  const price = findModelPrice(event.model, config.customPrices);

  const cacheSavingsUSD = price
    ? (event.cachedTokens *
        Math.max(0, price.inputPer1M - price.cacheReadPer1M)) /
      1_000_000
    : 0;
  const cacheSavingsBRL = cacheSavingsUSD * rate;

  // Native cost already provided
  if (event.costUSD !== null && event.costUSD !== undefined) {
    const costUSD = event.costUSD;
    const costBRL = costUSD * rate;
    return {
      isEstimated: false,
      costUSD,
      costBRL,
      cacheSavingsUSD,
      cacheSavingsBRL,
    };
  }

  // No native cost, try to estimate
  if (!price) {
    return {
      isEstimated: false,
      costUSD: null,
      costBRL: null,
      cacheSavingsUSD: 0,
      cacheSavingsBRL: 0,
    };
  }

  const freshInput = Math.max(0, event.inputTokens - event.cachedTokens);
  const freshInputCost = (freshInput * price.inputPer1M) / 1_000_000;
  const cacheCost = (event.cachedTokens * price.cacheReadPer1M) / 1_000_000;
  const outputCost = (event.outputTokens * price.outputPer1M) / 1_000_000;

  const costUSD = freshInputCost + cacheCost + outputCost;
  const costBRL = costUSD * rate;

  return {
    isEstimated: true,
    costUSD,
    costBRL,
    cacheSavingsUSD,
    cacheSavingsBRL,
  };
}

export function calculateCacheSavings(
  events: UsageEvent[],
  config: PricingConfig = {},
): CacheSavings {
  const rate = exchangeRate(config);
  let tokensSaved = 0;
  let amountUSD = 0;

  for (const event of events) {
    if (!event.cachedTokens) continue;
    tokensSaved += event.cachedTokens;
    const price = findModelPrice(event.model, config.customPrices);
    if (price) {
      amountUSD +=
        (event.cachedTokens *
          Math.max(0, price.inputPer1M - price.cacheReadPer1M)) /
        1_000_000;
    }
  }

  return {
    tokensSaved,
    amountUSD,
    amountBRL: amountUSD * rate,
  };
}
