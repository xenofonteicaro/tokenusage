import { compactEvents, totals, TIMEZONE } from "./analytics";
import { collectLocal, HISTORY_DAYS } from "./collectors/local";
import { readJson, readSettings } from "./local-store";
import {
  PROVIDERS,
  type Snapshot,
  type SourceStatus,
  type UsageEvent,
} from "./types";

export type CostMetrics = ReturnType<typeof totals>;

export interface UsagePayload extends Snapshot {
  costMetrics: { tool: CostMetrics; api: CostMetrics };
}

// Shared by the /api/usage route and the terminal UI so both read the same data.
export async function buildUsagePayload(): Promise<UsagePayload> {
  const [local, settings, imported] = await Promise.all([
    collectLocal(),
    readSettings(),
    readJson<UsageEvent[]>("api-usage.json"),
  ]);
  const events = imported ?? [];
  const sources: SourceStatus[] = PROVIDERS.map((provider) => {
    const matching = events.filter((row) => row.provider === provider);
    return {
      id: `${provider}-api`,
      provider,
      channel: "api",
      name: `${provider} · logs de API`,
      state: matching.length ? "connected" : "missing",
      files: matching.length ? 1 : 0,
      events: matching.length,
      location: "Importação local JSON / JSONL",
      warnings: 0,
      latest:
        matching
          .map((row) => row.timestamp)
          .sort()
          .at(-1) ?? null,
      detail: matching.length
        ? "Consumo extraído dos arquivos importados. Custos informados são preservados; os demais são estimados quando há preço configurado."
        : "Importe logs com os contadores retornados pela API. Não requer chave administrativa.",
    };
  });
  const compacted = compactEvents([...local.events, ...events]);
  const pricingConfig = {
    usdToBrlRate: settings.usdToBrlRate,
    customPrices: settings.customPricing,
  };
  return {
    events: compacted,
    costMetrics: {
      tool: totals(
        compacted.filter((row) => row.channel === "tool"),
        pricingConfig,
      ),
      api: totals(
        compacted.filter((row) => row.channel === "api"),
        pricingConfig,
      ),
    },
    sources: [...local.sources, ...sources],
    settings,
    generatedAt: new Date().toISOString(),
    timezone: TIMEZONE,
    historyDays: HISTORY_DAYS,
  };
}
