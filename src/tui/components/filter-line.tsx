import { Box, Text } from "ink";
import type { Filters } from "../../lib/analytics";
import { providerInfo, type Channel } from "../../lib/types";
import type { Translate } from "../i18n";
import { useI18n } from "../i18n-context";

export const channelLabel = (channel: Channel, t: Translate) =>
  channel === "tool" ? t("Tools") : "APIs";

export function filterSummary(filters: Filters, t: Translate): string {
  return [
    t("Channel: {value}", { value: channelLabel(filters.channel, t) }),
    t("Period: {days} days", { days: filters.days }),
    t("Service: {value}", {
      value:
        filters.provider === "all"
          ? t("All")
          : providerInfo[filters.provider].name,
    }),
    t("Project: {value}", { value: filters.project || t("All") }),
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
