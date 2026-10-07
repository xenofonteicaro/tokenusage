import { Box, Text } from "ink";
import { dayKey, formatNumber, formatTime } from "../../lib/analytics";
import { providerInfo, type SourceStatus } from "../../lib/types";
import { channelLabel } from "../components/filter-line";
import { shortDate, tint, visibleWindow } from "../format";
import type { ScreenContext } from "../context";
import type { ScreenProps } from "./types";

const STATE: Record<SourceStatus["state"], { label: string; color?: string }> =
  {
    connected: { label: "Coletando", color: "green" },
    empty: { label: "Sem contadores", color: "yellow" },
    missing: { label: "Não encontrado" },
    error: { label: "Requer atenção", color: "red" },
  };

export function sourcesFor(ctx: ScreenContext): SourceStatus[] {
  return ctx.snapshot.sources.filter(
    (source) => source.channel === ctx.filters.channel,
  );
}

export function SourcesScreen({ ctx, cursor, pageSize }: ScreenProps) {
  const sources = sourcesFor(ctx);
  const { start, end } = visibleWindow(sources.length, cursor, pageSize);
  return (
    <Box flexDirection="column">
      <Text>
        <Text bold>Fontes de dados</Text>
        <Text dimColor>
          {" "}
          · {channelLabel(ctx.filters.channel)} · leitura local, sem chaves de
          API
        </Text>
      </Text>
      {sources.slice(start, end).map((source, offset) => {
        const state = STATE[source.state];
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
                {source.name}
              </Text>
              <Box flexShrink={0} marginLeft={2}>
                <Text color={tint(state.color)} dimColor={!state.color}>
                  {state.label}
                </Text>
              </Box>
            </Box>
            <Text wrap="truncate-end" dimColor>
              {"  "}
              {source.location}
            </Text>
            <Text wrap="truncate-end">
              {"  "}
              {source.detail}
            </Text>
            <Text wrap="truncate-end" dimColor>
              {"  "}
              {formatNumber(source.files)} arquivos ·{" "}
              {formatNumber(source.events)} registros
              {source.latest
                ? ` · último ${shortDate(dayKey(source.latest))} ${formatTime(source.latest)}`
                : ""}
              {source.warnings > 0 ? (
                <Text color={tint("red")}>
                  {" "}
                  · ⚠ {source.warnings} com falha, totais podem estar
                  incompletos
                </Text>
              ) : null}
            </Text>
          </Box>
        );
      })}
      {sources.length === 0 && <Text dimColor>Nenhuma fonte neste canal.</Text>}
      {sources.length > 0 && (
        <Text dimColor>
          {start + 1}–{end} de {sources.length}
        </Text>
      )}
    </Box>
  );
}
