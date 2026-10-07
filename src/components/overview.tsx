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
            <CardDescription>{t("Tokens used")}</CardDescription>
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
                  ? t("Above the previous period")
                  : t("Below the previous period")
                : hasData
                  ? t("No previous period to compare")
                  : t("No records in this period")}
            </div>
            {hasData && (
              <div className="text-muted-foreground">
                {formatTokens(metrics.input)} {t("input ·")}{" "}
                {formatTokens(metrics.output)} {t("output")}
              </div>
            )}
          </CardFooter>
        </Card>
        <Card data-metric="cost">
          <CardHeader>
            <CardDescription>{t("Cost in this period")}</CardDescription>
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
                    ? t("Partial")
                    : metrics.estimatedRecords
                      ? metrics.costsKnown
                        ? t("Mixed")
                        : t("Estimated")
                      : t("Actual")}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-1 flex-col items-start justify-start gap-1 text-sm">
            <div className="font-medium">
              {hasCost
                ? t("{amount} · exchange rate {rate}", {
                    amount: formatBRL(metrics.totalCostBRL),
                    rate: formatDecimal(rate, 2),
                  })
                : t("No price set for this model")}
            </div>
            {hasCost && (
              <div className="text-muted-foreground">
                {[
                  metrics.costsKnown > 0 &&
                    t("Reported {amount}", {
                      amount: formatUSD(metrics.realCostUSD),
                    }),
                  metrics.estimatedRecords > 0 &&
                    t("estimated {amount}", {
                      amount: formatUSD(metrics.estimatedCostUSD),
                    }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
            {unestimatedRecords > 0 && (
              <div className="text-muted-foreground">
                {formatNumber(unestimatedRecords)} {t("of")}{" "}
                {formatNumber(metrics.records)}{" "}
                {t("records without an estimate")}
              </div>
            )}
          </CardFooter>
        </Card>
        <Card data-metric="savings">
          <CardHeader>
            <CardDescription>{t("Cache savings")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {hasSavings ? formatUSD(metrics.cacheSavingsUSD) : "—"}
            </CardTitle>
            {hasSavings && (
              <CardAction>
                <Badge variant="outline">
                  {unpricedCache > 0 && (
                    <TriangleAlertIcon data-icon="inline-start" />
                  )}
                  {unpricedCache > 0 ? t("Partial") : t("Estimated savings")}
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-1 flex-col items-start justify-start gap-1 text-sm">
            <div className="font-medium">
              {hasSavings
                ? t("{amount} saved", {
                    amount: formatBRL(metrics.cacheSavingsBRL),
                  })
                : cacheEvents.length
                  ? t("No rate to estimate")
                  : t("No cached tokens in this period")}
            </div>
            {hasSavings && (
              <div className="text-muted-foreground">
                {percent(savingsShare)} {t("of the cost without cache")}
              </div>
            )}
            {hasSavings && unpricedCache > 0 && (
              <div className="text-muted-foreground">
                {formatNumber(unpricedCache)} {t("of")}{" "}
                {formatNumber(cacheEvents.length)}{" "}
                {t("cached records without a rate")}
              </div>
            )}
          </CardFooter>
        </Card>
        <Card data-metric="cache">
          <CardHeader>
            <CardDescription>{t("Cache utilization")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {hasData ? percent(metrics.cacheRate) : "—"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-1 flex-col items-start justify-start gap-1 text-sm">
            <div className="font-medium">
              {hasData
                ? t("{count} reused tokens", {
                    count: formatTokens(metrics.cache),
                  })
                : t("Waiting for token counters")}
            </div>
            {hasData && (
              <div className="text-muted-foreground">
                {t("of")} {formatTokens(metrics.input)} {t("input tokens")}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {hasData ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("Daily usage")}</CardTitle>
            <CardDescription>
              {t("Input + output, including cache · last")} {filters.days}{" "}
              {t("days")}
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
                    ? t("No usage for this selection")
                    : filters.channel === "api"
                      ? t("Your API requests in one place")
                      : t("Your history starts here")}
                </EmptyTitle>
                <EmptyDescription>
                  {filters.channel === "api"
                    ? t(
                        "Import logs with the counters returned by APIs. Without local records, remote usage cannot be retrieved.",
                      )
                    : t(
                        "This selection has no token records. Check source diagnostics or try other filters.",
                      )}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={() => navigate("sources")}>
                  {filters.channel === "api"
                    ? t("Import API usage")
                    : t("View data sources")}
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("By service")}</CardTitle>
            <CardDescription>{t("Share of usage")}</CardDescription>
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
                        <Badge variant="outline">{t("No data")}</Badge>
                      ) : values[provider] ? (
                        <span className="tabular-nums">
                          {formatTokens(values[provider])}{" "}
                          <span className="text-muted-foreground">
                            · {percent(share, 0)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("No usage")}
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
                        {t("No counters in the history")}{" "}
                        {filters.channel === "tool"
                          ? t("local")
                          : t("imported")}
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
              <CardTitle>{t("By project")}</CardTitle>
              <CardDescription>
                {t("Your focus in this period")}
              </CardDescription>
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
            <CardTitle>{t("Monthly token goal")}</CardTitle>
            <CardDescription>
              {filters.channel === "tool" ? t("Tools") : "APIs"}
              {t(", current month")}
              {filters.provider !== "all" || filters.project
                ? t("· current selection")
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
                    {t("of")} {formatTokens(goal)} ·{" "}
                    {percent(monthTokens / goal, 0)}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (monthTokens / goal) * 100)}
                  aria-label={t("Monthly goal: {percent}", {
                    percent: percent(monthTokens / goal, 0),
                  })}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t(
                  "No goal set. The goal tracks usage without blocking your tools.",
                )}
              </p>
            )}
            <Separator className="my-2" />
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{t("Subscription fees")}</span>
              <span className="tabular-nums">
                {subscriptions
                  ? t("{amount}/month", { amount: formatBRL(subscriptions) })
                  : t("Not provided")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {subscriptions
                ? t("Values provided by you, separate from token costs.")
                : t("Add subscription fees to track your spending on AI.")}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("settings")}
            >
              {t("Configure")}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Most used models")}</CardTitle>
            <CardDescription>
              {models.length} {models.length === 1 ? t("model") : t("models")}{" "}
              {t("in")} {formatNumber(metrics.sessions)}{" "}
              {filters.channel === "tool"
                ? metrics.sessions === 1
                  ? t("session")
                  : t("sessions")
                : metrics.sessions === 1
                  ? t("request")
                  : t("requests")}
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("activity")}
              >
                {t("View activity")}
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {uncoveredModels.length > 0 && (
              <Alert>
                <TriangleAlertIcon />
                <AlertTitle>{t("Partial cost")}</AlertTitle>
                <AlertDescription>
                  {uncoveredModels
                    .slice(0, 3)
                    .map((row) => row.name)
                    .join(", ")}
                  {uncoveredModels.length > 3 &&
                    t("and {count} more", {
                      count: uncoveredModels.length - 3,
                    })}{" "}
                  {t(
                    "without a configured rate; these records are excluded from cost.",
                  )}{" "}
                  <button
                    type="button"
                    className="font-medium text-foreground underline underline-offset-3"
                    onClick={() => navigate("settings")}
                  >
                    {t("Set rate")}
                  </button>
                </AlertDescription>
              </Alert>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Model")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("Service")}
                  </TableHead>
                  <TableHead className="text-right">{t("Tokens")}</TableHead>
                  <TableHead className="text-right">{t("Cache")}</TableHead>
                  <TableHead className="text-right">{t("Cost")}</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    {t("Share")}
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
                            {t("no rate")}
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
