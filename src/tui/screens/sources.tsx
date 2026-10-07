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
  if (state === "connected") return { label: t("Coletando"), color: "green" };
  if (state === "empty") return { label: t("Sem contadores"), color: "yellow" };
  if (state === "missing") return { label: t("Não encontrado") };
  return { label: t("Requer atenção"), color: "red" };
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
        <Text bold>{t("Fontes de dados")}</Text>
        <Text dimColor>
          {" "}
          · {channelLabel(ctx.filters.channel, t)} ·{" "}
          {t("leitura local, sem chaves de API")}
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
              {tn(source.files, "arquivo", "arquivos", formatNumber)} ·{" "}
              {tn(source.events, "registro", "registros", formatNumber)}
              {source.latest
                ? ` · ${t("último {date}", { date: `${shortDate(dayKey(source.latest))} ${formatTime(source.latest)}` })}`
                : ""}
              {source.warnings > 0 ? (
                <Text color={tint("red")}>
                  {" "}
                  ·{" "}
                  {t("⚠ {count} com falha, totais podem estar incompletos", {
                    count: source.warnings,
                  })}
                </Text>
              ) : null}
            </Text>
          </Box>
        );
      })}
      {sources.length === 0 && (
        <Text dimColor>{t("Nenhuma fonte neste canal.")}</Text>
      )}
      {sources.length > 0 && (
        <Text dimColor>
          {t("{from}–{to} de {total}", {
            from: start + 1,
            to: end,
            total: sources.length,
          })}
        </Text>
      )}
    </Box>
  );
}
