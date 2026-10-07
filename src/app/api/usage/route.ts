import { collectLocal, HISTORY_DAYS } from "@/lib/collectors/local";
import { compactEvents, totals } from "@/lib/analytics";
import { readJson, readSettings } from "@/lib/local-store";
import { isLocalRequest, privateHeaders } from "@/lib/local-security";
import { PROVIDERS, type SourceStatus, type UsageEvent } from "@/lib/types";

export async function GET(request: Request) {
  if (!isLocalRequest(request))
    return Response.json(
      { error: "Access is allowed only from the local dashboard." },
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
        name: `${provider} · API logs`,
        state: matching.length ? "connected" : "missing",
        files: matching.length ? 1 : 0,
        events: matching.length,
        location: "Local JSON / JSONL import",
        warnings: 0,
        latest:
          matching
            .map((row) => row.timestamp)
            .sort()
            .at(-1) ?? null,
        detail: matching.length
          ? "Usage extracted from imported files. Reported costs are preserved; others are estimated when a price is configured."
          : "Import logs with counters returned by the API. No admin key required.",
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
          error instanceof Error ? error.message : "Local collection failed.",
      },
      { status: 500, headers: privateHeaders },
    );
  }
}
