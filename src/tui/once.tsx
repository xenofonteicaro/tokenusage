import { Box, Text } from "ink";
import type { UsagePayload } from "../lib/usage-snapshot";
import type { TuiOptions } from "./args";
import { FilterLine } from "./components/filter-line";
import { buildContext } from "./context";
import { initialFilters } from "./filters";
import { createTuiI18n } from "./i18n";
import { I18nContext } from "./i18n-context";
import { OverviewScreen } from "./screens/overview";

// Static frame for `tokenusage tui --once`: no input, no refresh.
export function OnceView({
  snapshot,
  options,
  columns,
  rows,
}: {
  snapshot: UsagePayload;
  options: TuiOptions;
  columns: number;
  rows: number;
}) {
  const i18n = createTuiI18n(options.lang ?? snapshot.settings.language);
  const ctx = buildContext(
    snapshot,
    initialFilters(options),
    "",
    "session",
    i18n,
  );
  return (
    <I18nContext.Provider value={i18n}>
      <Box flexDirection="column" width={columns}>
        <Text bold>tokenusage · {i18n.t("Visão geral")}</Text>
        <FilterLine filters={ctx.filters} status="" />
        <OverviewScreen
          ctx={ctx}
          width={columns}
          height={rows - 2}
          cursor={0}
          pageSize={1}
          searching={false}
        />
      </Box>
    </I18nContext.Provider>
  );
}
