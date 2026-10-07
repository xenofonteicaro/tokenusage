import { Box, Text } from "ink";
import {
  dayKey,
  formatTime,
  formatTokens,
  formatUSD,
} from "../../lib/analytics";
import { providerInfo } from "../../lib/types";
import {
  GROUP_LABELS,
  type ActivityRow,
  type GroupMode,
} from "../activity-rows";
import { Cell } from "../components/cell";
import { percent, shortDate, tint, visibleWindow } from "../format";
import type { ScreenProps } from "./types";

const COLUMN_TITLES: Record<GroupMode, [string, string]> = {
  session: ["Projeto", "Modelos"],
  model: ["Modelo", "Serviço"],
  project: ["Projeto", "Serviços"],
  day: ["Dia", "Sessões"],
};

function costText(row: ActivityRow): string {
  if (row.costUSD === null) return "—";
  return `${formatUSD(row.costUSD)} ${row.costKind}${row.uncovered > 0 ? "*" : ""}`;
}

export function ActivityScreen({
  ctx,
  width,
  cursor,
  pageSize,
  searching,
}: ScreenProps) {
  const { rows, group, search } = ctx;
  const { start, end } = visibleWindow(rows.length, cursor, pageSize);
  const fixed = 4 + 12 + 8 + 6 + 20;
  const flex = Math.max(20, width - fixed);
  const nameWidth = Math.floor(flex * 0.4);
  const detailWidth = flex - nameWidth;
  const [nameTitle, detailTitle] = COLUMN_TITLES[group];
  // Keep the end of long (pasted) queries and leave the header room to breathe.
  const searchRoom = Math.max(4, Math.floor(width / 2) - 8);
  const shownSearch =
    search.length > searchRoom ? `…${search.slice(-(searchRoom - 1))}` : search;
  const partial = rows.some((row) => row.costUSD !== null && row.uncovered > 0);
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text wrap="truncate-end">
          <Text dimColor>Agrupado por </Text>
          <Text bold>{GROUP_LABELS[group]}</Text>
          <Text dimColor> (g) · {rows.length} itens</Text>
        </Text>
        <Box flexShrink={0} marginLeft={2}>
          {search || searching ? (
            <Text>
              <Text dimColor>Busca: </Text>
              {shownSearch}
              {searching ? "▌" : ""}
            </Text>
          ) : (
            <Text dimColor>/ buscar</Text>
          )}
        </Box>
      </Box>
      <Box>
        <Cell width={4}>{""}</Cell>
        <Cell width={nameWidth} dimColor>
          {nameTitle}
        </Cell>
        <Cell width={detailWidth} dimColor>
          {detailTitle}
        </Cell>
        <Cell width={12} dimColor>
          Última
        </Cell>
        <Cell width={8} align="right" dimColor>
          Tokens
        </Cell>
        <Cell width={6} align="right" dimColor>
          Cache
        </Cell>
        <Cell width={20} align="right" dimColor>
          Custo
        </Cell>
      </Box>
      {rows.slice(start, end).map((row, offset) => {
        const selected = start + offset === cursor;
        const only = row.providers.length === 1 ? row.providers[0] : null;
        return (
          <Box key={row.key}>
            <Cell width={2} bold>
              {selected ? "›" : ""}
            </Cell>
            <Cell
              width={2}
              color={tint(only ? providerInfo[only].color : undefined)}
            >
              {only ? providerInfo[only].letter : "∗"}
            </Cell>
            <Cell width={nameWidth} bold={selected}>
              {row.label}
            </Cell>
            <Cell width={detailWidth} dimColor>
              {row.detail}
            </Cell>
            <Cell width={12}>
              {row.timestamp
                ? `${shortDate(dayKey(row.timestamp))} ${formatTime(row.timestamp)}`
                : "—"}
            </Cell>
            <Cell width={8} align="right">
              {formatTokens(row.tokens)}
            </Cell>
            <Cell width={6} align="right">
              {percent(row.cacheRate, 0)}
            </Cell>
            <Cell width={20} align="right">
              {costText(row)}
            </Cell>
          </Box>
        );
      })}
      {rows.length ? (
        <Text dimColor wrap="truncate-end">
          {start + 1}–{end} de {rows.length}
          {partial ? " · * parte dos registros sem estimativa de custo" : ""}
        </Text>
      ) : (
        <Text dimColor>
          Nenhum registro encontrado. Experimente outro período, serviço ou
          busca.
        </Text>
      )}
    </Box>
  );
}
