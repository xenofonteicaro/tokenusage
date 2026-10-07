"use client";
import { useI18n } from "./language-provider";
import {
  ArrowUpRightIcon,
  LayersIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from "lucide-react";
import {
  dailySeries,
  dayKey,
  groupEvents,
  previousChange,
  totals,
  type Filters,
} from "@/lib/analytics";
import {
  PROVIDERS,
  providerInfo,
  type Provider,
  type Snapshot,
  type UsageEvent,
} from "@/lib/types";
import { calculateEventCost, findModelPrice } from "@/lib/pricing/calculator";
import { cn } from "@/lib/utils";
import { UsageChart } from "./usage-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function Overview({
  snapshot,
  events,
  filters,
  onFilter,
  navigate,
}: {
  snapshot: Snapshot;
  events: UsageEvent[];
  filters: Filters;
  onFilter: (filters: Filters) => void;
  navigate: (view: "activity" | "settings" | "sources") => void;
}) {
  const { t, formatDecimal, formatTokens, formatNumber, formatUSD, formatBRL } =
    useI18n();
  const percent = (value: number, digits = 1) =>
    `${formatDecimal(value * 100, digits)}%`;
  const pricingConfig = {
    customPrices: snapshot.settings.customPricing,
    usdToBrlRate: snapshot.settings.usdToBrlRate,
  };
  const metrics = totals(events, pricingConfig),
    models = groupEvents(events, "model", pricingConfig),
    projects = groupEvents(events, "project", pricingConfig);
  const values = Object.fromEntries(
    PROVIDERS.map((provider) => [
      provider,
      totals(
        events.filter((row) => row.provider === provider),
        pricingConfig,
      ).tokens,
    ]),
  ) as Record<Provider, number>;
  const available = snapshot.sources
    .filter(
      (source) =>
        source.channel === filters.channel && source.state === "connected",
    )
    .map((source) => source.provider);
  const now = new Date(snapshot.generatedAt);
  const change = previousChange(snapshot.events, filters, now),
    hasData = events.length > 0;
  const hasCost = metrics.costsKnown + metrics.estimatedRecords > 0;
  const unestimatedRecords = Math.max(
    0,
    metrics.records - metrics.costsKnown - metrics.estimatedRecords,
  );
  const modeledCostUSD = events.reduce(
    (sum, event) =>
      sum +
      (calculateEventCost({ ...event, costUSD: null }, pricingConfig).costUSD ??
        0),
    0,
  );
  const cacheEvents = events.filter((event) => event.cachedTokens > 0);
  const unpricedCache = cacheEvents.filter(
    (event) => !findModelPrice(event.model, pricingConfig.customPrices),
  ).length;
  // Cache tokens with no tariff make the saving unknown, not zero.
  const hasSavings =
    hasData &&
    !(cacheEvents.length > 0 && unpricedCache === cacheEvents.length);
  const savingsShare =
    modeledCostUSD + metrics.cacheSavingsUSD > 0
      ? metrics.cacheSavingsUSD / (modeledCostUSD + metrics.cacheSavingsUSD)
      : 0;
  const subscriptions = Object.values(
    snapshot.settings.subscriptions,
  ).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const goal = snapshot.settings.monthlyTokenGoal;
  const monthTokens = totals(
    snapshot.events.filter(
      (row) =>
        row.channel === filters.channel &&
        (filters.provider === "all" || row.provider === filters.provider) &&
        (!filters.project || row.project === filters.project) &&
        dayKey(row.timestamp).slice(0, 7) === dayKey(now).slice(0, 7),
    ),
  ).tokens;
  const uncoveredModels = models.filter(
    (row) => row.records > row.costsKnown + row.estimatedRecords,
  );
  const rate = snapshot.settings.usdToBrlRate ?? 5.75;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card data-metric={t("tokens")}>
          <CardHeader>
            <CardDescription>{t("Tokens consumidos")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {hasData ? formatTokens(metrics.tokens) : "—"}
            </CardTitle>
            {change !== null && (
              <CardAction>
                <Badge variant="outline">
                  {change >= 0 ? (
                    <TrendingUpIcon data-icon="inline-start" />
                  ) : (
                    <TrendingDownIcon data-icon="inline-start" />
                  )}
                  {percent(Math.abs(change))}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-1 flex-col items-start justify-start gap-1 text-sm">
            <div className="font-medium">
              {change !== null
                ? change >= 0
                  ? t("Acima do período anterior")
                  : t("Abaixo do período anterior")
                : hasData
                  ? t("Sem período anterior para comparar")
                  : t("Sem registros no período")}
            </div>
            {hasData && (
              <div className="text-muted-foreground">
                {formatTokens(metrics.input)} {t("entrada ·")}{" "}
                {formatTokens(metrics.output)} {t("saída")}
              </div>
            )}
          </CardFooter>
        </Card>
        <Card data-metric="cost">
          <CardHeader>
            <CardDescription>{t("Custo no período")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {hasCost ? formatUSD(metrics.totalCostUSD) : "—"}
            </CardTitle>
            {hasCost && (
              <CardAction>
                <Badge variant="outline">
                  {unestimatedRecords > 0 && (
                    <TriangleAlertIcon data-icon="inline-start" />
                  )}
                  {unestimatedRecords > 0
                    ? t("Parcial")
                    : metrics.estimatedRecords
                      ? metrics.costsKnown
                        ? t("Misto")
                        : t("Estimado")
                      : t("Real")}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-1 flex-col items-start justify-start gap-1 text-sm">
            <div className="font-medium">
              {hasCost
                ? t("{amount} · cotação {rate}", {
                    amount: formatBRL(metrics.totalCostBRL),
                    rate: formatDecimal(rate, 2),
                  })
                : t("Preço por modelo não cadastrado")}
            </div>
            {hasCost && (
              <div className="text-muted-foreground">
                {[
                  metrics.costsKnown > 0 &&
                    t("Informado {amount}", {
                      amount: formatUSD(metrics.realCostUSD),
                    }),
                  metrics.estimatedRecords > 0 &&
                    t("estimado {amount}", {
                      amount: formatUSD(metrics.estimatedCostUSD),
                    }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
            {unestimatedRecords > 0 && (
              <div className="text-muted-foreground">
                {formatNumber(unestimatedRecords)} {t("de")}{" "}
                {formatNumber(metrics.records)} {t("registros sem estimativa")}
              </div>
            )}
          </CardFooter>
        </Card>
        <Card data-metric="savings">
          <CardHeader>
            <CardDescription>{t("Economia por cache")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {hasSavings ? formatUSD(metrics.cacheSavingsUSD) : "—"}
            </CardTitle>
            {hasSavings && (
              <CardAction>
                <Badge variant="outline">
                  {unpricedCache > 0 && (
                    <TriangleAlertIcon data-icon="inline-start" />
                  )}
                  {unpricedCache > 0 ? t("Parcial") : t("Estimada")}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-1 flex-col items-start justify-start gap-1 text-sm">
            <div className="font-medium">
              {hasSavings
                ? t("{amount} economizados", {
                    amount: formatBRL(metrics.cacheSavingsBRL),
                  })
                : cacheEvents.length
                  ? t("Sem tarifa para estimar")
                  : t("Sem tokens de cache no período")}
            </div>
            {hasSavings && (
              <div className="text-muted-foreground">
                {percent(savingsShare)} {t("do custo sem cache")}
              </div>
            )}
            {hasSavings && unpricedCache > 0 && (
              <div className="text-muted-foreground">
                {formatNumber(unpricedCache)} {t("de")}{" "}
                {formatNumber(cacheEvents.length)}{" "}
                {t("registros com cache sem tarifa")}
              </div>
            )}
          </CardFooter>
        </Card>
        <Card data-metric="cache">
          <CardHeader>
            <CardDescription>{t("Aproveitamento de cache")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {hasData ? percent(metrics.cacheRate) : "—"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-1 flex-col items-start justify-start gap-1 text-sm">
            <div className="font-medium">
              {hasData
                ? t("{count} tokens reutilizados", {
                    count: formatTokens(metrics.cache),
                  })
                : t("Aguardando contadores de tokens")}
            </div>
            {hasData && (
              <div className="text-muted-foreground">
                {t("de")} {formatTokens(metrics.input)} {t("tokens de entrada")}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {hasData ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("Consumo por dia")}</CardTitle>
            <CardDescription>
              {t("Entrada + saída, com cache · últimos")} {filters.days}{" "}
              {t("dias")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsageChart series={dailySeries(events, filters.days, now)} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LayersIcon />
                </EmptyMedia>
                <EmptyTitle role="heading" aria-level={2}>
                  {filters.provider !== "all" || filters.project
                    ? t("Sem consumo nesta seleção")
                    : filters.channel === "api"
                      ? t("Suas chamadas de API, em um só lugar")
                      : t("Seu histórico começa aqui")}
                </EmptyTitle>
                <EmptyDescription>
                  {filters.channel === "api"
                    ? t(
                        "Importe logs com os contadores retornados pelas APIs. Sem registros locais, não há consumo remoto disponível para consultar.",
                      )
                    : t(
                        "Esta seleção não tem registros de tokens. Consulte o diagnóstico das fontes ou experimente outros filtros.",
                      )}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => navigate("sources")}>
                  {filters.channel === "api"
                    ? t("Importar consumo de API")
                    : t("Ver fontes de dados")}
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("Por serviço")}</CardTitle>
            <CardDescription>{t("Participação no consumo")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[...PROVIDERS]
              .sort(
                (a, b) =>
                  Number(available.includes(b)) -
                    Number(available.includes(a)) || values[b] - values[a],
              )
              .map((provider) => {
                const share = metrics.tokens
                  ? values[provider] / metrics.tokens
                  : 0;
                const chosen = filters.provider === provider;
                return (
                  <button
                    key={provider}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() =>
                      onFilter({
                        ...filters,
                        provider: chosen ? "all" : provider,
                        project: "",
                      })
                    }
                    className={cn(
                      "-mx-2 flex flex-col gap-2 rounded-md px-2 py-2 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50",
                      chosen && "bg-muted",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">
                        {providerInfo[provider].name}{" "}
                        <span className="font-normal text-muted-foreground">
                          {providerInfo[provider].company}
                        </span>
                      </span>
                      {!available.includes(provider) ? (
                        <Badge variant="outline">{t("Sem dados")}</Badge>
                      ) : values[provider] ? (
                        <span className="tabular-nums">
                          {formatTokens(values[provider])}{" "}
                          <span className="text-muted-foreground">
                            · {percent(share, 0)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("Sem consumo")}
                        </span>
                      )}
                    </span>
                    {available.includes(provider) ? (
                      <Progress
                        value={share * 100}
                        aria-label={`${providerInfo[provider].name}: ${percent(share, 0)}`}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("Nenhum contador no histórico")}{" "}
                        {filters.channel === "tool"
                          ? t("local")
                          : t("importado")}
                        .
                      </span>
                    )}
                  </button>
                );
              })}
          </CardContent>
        </Card>

        {hasData && (
          <Card>
            <CardHeader>
              <CardTitle>{t("Por projeto")}</CardTitle>
              <CardDescription>{t("Seu foco no período")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {projects.slice(0, 5).map((row) => {
                const share = row.tokens / metrics.tokens;
                const chosen = filters.project === row.name;
                return (
                  <button
                    key={row.name}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() =>
                      onFilter({ ...filters, project: chosen ? "" : row.name })
                    }
                    className={cn(
                      "-mx-2 flex flex-col gap-2 rounded-md px-2 py-2 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50",
                      chosen && "bg-muted",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium" title={row.name}>
                        {row.name}
                      </span>
                      <span className="tabular-nums">
                        {formatTokens(row.tokens)}
                      </span>
                    </span>
                    <Progress
                      value={share * 100}
                      aria-label={`${row.name}: ${percent(share, 0)}`}
                    />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("Meta mensal de tokens")}</CardTitle>
            <CardDescription>
              {filters.channel === "tool" ? t("Ferramentas") : "APIs"}
              {t(", mês atual")}
              {filters.provider !== "all" || filters.project
                ? t(" · seleção atual")
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {goal ? (
              <>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-2xl font-semibold tabular-nums">
                    {formatTokens(monthTokens)}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {t("de")} {formatTokens(goal)} ·{" "}
                    {percent(monthTokens / goal, 0)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (monthTokens / goal) * 100)}
                  aria-label={t("Meta mensal: {percent}", {
                    percent: percent(monthTokens / goal, 0),
                  })}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t(
                  "Nenhuma meta definida. A meta acompanha o consumo sem bloquear suas ferramentas.",
                )}
              </p>
            )}
            <Separator className="my-2" />
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{t("Mensalidades")}</span>
              <span className="tabular-nums">
                {subscriptions
                  ? t("{amount}/mês", { amount: formatBRL(subscriptions) })
                  : t("Não informado")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {subscriptions
                ? t(
                    "Valores informados por você, separados do custo de tokens.",
                  )
                : t(
                    "Adicione as mensalidades para acompanhar seu investimento em IA.",
                  )}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("settings")}
            >
              {t("Configurar")}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Modelos mais usados")}</CardTitle>
            <CardDescription>
              {models.length} {models.length === 1 ? t("modelo") : t("modelos")}{" "}
              {t("em")} {formatNumber(metrics.sessions)}{" "}
              {filters.channel === "tool"
                ? metrics.sessions === 1
                  ? t("sessão")
                  : t("sessões")
                : metrics.sessions === 1
                  ? t("chamada")
                  : t("chamadas")}
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("activity")}
              >
                {t("Ver atividade")}
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {uncoveredModels.length > 0 && (
              <Alert>
                <TriangleAlertIcon />
                <AlertTitle>{t("Custo parcial")}</AlertTitle>
                <AlertDescription>
                  {uncoveredModels
                    .slice(0, 3)
                    .map((row) => row.name)
                    .join(", ")}
                  {uncoveredModels.length > 3 &&
                    t("e mais {count}", {
                      count: uncoveredModels.length - 3,
                    })}{" "}
                  {t(
                    "sem tarifa cadastrada; esses registros ficam fora do custo.",
                  )}{" "}
                  <button
                    type="button"
                    className="font-medium text-foreground underline underline-offset-3"
                    onClick={() => navigate("settings")}
                  >
                    {t("Definir tarifa")}
                  </button>
                </AlertDescription>
              </Alert>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Modelo")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("Serviço")}
                  </TableHead>
                  <TableHead className="text-right">{t("Tokens")}</TableHead>
                  <TableHead className="text-right">{t("Cache")}</TableHead>
                  <TableHead className="text-right">{t("Custo")}</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    {t("Participação")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.slice(0, 8).map((row) => {
                  const covered = row.costsKnown + row.estimatedRecords;
                  return (
                    <TableRow key={`${row.provider}:${row.name}`}>
                      <TableCell
                        className="max-w-64 truncate font-medium"
                        title={row.name}
                      >
                        {row.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">
                          {providerInfo[row.provider].name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatTokens(row.tokens)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {percent(row.cacheRate, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {covered ? (
                          formatUSD(row.totalCostUSD)
                        ) : (
                          <span className="text-muted-foreground">
                            {t("sem tarifa")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {percent(row.tokens / metrics.tokens)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
