import { selectEvents, type Filters } from "../lib/analytics";
import type { PricingConfig } from "../lib/pricing/types";
import type { UsageEvent } from "../lib/types";
import type { UsagePayload } from "../lib/usage-snapshot";
import {
  activityRows,
  type ActivityRow,
  type GroupMode,
} from "./activity-rows";
import { createTuiI18n, type TuiI18n } from "./i18n";

// Everything a screen needs, derived once per snapshot / filter change.
export interface ScreenContext {
  snapshot: UsagePayload;
  events: UsageEvent[];
  filters: Filters;
  pricing: PricingConfig;
  search: string;
  group: GroupMode;
  rows: ActivityRow[];
}

export function buildContext(
  snapshot: UsagePayload,
  filters: Filters,
  search: string,
  group: GroupMode,
  i18n: TuiI18n = createTuiI18n("pt-BR"),
): ScreenContext {
  const events = selectEvents(
    snapshot.events,
    filters,
    new Date(snapshot.generatedAt),
  );
  const pricing: PricingConfig = {
    customPrices: snapshot.settings.customPricing,
    usdToBrlRate: snapshot.settings.usdToBrlRate,
  };
  return {
    snapshot,
    events,
    filters,
    pricing,
    search,
    group,
    rows: activityRows(events, group, search, pricing, i18n),
  };
}
