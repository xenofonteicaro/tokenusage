import { Box, Text } from "ink";
import type { UsagePayload } from "../lib/usage-snapshot";
import type { TuiOptions } from "./args";
import { FilterLine } from "./components/filter-line";
import { buildContext } from "./context";
import { initialFilters } from "./filters";
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
  const ctx = buildContext(snapshot, initialFilters(options), "", "session");
  return (
    <Box flexDirection="column" width={columns}>
      <Text bold>tokenusage · Visão geral</Text>
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
  );
}
