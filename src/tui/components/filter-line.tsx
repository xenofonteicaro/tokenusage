import { Box, Text } from "ink";
import type { Filters } from "../../lib/analytics";
import { providerInfo, type Channel } from "../../lib/types";
import type { Translate } from "../i18n";
import { useI18n } from "../i18n-context";

export const channelLabel = (channel: Channel, t: Translate) =>
  channel === "tool" ? t("Ferramentas") : "APIs";

export function filterSummary(filters: Filters, t: Translate): string {
  return [
    t("Canal: {value}", { value: channelLabel(filters.channel, t) }),
    t("Período: {days} dias", { days: filters.days }),
    t("Serviço: {value}", {
      value:
        filters.provider === "all"
          ? t("Todos")
          : providerInfo[filters.provider].name,
    }),
    t("Projeto: {value}", { value: filters.project || t("Todos") }),
  ].join(" · ");
}

export function FilterLine({
  filters,
  status,
}: {
  filters: Filters;
  status: string;
}) {
  const { t } = useI18n();
  return (
    <Box justifyContent="space-between">
      <Box flexShrink={1}>
        <Text wrap="truncate-end" dimColor>
          {filterSummary(filters, t)}
        </Text>
      </Box>
      <Box flexShrink={0} marginLeft={2}>
        <Text dimColor>{status}</Text>
      </Box>
    </Box>
  );
}
