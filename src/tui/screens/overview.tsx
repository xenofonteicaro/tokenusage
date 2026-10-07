import { useMemo } from "react";
import { Box, Text } from "ink";
import { dailySeries } from "../../lib/analytics";
import { overviewMetrics } from "../../lib/overview-metrics";
import { PROVIDERS, providerInfo, type Provider } from "../../lib/types";
import { bucketSeries, stackedColumns } from "../chart";
import { Cell } from "../components/cell";
import { bar, tint } from "../format";
import { useI18n } from "../i18n-context";
import type { TuiI18n } from "../i18n";
import { overviewLayout } from "../layout";
import type { ScreenProps } from "./types";

type Metrics = ReturnType<typeof overviewMetrics>;

interface CardData {
  label: string;
  value: string;
  caption: string;
}

function cards(data: Metrics, channel: "tool" | "api", i18n: TuiI18n) {
  const { t, tn, percent, formatTokens, formatNumber, formatUSD, formatBRL } =
    i18n;
  const {
    metrics,
    models,
    projects,
    change,
    hasCost,
    hasSavings,
    savingsShare,
    unpricedCache,
  } = data;
  const costKind = metrics.estimatedRecords
    ? metrics.costsKnown
      ? t("Misto")
      : t("Estimado")
    : t("Real");
  const list: CardData[] = [
    {
      label: "TOKENS",
      value: formatTokens(metrics.tokens),
      caption:
        change !== null
          ? `${change >= 0 ? "▲" : "▼"} ${t("{change} vs. anterior", { change: percent(Math.abs(change)) })}`
          : t("{input} ent. + {output} saí.", {
              input: formatTokens(metrics.input),
              output: formatTokens(metrics.output),
            }),
    },
    {
      label: "CACHE",
      value: percent(metrics.cacheRate),
      caption: t("{count} reutilizados", {
        count: formatTokens(metrics.cache),
      }),
    },
    {
      label: t("ECONOMIA POR CACHE"),
      value: hasSavings ? formatUSD(metrics.cacheSavingsUSD) : "—",
      caption: hasSavings
        ? `${formatBRL(metrics.cacheSavingsBRL)} · ${percent(savingsShare)} ${unpricedCache > 0 ? t("parcial") : t("s/ cache")}`
        : t("Cache sem tarifa"),
    },
    {
      label: channel === "tool" ? t("SESSÕES") : t("CHAMADAS"),
      value: formatNumber(metrics.sessions),
      caption: `${tn(models.length, "modelo", "modelos")} · ${tn(projects.length, "projeto", "projetos")}`,
    },
    {
      label: t("CUSTO"),
      value: hasCost ? formatUSD(metrics.totalCostUSD) : "—",
      caption: hasCost
        ? `${formatBRL(metrics.totalCostBRL)} · ${costKind}`
        : t("Sem tarifa cadastrada"),
    },
  ];
  return list;
}

function CardGrid({
  list,
  columns,
  width,
}: {
  list: CardData[];
  columns: number;
  width: number;
}) {
  const lines: CardData[][] = [];
  for (let index = 0; index < list.length; index += columns)
    lines.push(list.slice(index, index + columns));
  return (
    <Box flexDirection="column">
      {lines.map((line) => (
        <Box key={line[0].label}>
          {line.map((card) => (
            <Box
              key={card.label}
              width={width}
              flexShrink={0}
              flexDirection="column"
              paddingRight={2}
            >
              <Text wrap="truncate-end" dimColor>
                {card.label}
              </Text>
              <Text wrap="truncate-end" bold>
                {card.value}
              </Text>
              <Text wrap="truncate-end" dimColor>
                {card.caption}
              </Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function Chart({
  series,
  width,
  rows,
}: {
  series: ReturnType<typeof dailySeries>;
  width: number;
  rows: number;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const buckets = bucketSeries(series, width);
  const column = Math.max(1, Math.min(4, Math.floor(width / buckets.length)));
  const grid = stackedColumns(buckets, rows);
  const peak = Math.max(0, ...buckets.map((bucket) => bucket.total));
  const total = buckets.length * column;
  const first = i18n.shortDate(buckets[0].start);
  const last = i18n.shortDate(buckets[buckets.length - 1].end);
  const axis =
    total > first.length + last.length
      ? `${first}${" ".repeat(total - first.length - last.length)}${last}`
      : first;
  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end" bold>
        {t("Consumo diário")}{" "}
        <Text dimColor>
          · {t("pico {peak} por coluna", { peak: i18n.formatTokens(peak) })}
        </Text>
      </Text>
      {grid.map((row, index) => (
        <Text key={index}>
          {row.map((cell, position) => (
            <Text
              key={position}
              color={tint(
                cell.provider ? providerInfo[cell.provider].color : undefined,
              )}
            >
              {cell.char.repeat(column > 1 ? column - 1 : 1)}
              {column > 1 ? " " : ""}
            </Text>
          ))}
        </Text>
      ))}
      <Text dimColor>{axis}</Text>
      <Text wrap="truncate-end">
        {PROVIDERS.map((provider) => (
          <Text key={provider}>
            <Text color={tint(providerInfo[provider].color)}>■</Text>
            <Text dimColor> {providerInfo[provider].name} </Text>
          </Text>
        ))}
      </Text>
    </Box>
  );
}

function Services({
  values,
  total,
  width,
}: {
  values: Record<Provider, number>;
  total: number;
  width: number;
}) {
  const { t, percent, formatTokens } = useI18n();
  const barWidth = Math.max(6, Math.min(24, width - 8 - 8 - 8));
  return (
    <Box flexDirection="column" width={width} flexShrink={0}>
      <Text bold>{t("Por serviço")}</Text>
      {PROVIDERS.map((provider) => {
        const share = total ? values[provider] / total : 0;
        return (
          <Box key={provider}>
            <Cell width={8} color={tint(providerInfo[provider].color)}>
              {providerInfo[provider].name}
            </Cell>
            <Text color={tint(providerInfo[provider].color)}>
              {bar(share, barWidth)}
            </Text>
            <Cell width={8} align="right">
              {values[provider] ? percent(share) : "—"}
            </Cell>
            <Cell width={8} align="right" dimColor>
              {values[provider] ? formatTokens(values[provider]) : ""}
            </Cell>
          </Box>
        );
      })}
    </Box>
  );
}

function Ranking({
  title,
  rows,
  limit,
  total,
  width,
  showCache,
}: {
  title: string;
  rows: Metrics["models"];
  limit: number;
  total: number;
  width: number;
  showCache: boolean;
}) {
  const { t, percent, formatTokens } = useI18n();
  const fixed = 8 + 7 + (showCache ? 6 : 0);
  const name = Math.max(8, width - fixed - 2);
  return (
    <Box flexDirection="column" width={width} flexShrink={0}>
      <Text bold>{title}</Text>
      <Box>
        <Cell width={name + 2} dimColor>
          {t("Nome")}
        </Cell>
        <Cell width={8} align="right" dimColor>
          Tokens
        </Cell>
        {showCache && (
          <Cell width={6} align="right" dimColor>
            Cache
          </Cell>
        )}
        <Cell width={7} align="right" dimColor>
          {t("Part.")}
        </Cell>
      </Box>
      {rows.slice(0, limit).map((row, index) => (
        <Box key={`${row.provider}:${row.name}`}>
          <Cell width={2} color={tint(providerInfo[row.provider].color)}>
            {showCache ? "●" : String(index + 1)}
          </Cell>
          <Cell width={name}>{row.name}</Cell>
          <Cell width={8} align="right">
            {formatTokens(row.tokens)}
          </Cell>
          {showCache && (
            <Cell width={6} align="right">
              {percent(row.cacheRate, 0)}
            </Cell>
          )}
          <Cell width={7} align="right">
            {total ? percent(row.tokens / total) : "—"}
          </Cell>
        </Box>
      ))}
    </Box>
  );
}

function Empty({ channel, filtered }: { channel: string; filtered: boolean }) {
  const { t } = useI18n();
  return (
    <Box flexDirection="column" paddingTop={1}>
      <Text bold>
        {filtered
          ? t("Sem consumo nesta seleção")
          : channel === "api"
            ? t("Nenhuma chamada de API importada")
            : t("Seu histórico começa aqui")}
      </Text>
      <Text dimColor>
        {channel === "api"
          ? t(
              "Importe logs de API pela dashboard web (tokenusage open). Sem registros locais, não há consumo remoto para consultar.",
            )
          : t(
              "Esta seleção não tem registros de tokens. Veja a tela Fontes ou mude os filtros.",
            )}
      </Text>
    </Box>
  );
}

export function OverviewScreen({ ctx, width, height }: ScreenProps) {
  const i18n = useI18n();
  const { t, percent, formatTokens, formatNumber } = i18n;
  const { snapshot, events, filters } = ctx;
  const data = useMemo(
    () => overviewMetrics(snapshot, events, filters),
    [snapshot, events, filters],
  );
  if (!events.length)
    return (
      <Empty
        channel={filters.channel}
        filtered={filters.provider !== "all" || Boolean(filters.project)}
      />
    );
  const {
    metrics,
    models,
    projects,
    values,
    goal,
    monthTokens,
    unestimatedRecords,
  } = data;
  const notes = (goal ? 1 : 0) + (unestimatedRecords > 0 ? 1 : 0);
  const layout = overviewLayout(width, height, notes);
  const series = dailySeries(
    events,
    filters.days,
    new Date(snapshot.generatedAt),
  );
  const servicesWidth = Math.min(40, Math.floor(width * 0.38));
  const chartWidth = layout.wide ? width - servicesWidth - 2 : width;
  const tableWidth = layout.wide ? Math.floor((width - 2) / 2) : width;
  return (
    <Box flexDirection="column">
      <CardGrid
        list={cards(data, filters.channel, i18n)}
        columns={layout.cardColumns}
        width={layout.cardWidth}
      />
      {goal ? (
        <Text wrap="truncate-end">
          <Text dimColor>{t("Meta mensal")} </Text>
          {bar(monthTokens / goal, 20)}
          <Text> {percent(monthTokens / goal, 0)} </Text>
          <Text dimColor>
            ·{" "}
            {t("{used} de {goal}", {
              used: formatTokens(monthTokens),
              goal: formatTokens(goal),
            })}{" "}
            · {filters.channel === "tool" ? t("ferramentas") : "APIs"}
          </Text>
        </Text>
      ) : null}
      {unestimatedRecords > 0 ? (
        <Text wrap="truncate-end" dimColor>
          {t(
            "{missing} de {total} registros sem estimativa de custo (modelo sem tarifa).",
            {
              missing: formatNumber(unestimatedRecords),
              total: formatNumber(metrics.records),
            },
          )}
        </Text>
      ) : null}
      {layout.chartRows > 0 && (
        <Box>
          <Box width={chartWidth} flexShrink={0}>
            <Chart series={series} width={chartWidth} rows={layout.chartRows} />
          </Box>
          {layout.wide && layout.showServices && (
            <Box marginLeft={2}>
              <Services
                values={values}
                total={metrics.tokens}
                width={servicesWidth}
              />
            </Box>
          )}
        </Box>
      )}
      {!layout.wide && layout.showServices && (
        <Services values={values} total={metrics.tokens} width={width} />
      )}
      <Box>
        {layout.modelRows > 0 && (
          <Ranking
            title={t("Modelos mais usados")}
            rows={models}
            limit={layout.modelRows}
            total={metrics.tokens}
            width={tableWidth}
            showCache
          />
        )}
        {layout.wide && layout.projectRows > 0 && (
          <Box marginLeft={2}>
            <Ranking
              title={t("Projetos")}
              rows={projects}
              limit={layout.projectRows}
              total={metrics.tokens}
              width={tableWidth}
              showCache={false}
            />
          </Box>
        )}
      </Box>
      {!layout.wide && layout.projectRows > 0 && (
        <Ranking
          title={t("Projetos")}
          rows={projects}
          limit={layout.projectRows}
          total={metrics.tokens}
          width={width}
          showCache={false}
        />
      )}
    </Box>
  );
}
