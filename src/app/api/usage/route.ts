import { collectLocal, HISTORY_DAYS } from "@/lib/collectors/local";
import { compactEvents, totals } from "@/lib/analytics";
import { readJson, readSettings } from "@/lib/local-store";
import { isLocalRequest, privateHeaders } from "@/lib/local-security";
import { PROVIDERS, type SourceStatus, type UsageEvent } from "@/lib/types";

export async function GET(request: Request) {
  if (!isLocalRequest(request))
    return Response.json(
      { error: "Acesso permitido apenas pela dashboard local." },
      { status: 403, headers: privateHeaders },
    );
  try {
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
    return Response.json(
      {
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
        timezone: "America/Sao_Paulo",
        historyDays: HISTORY_DAYS,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha na coleta local.",
      },
      { status: 500, headers: privateHeaders },
    );
  }
}
