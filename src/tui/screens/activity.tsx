import { Box, Text } from "ink";
import { dayKey } from "../../lib/analytics";
import { providerInfo } from "../../lib/types";
import {
  groupLabel,
  type ActivityRow,
  type CostKind,
  type GroupMode,
} from "../activity-rows";
import { Cell } from "../components/cell";
import { tint, visibleWindow } from "../format";
import type { TuiI18n } from "../i18n";
import { useI18n } from "../i18n-context";
import type { ScreenProps } from "./types";

// Wide enough for "10/07 09:00 AM".
const LAST_WIDTH = 15;

function columnTitles(mode: GroupMode, t: TuiI18n["t"]): [string, string] {
  if (mode === "session") return [t("Project"), t("Models")];
  if (mode === "model") return [t("Model"), t("Service")];
  if (mode === "project") return [t("Project"), t("Services")];
  return [t("Day"), t("Sessions")];
}

function costKindLabel(kind: CostKind | null, t: TuiI18n["t"]): string {
  if (kind === "actual") return t("actual");
  if (kind === "est.") return t("est.");
  return t("mixed");
}

function costText(row: ActivityRow, i18n: TuiI18n): string {
  if (row.costUSD === null) return "—";
  return `${i18n.formatUSD(row.costUSD)} ${costKindLabel(row.costKind, i18n.t)}${row.uncovered > 0 ? "*" : ""}`;
}

export function ActivityScreen({
  ctx,
  width,
  cursor,
  pageSize,
  searching,
}: ScreenProps) {
  const i18n = useI18n();
  const { t, percent, formatTokens, formatTime } = i18n;
  const { rows, group, search } = ctx;
  const { start, end } = visibleWindow(rows.length, cursor, pageSize);
  const fixed = 4 + LAST_WIDTH + 8 + 6 + 20;
  const flex = Math.max(20, width - fixed);
  const nameWidth = Math.floor(flex * 0.4);
  const detailWidth = flex - nameWidth;
  const [nameTitle, detailTitle] = columnTitles(group, t);
  // Keep the end of long (pasted) queries and leave the header room to breathe.
  const searchRoom = Math.max(4, Math.floor(width / 2) - 8);
  const shownSearch =
    search.length > searchRoom ? `…${search.slice(-(searchRoom - 1))}` : search;
  const partial = rows.some((row) => row.costUSD !== null && row.uncovered > 0);
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text wrap="truncate-end">
          <Text dimColor>{t("Grouped by")} </Text>
          <Text bold>{groupLabel(group, t)}</Text>
          <Text dimColor> (g) · {i18n.tn(rows.length, "item", "items")}</Text>
        </Text>
        <Box flexShrink={0} marginLeft={2}>
          {search || searching ? (
            <Text>
              <Text dimColor>{t("Search:")} </Text>
              {shownSearch}
              {searching ? "▌" : ""}
            </Text>
          ) : (
            <Text dimColor>{t("/ search")}</Text>
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
        <Cell width={LAST_WIDTH} dimColor>
          {t("Last")}
        </Cell>
        <Cell width={8} align="right" dimColor>
          Tokens
        </Cell>
        <Cell width={6} align="right" dimColor>
          Cache
        </Cell>
        <Cell width={20} align="right" dimColor>
          {t("Cost")}
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
            <Cell width={LAST_WIDTH}>
              {row.timestamp
                ? `${i18n.shortDate(dayKey(row.timestamp))} ${formatTime(row.timestamp)}`
                : "—"}
            </Cell>
            <Cell width={8} align="right">
              {formatTokens(row.tokens)}
            </Cell>
            <Cell width={6} align="right">
              {percent(row.cacheRate, 0)}
            </Cell>
            <Cell width={20} align="right">
              {costText(row, i18n)}
            </Cell>
          </Box>
        );
      })}
      {rows.length ? (
        <Text dimColor wrap="truncate-end">
          {t("{from}–{to} of {total}", {
            from: start + 1,
            to: end,
            total: rows.length,
          })}
          {partial ? ` · ${t("* some records have no cost estimate")}` : ""}
        </Text>
      ) : (
        <Text dimColor>
          {t("No records found. Try another period, service or search.")}
        </Text>
      )}
    </Box>
  );
}
