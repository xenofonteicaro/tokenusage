import { defaultSettings, type UsageEvent } from "../../src/lib/types";
import type { UsagePayload } from "../../src/lib/usage-snapshot";
import { totals } from "../../src/lib/analytics";

// Synthetic data only. "Now" is fixed so every date-based assertion is stable.
export const GENERATED_AT = "2026-10-07T15:00:00Z";

const base: UsageEvent = {
  id: "base",
  provider: "codex",
  channel: "tool",
  timestamp: "2026-10-07T12:00:00Z",
  model: "gpt-4o-mini",
  project: "projeto-alfa",
  sessionId: "sessao-1",
  inputTokens: 1000,
  cachedTokens: 800,
  outputTokens: 200,
  cacheWriteTokens: 0,
  reasoningTokens: 0,
  totalTokens: 1200,
  costUSD: null,
  records: 1,
  costRecords: 0,
};

export const events: UsageEvent[] = [
  base,
  {
    ...base,
    id: "claude-1",
    provider: "claude",
    timestamp: "2026-10-06T12:00:00Z",
    model: "modelo-sem-tarifa",
    project: "projeto-beta",
    sessionId: "sessao-2",
    inputTokens: 4000,
    cachedTokens: 3000,
    outputTokens: 1000,
    totalTokens: 5000,
  },
  {
    ...base,
    id: "grok-1",
    provider: "grok",
    timestamp: "2026-10-03T12:00:00Z",
    model: "grok-sintetico",
    project: "projeto-alfa",
    sessionId: "sessao-3",
    inputTokens: 600,
    cachedTokens: 0,
    outputTokens: 400,
    totalTokens: 1000,
    costUSD: 0.05,
    costRecords: 1,
  },
  {
    ...base,
    id: "api-1",
    channel: "api",
    provider: "claude",
    timestamp: "2026-10-05T12:00:00Z",
    model: "gpt-4o-mini",
    project: "servico-api",
    sessionId: "chamada-1",
    inputTokens: 100,
    cachedTokens: 0,
    outputTokens: 50,
    totalTokens: 150,
  },
];

export function payload(overrides: Partial<UsagePayload> = {}): UsagePayload {
  const settings = {
    ...defaultSettings,
    monthlyTokenGoal: 20_000,
    customPricing: {
      "gpt-4o-mini": { inputPer1M: 2, outputPer1M: 3, cacheReadPer1M: 1 },
    },
  };
  const pricing = {
    customPrices: settings.customPricing,
    usdToBrlRate: settings.usdToBrlRate,
  };
  return {
    events,
    costMetrics: {
      tool: totals(
        events.filter((row) => row.channel === "tool"),
        pricing,
      ),
      api: totals(
        events.filter((row) => row.channel === "api"),
        pricing,
      ),
    },
    sources: [
      {
        id: "codex",
        provider: "codex",
        channel: "tool",
        name: "Codex",
        state: "connected",
        files: 3,
        events: 12,
        detail: "Contadores lidos das sessões locais.",
        location: "~/.codex/sessions",
        latest: "2026-10-07T12:00:00Z",
        warnings: 0,
      },
      {
        id: "gemini",
        provider: "gemini",
        channel: "tool",
        name: "Gemini",
        state: "error",
        files: 2,
        events: 0,
        detail: "Alguns arquivos não puderam ser interpretados.",
        location: "~/.gemini/tmp",
        latest: null,
        warnings: 2,
      },
      {
        id: "claude-api",
        provider: "claude",
        channel: "api",
        name: "claude · logs de API",
        state: "connected",
        files: 1,
        events: 1,
        detail: "Consumo extraído dos arquivos importados.",
        location: "Importação local JSON / JSONL",
        latest: "2026-10-05T12:00:00Z",
        warnings: 0,
      },
    ],
    settings,
    generatedAt: GENERATED_AT,
    timezone: "America/Sao_Paulo",
    historyDays: 90,
    ...overrides,
  };
}
