import type { ModelPrice } from "./types";

export const DEFAULT_USD_TO_BRL_RATE = 5.75;

export const DEFAULT_MODEL_PRICES: Record<string, ModelPrice> = {
  // Anthropic
  "claude-3-7-sonnet": {
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
  },
  "claude-3-5-sonnet": {
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
  },
  "claude-3-5-haiku": {
    inputPer1M: 0.8,
    outputPer1M: 4.0,
    cacheReadPer1M: 0.08,
  },
  "claude-3-opus": { inputPer1M: 15.0, outputPer1M: 75.0, cacheReadPer1M: 1.5 },

  // OpenAI / Codex
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0, cacheReadPer1M: 1.25 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6, cacheReadPer1M: 0.075 },
  o1: { inputPer1M: 15.0, outputPer1M: 60.0, cacheReadPer1M: 7.5 },
  "o1-preview": { inputPer1M: 15.0, outputPer1M: 60.0, cacheReadPer1M: 7.5 },
  "o1-mini": { inputPer1M: 1.1, outputPer1M: 4.4, cacheReadPer1M: 0.55 },
  "o3-mini": { inputPer1M: 1.1, outputPer1M: 4.4, cacheReadPer1M: 0.55 },
  "gpt-5.6-terra": { inputPer1M: 2.5, outputPer1M: 10.0, cacheReadPer1M: 1.25 },

  // xAI / Grok
  "grok-2": { inputPer1M: 2.0, outputPer1M: 10.0, cacheReadPer1M: 0.5 },
  "grok-3": { inputPer1M: 3.0, outputPer1M: 15.0, cacheReadPer1M: 0.75 },
  "grok-beta": { inputPer1M: 2.0, outputPer1M: 10.0, cacheReadPer1M: 0.5 },

  // Google Gemini
  "gemini-1.5-pro": {
    inputPer1M: 3.5,
    outputPer1M: 10.5,
    cacheReadPer1M: 0.875,
  },
  "gemini-1.5-flash": {
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    cacheReadPer1M: 0.01875,
  },
  "gemini-2.0-flash": {
    inputPer1M: 0.1,
    outputPer1M: 0.4,
    cacheReadPer1M: 0.025,
  },
  "gemini-2.0-pro": {
    inputPer1M: 3.5,
    outputPer1M: 10.5,
    cacheReadPer1M: 0.875,
  },
};
