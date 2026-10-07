"use client";
import { useState } from "react";
import {
  dailySeries,
  formatDate,
  formatNumber,
  formatTokens,
} from "@/lib/analytics";
import { PROVIDERS, providerInfo, type Provider } from "@/lib/types";

export function UsageChart({
  series,
}: {
  series: ReturnType<typeof dailySeries>;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...series.map((day) => day.total), 1);
  const tick = Math.pow(10, Math.floor(Math.log10(max))) / 5,
    ceiling = Math.ceil(max / tick) * tick;
  const selected = active === null ? null : series[active];
  return (
    <div className="usage-chart">
      <div className="chart-plot">
        <div className="chart-axis" aria-hidden="true">
          {[1, 0.75, 0.5, 0.25, 0].map((fraction) => (
            <span key={fraction}>{formatTokens(ceiling * fraction)}</span>
          ))}
        </div>
        <div className="chart-body">
          <div className="chart-grid" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} />
            ))}
          </div>
          <div className="chart-bars" onMouseLeave={() => setActive(null)}>
            {series.map((day, index) => (
              <button
                key={day.date}
                className={`chart-day ${active === index ? "is-active" : ""}`}
                aria-label={`${formatDate(`${day.date}T12:00:00Z`)}: ${formatNumber(day.total)} tokens`}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                onMouseEnter={() => setActive(index)}
                onClick={() => setActive(active === index ? null : index)}
              >
                <span
                  className="bar-stack"
                  style={{
                    height: `${Math.max((day.total / ceiling) * 100, day.total ? 1 : 0)}%`,
                  }}
                >
                  {PROVIDERS.map(
                    (provider) =>
                      day[provider] > 0 && (
                        <span
                          key={provider}
                          style={{
                            height: `${(day[provider] / day.total) * 100}%`,
                            background: providerInfo[provider].color,
                          }}
                        />
                      ),
                  )}
                </span>
              </button>
            ))}
          </div>
          {selected && (
            <div className="chart-tooltip" role="status">
              <strong>
                {formatDate(`${selected.date}T12:00:00Z`)}
                <span>{formatTokens(selected.total)} tokens</span>
              </strong>
              {PROVIDERS.filter((provider) => selected[provider] > 0).map(
                (provider) => (
                  <div key={provider}>
                    <i style={{ background: providerInfo[provider].color }} />
                    {providerInfo[provider].name}
                    <b>{formatTokens(selected[provider])}</b>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
      <div className="chart-dates" aria-hidden="true">
        {series
          .filter(
            (_, i) =>
              i === 0 ||
              i === series.length - 1 ||
              i % Math.ceil(series.length / 5) === 0,
          )
          .map((day) => (
            <span key={day.date}>{formatDate(`${day.date}T12:00:00Z`)}</span>
          ))}
      </div>
      <div className="chart-legend">
        {PROVIDERS.map((provider) => (
          <span key={provider}>
            <i style={{ background: providerInfo[provider].color }} />
            {providerInfo[provider].name}
          </span>
        ))}
        <span className="chart-legend-note">
          Entrada + saída · inclui cache
        </span>
      </div>
    </div>
  );
}

export function ProviderDonut({
  values,
  available,
}: {
  values: Record<Provider, number>;
  available: Provider[];
}) {
  const total = PROVIDERS.reduce((sum, provider) => sum + values[provider], 0);
  let position = 0;
  const stops = PROVIDERS.map((provider) => {
    const start = position;
    position += total ? (values[provider] / total) * 100 : 0;
    return `${providerInfo[provider].color} ${start}% ${position}%`;
  });
  return (
    <div className="distribution">
      <div
        className="donut"
        role="img"
        aria-label={`Distribuição de ${formatNumber(total)} tokens por serviço`}
        style={{
          background: total
            ? `conic-gradient(${stops.join(",")})`
            : "var(--line)",
        }}
      >
        <div>
          <span>
            {total
              ? PROVIDERS.filter((provider) => values[provider] > 0).length
              : "—"}
          </span>
          <small>serviços usados</small>
        </div>
      </div>
      <div className="distribution-list">
        {PROVIDERS.map((provider) => (
          <div key={provider}>
            <span>
              <i style={{ background: providerInfo[provider].color }} />
              {providerInfo[provider].name}
            </span>
            <b>
              {total && available.includes(provider)
                ? `${((values[provider] / total) * 100).toFixed(1).replace(".", ",")}%`
                : "—"}
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}
