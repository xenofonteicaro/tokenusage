"use client";
import { useI18n } from "./language-provider";
import { useMemo, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { sessionGroups } from "@/lib/analytics";
import { providerInfo, type Channel, type UsageEvent } from "@/lib/types";
import type { PricingConfig } from "@/lib/pricing/types";
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ActivityPanel({
  events,
  channel,
  pricingConfig,
}: {
  events: UsageEvent[];
  channel: Channel;
  pricingConfig?: PricingConfig;
}) {
  const {
    t,
    language,
    formatTokens,
    formatNumber,
    formatUSD,
    formatDate,
    formatTime,
  } = useI18n();
  const [search, setSearch] = useState(""),
    [limit, setLimit] = useState(20);
  const sessions = useMemo(
    () =>
      sessionGroups(events, pricingConfig).filter((row) =>
        `${row.project} ${row.models.join(" ")} ${providerInfo[row.provider].name}`
          .toLocaleLowerCase(language)
          .includes(search.toLocaleLowerCase(language)),
      ),
    [events, search, pricingConfig, language],
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {channel === "tool"
            ? t("Histórico de sessões")
            : t("Histórico de chamadas")}
        </CardTitle>
        <CardDescription>
          {formatNumber(sessions.length)}{" "}
          {channel === "tool" ? t("sessões") : t("chamadas")}{" "}
          {t("no período selecionado")}
        </CardDescription>
        <CardAction>
          <Input
            type="search"
            className="w-48 sm:w-64"
            aria-label={t("Buscar atividade")}
            placeholder={t("Buscar projeto ou modelo")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setLimit(20);
            }}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {sessions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Projeto")}</TableHead>
                <TableHead>{t("Serviço")}</TableHead>
                <TableHead>{t("Modelos")}</TableHead>
                <TableHead>{t("Última atividade")}</TableHead>
                <TableHead className="text-right">{t("Tokens")}</TableHead>
                <TableHead className="text-right">{t("Cache")}</TableHead>
                <TableHead className="text-right">{t("Custo")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, limit).map((row) => {
                const covered = row.costsKnown + row.estimatedRecords;
                const missing = row.records - covered;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.project}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {providerInfo[row.provider].name}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-56 truncate text-muted-foreground"
                      title={row.models.join(", ")}
                    >
                      {row.models.join(", ")}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDate(row.timestamp)}{" "}
                      <span className="text-muted-foreground">
                        {formatTime(row.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTokens(row.tokens)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(row.cacheRate * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {covered > 0 ? (
                        <div className="flex flex-col items-end gap-1">
                          {formatUSD(row.totalCostUSD)}
                          <Badge variant="secondary">
                            {row.estimatedRecords
                              ? row.costsKnown
                                ? t("Misto")
                                : t("Estimado")
                              : t("Real")}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {missing > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(missing)} {t("sem estimativa")}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle role="heading" aria-level={3}>
                {t("Nenhum registro encontrado")}
              </EmptyTitle>
              <EmptyDescription>
                {t("Experimente outro período, serviço ou busca.")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      {sessions.length > limit && (
        <CardFooter className="justify-center">
          <Button variant="ghost" onClick={() => setLimit(limit + 20)}>
            {t("Mostrar mais 20")}
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
