export interface ModelPrice {
  inputPer1M: number;
  outputPer1M: number;
  cacheReadPer1M: number;
}

export interface PricingConfig {
  customPrices?: Record<string, ModelPrice>;
  usdToBrlRate?: number;
}

export interface CalculatedEventCost {
  isEstimated: boolean;
  costUSD: number | null;
  costBRL: number | null;
  cacheSavingsUSD: number;
  cacheSavingsBRL: number;
}

export interface CacheSavings {
  tokensSaved: number;
  amountUSD: number;
  amountBRL: number;
}
