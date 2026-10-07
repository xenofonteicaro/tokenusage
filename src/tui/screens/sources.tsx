import { Box, Text } from "ink";
import { dayKey } from "../../lib/analytics";
import { providerInfo, type SourceStatus } from "../../lib/types";
import { channelLabel } from "../components/filter-line";
import { tint, visibleWindow } from "../format";
import { useI18n } from "../i18n-context";
import type { Translate } from "../i18n";
import type { ScreenContext } from "../context";
import type { ScreenProps } from "./types";

function stateStyle(
  state: SourceStatus["state"],
  t: Translate,
): { label: string; color?: string } {
  if (state === "connected") return { label: t("Collecting"), color: "green" };
  if (state === "empty") return { label: t("No counters"), color: "yellow" };
  if (state === "missing") return { label: t("Not found") };
  return { label: t("Needs attention"), color: "red" };
}

export function sourcesFor(ctx: ScreenContext): SourceStatus[] {
  return ctx.snapshot.sources.filter(
    (source) => source.channel === ctx.filters.channel,
  );
}

export function SourcesScreen({ ctx, cursor, pageSize }: ScreenProps) {
  const { t, tn, shortDate, formatNumber, formatTime } = useI18n();
  const sources = sourcesFor(ctx);
  const { start, end } = visibleWindow(sources.length, cursor, pageSize);
  return (
    <Box flexDirection="column">
      <Text>
        <Text bold>{t("Data sources")}</Text>
        <Text dimColor>
          {" "}
          · {channelLabel(ctx.filters.channel, t)} ·{" "}
          {t("local read, no API keys")}
        </Text>
      </Text>
      {sources.slice(start, end).map((source, offset) => {
        const state = stateStyle(source.state, t);
        const selected = start + offset === cursor;
        return (
          <Box
            key={source.id}
            flexDirection="column"
            marginTop={offset ? 1 : 0}
          >
            <Box justifyContent="space-between">
              <Text wrap="truncate-end" bold>
                {selected ? "› " : "  "}
                <Text color={tint(providerInfo[source.provider].color)}>
                  {providerInfo[source.provider].letter}
                </Text>{" "}
                {t(source.name)}
              </Text>
              <Box flexShrink={0} marginLeft={2}>
                <Text color={tint(state.color)} dimColor={!state.color}>
                  {state.label}
                </Text>
              </Box>
            </Box>
            <Text wrap="truncate-end" dimColor>
              {"  "}
              {t(source.location)}
            </Text>
            <Text wrap="truncate-end">
              {"  "}
              {t(source.detail)}
            </Text>
            <Text wrap="truncate-end" dimColor>
              {"  "}
              {tn(source.files, "file", "files", formatNumber)} ·{" "}
              {tn(source.events, "record", "records", formatNumber)}
              {source.latest
                ? ` · ${t("last {date}", { date: `${shortDate(dayKey(source.latest))} ${formatTime(source.latest)}` })}`
                : ""}
              {source.warnings > 0 ? (
                <Text color={tint("red")}>
                  {" "}
                  ·{" "}
                  {t("⚠ {count} failed, totals may be incomplete", {
                    count: source.warnings,
                  })}
                </Text>
              ) : null}
            </Text>
          </Box>
        );
      })}
      {sources.length === 0 && (
        <Text dimColor>{t("No sources on this channel.")}</Text>
      )}
      {sources.length > 0 && (
        <Text dimColor>
          {t("{from}–{to} of {total}", {
            from: start + 1,
            to: end,
            total: sources.length,
          })}
        </Text>
      )}
    </Box>
  );
}
