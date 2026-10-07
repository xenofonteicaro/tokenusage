import type { UsageEvent } from "../types";
import { DEFAULT_MODEL_PRICES, DEFAULT_USD_TO_BRL_RATE } from "./defaults";
import type {
  CacheSavings,
  CalculatedEventCost,
  ModelPrice,
  PricingConfig,
} from "./types";

export function findModelPrice(
  rawModel: string,
  customPrices?: Record<string, ModelPrice>,
): ModelPrice | null {
  if (!rawModel) return null;
  const normalized = rawModel.trim().toLowerCase();

  // 1. Check custom prices first
  if (customPrices) {
    if (customPrices[normalized]) return customPrices[normalized];
    const customSorted = Object.keys(customPrices).sort(
      (a, b) => b.length - a.length,
    );
    for (const key of customSorted) {
      if (normalized.startsWith(key.toLowerCase())) {
        return customPrices[key];
      }
    }
  }

  // 2. Exact match in default prices
  if (DEFAULT_MODEL_PRICES[normalized]) {
    return DEFAULT_MODEL_PRICES[normalized];
  }

  // 3. Prefix match with longest key first (e.g. gpt-4o-mini before gpt-4o)
  const defaultSorted = Object.keys(DEFAULT_MODEL_PRICES).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of defaultSorted) {
    if (normalized.startsWith(key)) {
      return DEFAULT_MODEL_PRICES[key];
    }
  }

  return null;
}

export function calculateEventCost(
  event: UsageEvent,
  config: PricingConfig = {},
): CalculatedEventCost {
  const rate = config.usdToBrlRate ?? DEFAULT_USD_TO_BRL_RATE;
  const price = findModelPrice(event.model, config.customPrices);

  const cacheSavingsUSD = price
    ? Number(
        (
          (event.cachedTokens *
            Math.max(0, price.inputPer1M - price.cacheReadPer1M)) /
          1_000_000
        ).toFixed(4),
      )
    : 0;
  const cacheSavingsBRL = Number((cacheSavingsUSD * rate).toFixed(4));

  // Native cost already provided
  if (event.costUSD !== null && event.costUSD !== undefined) {
    const costUSD = Number(event.costUSD.toFixed(4));
    const costBRL = Number((costUSD * rate).toFixed(4));
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

  const costUSD = Number((freshInputCost + cacheCost + outputCost).toFixed(4));
  const costBRL = Number((costUSD * rate).toFixed(4));

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
  const rate = config.usdToBrlRate ?? DEFAULT_USD_TO_BRL_RATE;
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

  const roundedUSD = Number(amountUSD.toFixed(4));
  const roundedBRL = Number((roundedUSD * rate).toFixed(4));

  return {
    tokensSaved,
    amountUSD: roundedUSD,
    amountBRL: roundedBRL,
  };
}
