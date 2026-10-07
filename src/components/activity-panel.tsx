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
import { Badge } from "@/components/ui/badge";

export function ActivityPanel({
  events,
  channel,
}: {
  events: UsageEvent[];
  channel: Channel;
}) {
  const [search, setSearch] = useState(""),
    [limit, setLimit] = useState(20);
  const sessions = useMemo(
    () =>
      sessionGroups(events).filter((row) =>
        `${row.project} ${row.models.join(" ")} ${providerInfo[row.provider].name}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
      ),
    [events, search],
  );
  return (
    <section className="panel activity-panel">
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
          <input
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
            <table>
              <thead>
                <tr>
                  <th>Serviço / projeto</th>
                  <th>Modelos</th>
                  <th>Última atividade</th>
                  <th>Tokens</th>
                  <th>Cache</th>
                  <th>Custo informado</th>
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
                      {row.totalCostUSD > 0 ? (
                        <span className="flex items-center gap-1">
                          {formatUSD(row.totalCostUSD)}
                          {row.estimatedRecords > 0 && !row.costsKnown && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              Est.
                            </Badge>
                          )}
                        </span>
                      ) : row.costsKnown ? (
                        formatUSD(row.cost)
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sessions.length > limit && (
            <button
              className="panel-footer-link"
              onClick={() => setLimit(limit + 20)}
            >
              Mostrar mais 20 <ChevronDown size={14} />
            </button>
          )}
        </>
      ) : (
        <div className="empty-table">
          <Search size={24} />
          <h3>Nenhum registro encontrado</h3>
          <p>Experimente outro período, serviço ou busca.</p>
        </div>
      )}
    </section>
  );
}
