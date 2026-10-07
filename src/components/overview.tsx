"use client";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircleHelp,
  Coins,
  Folder,
  Layers3,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  dailySeries,
  dayKey,
  formatBRL,
  formatNumber,
  formatTokens,
  formatUSD,
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
import { Badge } from "@/components/ui/badge";
import { ProviderDonut, UsageChart } from "./usage-chart";

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
      totals(events.filter((row) => row.provider === provider), pricingConfig)
        .tokens,
    ]),
  ) as Record<Provider, number>;
  const now = new Date(snapshot.generatedAt);
  const change = previousChange(snapshot.events, filters, now),
    hasData = events.length > 0;
  const costCoverage = metrics.records
    ? (metrics.costsKnown / metrics.records) * 100
    : 0;
  const costCoverageLabel =
    costCoverage < 0.1
      ? "<0,1%"
      : `${costCoverage.toFixed(1).replace(".", ",")}%`;
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
  return (
    <>
      <div className="metric-grid">
        <Metric
          label="TOKENS CONSUMIDOS"
          value={hasData ? formatTokens(metrics.tokens) : "—"}
          icon={Layers3}
          highlight
        >
          <span>
            {change !== null ? (
              <>
                <span className="metric-change">
                  {change >= 0 ? (
                    <ArrowUpRight size={13} />
                  ) : (
                    <ArrowDown size={13} />
                  )}
                  {Math.abs(change * 100)
                    .toFixed(1)
                    .replace(".", ",")}
                  %
                </span>
                vs. período anterior
              </>
            ) : hasData ? (
              `${formatTokens(metrics.input)} entrada + ${formatTokens(metrics.output)} saída`
            ) : (
              "Sem registros no período"
            )}
          </span>
        </Metric>
        <Metric
          label="APROVEITAMENTO DE CACHE"
          value={
            hasData
              ? `${(metrics.cacheRate * 100).toFixed(1).replace(".", ",")}%`
              : "—"
          }
          icon={RefreshCw}
        >
          <span>
            {hasData
              ? `${formatTokens(metrics.cache)} tokens reutilizados`
              : "Aguardando contadores de tokens"}
          </span>
        </Metric>
        <Metric
          label="ECONOMIA POR CACHE"
          value={
            hasData && metrics.cacheSavingsUSD > 0
              ? formatUSD(metrics.cacheSavingsUSD)
              : "—"
          }
          icon={Sparkles}
        >
          <span>
            {hasData && metrics.cacheSavingsUSD > 0 ? (
              <>
                <Badge variant="success" className="mr-1 text-[10px] px-1.5 py-0">
                  Economizado
                </Badge>
                {formatBRL(metrics.cacheSavingsBRL)}
              </>
            ) : (
              "Sem tokens de cache no período"
            )}
          </span>
        </Metric>
        <Metric
          label={
            filters.channel === "tool"
              ? "SESSÕES COM CONSUMO"
              : "CHAMADAS IMPORTADAS"
          }
          value={hasData ? formatNumber(metrics.sessions) : "—"}
          icon={Activity}
        >
          <span>
            {hasData
              ? `${models.length} modelos · ${projects.length} projetos`
              : "Nenhum histórico nesta seleção"}
          </span>
        </Metric>
        <Metric
          label="CUSTO ESTIMADO / REAL"
          value={
            metrics.totalCostUSD > 0
              ? formatUSD(metrics.totalCostUSD)
              : metrics.costsKnown
                ? formatUSD(metrics.cost)
                : "—"
          }
          icon={Coins}
        >
          <span>
            {metrics.totalCostUSD > 0 ? (
              <>
                <span className="font-medium mr-1">
                  {formatBRL(metrics.totalCostBRL)}
                </span>
                {metrics.estimatedRecords > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {metrics.costsKnown > 0 ? "Híbrido" : "Estimado"}
                  </Badge>
                )}
              </>
            ) : metrics.costsKnown ? (
              `${costCoverageLabel} dos registros têm custo`
            ) : (
              "Preço por modelo não cadastrado"
            )}
            <span
              className="info-tip"
              title="Valores calculados com base na tabela de preços por modelo em USD/BRL e nos custos nativos informados pelas ferramentas."
            >
              <CircleHelp size={13} />
            </span>
          </span>
        </Metric>
      </div>
      <div className="provider-grid">
        {PROVIDERS.map((provider) => {
          const source = snapshot.sources.find(
            (source) =>
              source.provider === provider &&
              source.channel === filters.channel,
          );
          return (
            <button
              key={provider}
              className={`provider-card ${filters.provider === provider ? "chosen" : ""}`}
              onClick={() =>
                onFilter({
                  ...filters,
                  provider: filters.provider === provider ? "all" : provider,
                  project: "",
                })
              }
            >
              <div>
                <span className={`provider-mark ${provider}`}>
                  {providerInfo[provider].letter}
                </span>
                <span>
                  <strong>{providerInfo[provider].name}</strong>
                  <small>{providerInfo[provider].company}</small>
                </span>
                <span
                  className={`provider-state ${source?.state === "connected" ? "available" : ""}`}
                >
                  <i />
                  {source?.state === "connected"
                    ? filters.channel === "tool"
                      ? "Local"
                      : "Importado"
                    : "Sem dados"}
                </span>
              </div>
              <div className="provider-card-bottom">
                <strong>
                  {values[provider] ? formatTokens(values[provider]) : "—"}
                  <small> tokens</small>
                </strong>
                <ArrowUpRight size={15} />
              </div>
            </button>
          );
        })}
      </div>
      {!hasData ? (
        <section className="panel empty-state">
          <span>
            <Layers3 size={26} />
          </span>
          <h2>
            {filters.provider !== "all" || filters.project
              ? "Sem consumo nesta seleção"
              : filters.channel === "api"
                ? "Suas chamadas de API, em um só lugar"
                : "Seu histórico começa aqui"}
          </h2>
          <p>
            {filters.channel === "api"
              ? "Importe logs com os contadores retornados pelas APIs. Sem registros locais, não há consumo remoto disponível para consultar."
              : "Esta seleção não tem registros de tokens. Consulte o diagnóstico das fontes ou experimente outros filtros."}
          </p>
          <button
            className="button primary"
            onClick={() => navigate("sources")}
          >
            {filters.channel === "api"
              ? "Importar consumo de API"
              : "Ver fontes de dados"}
            <ArrowRight size={15} />
          </button>
        </section>
      ) : (
        <>
          <div className="chart-layout">
            <section className="panel timeline-panel">
              <div className="panel-heading">
                <div>
                  <h2>Consumo ao longo do tempo</h2>
                  <p>Um olhar diário sobre o uso de cada serviço.</p>
                </div>
                <span className="subtle-pill">Diário</span>
              </div>
              <UsageChart series={dailySeries(events, filters.days, now)} />
            </section>
            <section className="panel breakdown-panel">
              <div className="panel-heading">
                <div>
                  <h2>Por serviço</h2>
                  <p>Participação no consumo</p>
                </div>
                <BarChart3 size={18} />
              </div>
              <ProviderDonut
                values={values}
                available={snapshot.sources
                  .filter(
                    (source) =>
                      source.channel === filters.channel &&
                      source.state === "connected",
                  )
                  .map((source) => source.provider)}
              />
            </section>
          </div>
          <div className="bottom-layout">
            <section className="panel model-panel">
              <div className="panel-heading">
                <div>
                  <h2>Seus modelos mais usados</h2>
                  <p>Onde os seus tokens estão sendo consumidos.</p>
                </div>
                <span className="subtle-pill">{models.length} modelos</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Tokens</th>
                      <th>Cache</th>
                      <th>Participação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.slice(0, 6).map((row) => (
                      <tr key={`${row.provider}:${row.name}`}>
                        <td>
                          <span className={`model-dot ${row.provider}`} />
                          <span className="model-name" title={row.name}>
                            {row.name}
                          </span>
                          <small>{providerInfo[row.provider].name}</small>
                        </td>
                        <td className="mono">{formatTokens(row.tokens)}</td>
                        <td className="mono">
                          {(row.cacheRate * 100).toFixed(0)}%
                        </td>
                        <td>
                          <span className="table-share">
                            <i
                              style={{
                                width: `${(row.tokens / metrics.tokens) * 100}%`,
                                background: providerInfo[row.provider].color,
                              }}
                            />
                          </span>
                          <span className="mono">
                            {((row.tokens / metrics.tokens) * 100)
                              .toFixed(1)
                              .replace(".", ",")}
                            %
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="panel-footer-link"
                onClick={() => navigate("activity")}
              >
                Explorar atividade <ArrowRight size={14} />
              </button>
            </section>
            <section className="panel projects-panel">
              <div className="panel-heading">
                <div>
                  <h2>Por projeto</h2>
                  <p>Seu foco no período</p>
                </div>
                <Folder size={18} />
              </div>
              <div className="project-list">
                {projects.slice(0, 5).map((row, index) => (
                  <button
                    key={row.name}
                    onClick={() => onFilter({ ...filters, project: row.name })}
                  >
                    <span className="project-rank">0{index + 1}</span>
                    <div>
                      <strong title={row.name}>{row.name}</strong>
                      <span className="project-progress">
                        <i
                          style={{
                            width: `${(row.tokens / metrics.tokens) * 100}%`,
                          }}
                        />
                      </span>
                    </div>
                    <b>{formatTokens(row.tokens)}</b>
                  </button>
                ))}
              </div>
              <div className="project-insight">
                <Sparkles size={16} />
                <p>
                  <strong>{projects[0].name}</strong> representa{" "}
                  {((projects[0].tokens / metrics.tokens) * 100).toFixed(0)}% do
                  seu consumo neste período.
                </p>
              </div>
            </section>
          </div>
        </>
      )}
      <div className="monthly-strip">
        <span className="monthly-icon">
          <Coins size={21} />
        </span>
        <div>
          <strong>Assinaturas por mês</strong>
          <p>
            {subscriptions
              ? "Valores informados por você, separados do custo de tokens."
              : "Adicione as mensalidades para acompanhar seu investimento em IA."}
          </p>
        </div>
        <b>{subscriptions ? formatBRL(subscriptions) : "Não informado"}</b>
        <button onClick={() => navigate("settings")}>
          Configurar <ArrowUpRight size={15} />
        </button>
      </div>
      {goal && (
        <div className="goal-strip">
          <div>
            <strong>Meta mensal de tokens</strong>
            <span>
              {formatTokens(monthTokens)} de {formatTokens(goal)} ·{" "}
              {filters.channel === "tool" ? "ferramentas" : "APIs"}
              {filters.provider !== "all" || filters.project
                ? " · seleção atual"
                : ""}
            </span>
          </div>
          <div className="goal-progress">
            <i
              style={{ width: `${Math.min(100, (monthTokens / goal) * 100)}%` }}
            />
          </div>
          <b>{((monthTokens / goal) * 100).toFixed(0)}%</b>
        </div>
      )}
    </>
  );
}
function Metric({
  label,
  value,
  icon: Icon,
  highlight,
  children,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`metric-card ${highlight ? "metric-highlight" : ""}`}>
      <div>
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong>{value}</strong>
      <div className="metric-caption">{children}</div>
    </section>
  );
}
