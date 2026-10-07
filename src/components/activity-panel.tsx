"use client";
import { useMemo, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import {
  formatDate,
  formatNumber,
  formatTime,
  formatTokens,
  formatUSD,
  sessionGroups,
} from "@/lib/analytics";
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
  const [search, setSearch] = useState(""),
    [limit, setLimit] = useState(20);
  const sessions = useMemo(
    () =>
      sessionGroups(events, pricingConfig).filter((row) =>
        `${row.project} ${row.models.join(" ")} ${providerInfo[row.provider].name}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
      ),
    [events, search, pricingConfig],
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {channel === "tool"
            ? "Histórico de sessões"
            : "Histórico de chamadas"}
        </CardTitle>
        <CardDescription>
          {formatNumber(sessions.length)}{" "}
          {channel === "tool" ? "sessões" : "chamadas"} no período selecionado
        </CardDescription>
        <CardAction>
          <Input
            type="search"
            className="w-48 sm:w-64"
            aria-label="Buscar atividade"
            placeholder="Buscar projeto ou modelo"
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
                <TableHead>Projeto</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Modelos</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cache</TableHead>
                <TableHead className="text-right">Custo</TableHead>
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
                                ? "Misto"
                                : "Estimado"
                              : "Real"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {missing > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(missing)} sem estimativa
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
                Nenhum registro encontrado
              </EmptyTitle>
              <EmptyDescription>
                Experimente outro período, serviço ou busca.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      {sessions.length > limit && (
        <CardFooter className="justify-center">
          <Button variant="ghost" onClick={() => setLimit(limit + 20)}>
            Mostrar mais 20
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
