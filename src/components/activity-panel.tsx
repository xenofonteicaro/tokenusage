"use client";
import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    <Card className="panel activity-panel">
      <div className="panel-heading">
        <div>
          <h2>
            {channel === "tool"
              ? "Histórico de sessões"
              : "Histórico de chamadas"}
          </h2>
          <p>
            {formatNumber(sessions.length)}{" "}
            {channel === "tool" ? "sessões" : "chamadas"} no período selecionado
          </p>
        </div>
        <label className="search-field">
          <Search size={16} />
          <Input
            aria-label="Buscar atividade"
            placeholder="Buscar projeto ou modelo"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setLimit(20);
            }}
          />
        </label>
      </div>
      {sessions.length ? (
        <>
          <div className="table-scroll">
            <Table>
              <thead>
                <tr>
                  <th>Serviço / projeto</th>
                  <th>Modelos</th>
                  <th>Última atividade</th>
                  <th>Tokens</th>
                  <th>Cache</th>
                  <th>Custo / cobertura</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, limit).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className={`provider-mark ${row.provider}`}>
                        {providerInfo[row.provider].letter}
                      </span>
                      <span>
                        {row.project}
                        <small>{providerInfo[row.provider].name}</small>
                      </span>
                    </td>
                    <td>
                      <span
                        className="activity-model"
                        title={row.models.join(", ")}
                      >
                        {row.models.join(", ")}
                      </span>
                    </td>
                    <td>
                      {formatDate(row.timestamp)}
                      <small>{formatTime(row.timestamp)}</small>
                    </td>
                    <td className="mono">{formatTokens(row.tokens)}</td>
                    <td className="mono">
                      {(row.cacheRate * 100).toFixed(0)}%
                    </td>
                    <td className="mono">
                      {row.costsKnown + row.estimatedRecords > 0 ? (
                        <span>
                          {formatUSD(row.totalCostUSD)}
                          <Badge
                            variant="outline"
                            className="ml-1 text-[9px] px-1 py-0"
                          >
                            {row.estimatedRecords
                              ? row.costsKnown
                                ? "Misto"
                                : "Estimado"
                              : "Real"}
                          </Badge>
                        </span>
                      ) : (
                        "—"
                      )}
                      {row.records > row.costsKnown + row.estimatedRecords && (
                        <small>
                          {formatNumber(
                            row.records - row.costsKnown - row.estimatedRecords,
                          )}{" "}
                          sem estimativa
                        </small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {sessions.length > limit && (
            <Button
              variant="ghost"
              className="panel-footer-link"
              onClick={() => setLimit(limit + 20)}
            >
              Mostrar mais 20 <ChevronDown size={14} />
            </Button>
          )}
        </>
      ) : (
        <div className="empty-table">
          <Search size={24} />
          <h3>Nenhum registro encontrado</h3>
          <p>Experimente outro período, serviço ou busca.</p>
        </div>
      )}
    </Card>
  );
}
