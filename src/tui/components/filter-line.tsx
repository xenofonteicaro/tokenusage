import { Box, Text } from "ink";
import type { Filters } from "../../lib/analytics";
import { providerInfo, type Channel } from "../../lib/types";

export const channelLabel = (channel: Channel) =>
  channel === "tool" ? "Ferramentas" : "APIs";

export function filterSummary(filters: Filters): string {
  return [
    `Canal: ${channelLabel(filters.channel)}`,
    `Período: ${filters.days} dias`,
    `Serviço: ${filters.provider === "all" ? "Todos" : providerInfo[filters.provider].name}`,
    `Projeto: ${filters.project || "Todos"}`,
  ].join(" · ");
}

export function FilterLine({
  filters,
  status,
}: {
  filters: Filters;
  status: string;
}) {
  return (
    <Box justifyContent="space-between">
      <Box flexShrink={1}>
        <Text wrap="truncate-end" dimColor>
          {filterSummary(filters)}
        </Text>
      </Box>
      <Box flexShrink={0} marginLeft={2}>
        <Text dimColor>{status}</Text>
      </Box>
    </Box>
  );
}
