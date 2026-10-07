"use client";
import { useState } from "react";
import { Check, Save, ShieldCheck, Wallet } from "lucide-react";
import { PROVIDERS, providerInfo, type Settings } from "@/lib/types";
import { formatBRL } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_MODEL_PRICES } from "@/lib/pricing/defaults";

export function SettingsPanel({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (settings: Settings) => void;
}) {
  const [values, setValues] = useState(settings),
    [state, setState] = useState<"idle" | "saving" | "saved">("idle"),
    [error, setError] = useState("");
  const monthly = Object.values(values.subscriptions).reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0,
  );
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setState("saving");
    setError("");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onSave(result.settings);
      setState("saved");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
      setState("idle");
    }
  }
  return (
    <div className="settings-layout">
      <form onSubmit={save} className="panel settings-form">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">DO SEU JEITO</span>
            <h2>Preferências de acompanhamento</h2>
          </div>
          <Wallet size={22} />
        </div>
        <p className="muted">
          Informe o que você paga nas assinaturas. Esses valores ficam separados
          dos custos registrados pelas ferramentas.
        </p>
        <div className="subscription-fields">
          {PROVIDERS.map((provider) => (
            <label key={provider}>
              <span>
                <span className={`provider-mark ${provider}`}>
                  {providerInfo[provider].letter}
                </span>
                {providerInfo[provider].name}
                <small>R$ / mês</small>
              </span>
              <input
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                inputMode="decimal"
                placeholder="Não informado"
                value={values.subscriptions[provider] ?? ""}
                onChange={(event) => {
                  setState("idle");
                  setValues({
                    ...values,
                    subscriptions: {
                      ...values.subscriptions,
                      [provider]:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    },
                  });
                }}
              />
            </label>
          ))}
        </div>
        <div className="subscription-total">
          <span>Total mensal informado</span>
          <strong>{formatBRL(monthly)}</strong>
        </div>
        <label className="goal-field">
          <span>Meta mensal de tokens</span>
          <small>
            Opcional. Acompanhamento de consumo, sem bloquear suas ferramentas.
          </small>
          <input
            type="number"
            min="1"
            max="1000000000000"
            step="1"
            inputMode="numeric"
            placeholder="Ex.: 100000000"
            value={values.monthlyTokenGoal ?? ""}
            onChange={(event) => {
              setState("idle");
              setValues({
                ...values,
                monthlyTokenGoal:
                  event.target.value === "" ? null : Number(event.target.value),
              });
            }}
          />
        </label>

        <label className="goal-field">
          <span>Cotação do Dólar (USD / BRL)</span>
          <small>
            Usada para estimar custos e economia em reais. Padrão: R$ 5,75.
          </small>
          <input
            type="number"
            min="1"
            max="100"
            step="0.01"
            inputMode="decimal"
            placeholder="5.75"
            value={values.usdToBrlRate ?? 5.75}
            onChange={(event) => {
              setState("idle");
              setValues({
                ...values,
                usdToBrlRate:
                  event.target.value === "" ? 5.75 : Number(event.target.value),
              });
            }}
          />
        </label>

        <div className="pricing-section pt-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <strong className="block text-sm font-semibold">
                Tabela de Preços por Modelo (USD por 1M tokens)
              </strong>
              <small className="text-[var(--muted-foreground)]">
                Utilizada para estimar custos de ferramentas sem valor
                informado.
              </small>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 my-2 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] pb-1">
                  <th className="py-1 px-2 font-medium">Modelo</th>
                  <th className="py-1 px-2 font-medium">Entrada ($)</th>
                  <th className="py-1 px-2 font-medium">Saída ($)</th>
                  <th className="py-1 px-2 font-medium">Cache ($)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries({
                  ...DEFAULT_MODEL_PRICES,
                  ...(values.customPricing || {}),
                })
                  .slice(0, 10)
                  .map(([model, price]) => {
                    const isCustom = Boolean(values.customPricing?.[model]);
                    return (
                      <tr
                        key={model}
                        className="border-b border-[var(--border)]/40 hover:bg-[var(--secondary)]/40"
                      >
                        <td className="py-1.5 px-2 font-mono">
                          {model}{" "}
                          {isCustom && (
                            <Badge
                              variant="outline"
                              className="ml-1 text-[9px] py-0 px-1"
                            >
                              Personalizado
                            </Badge>
                          )}
                        </td>
                        <td className="py-1.5 px-2 font-mono">
                          ${price.inputPer1M.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 font-mono">
                          ${price.outputPer1M.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 font-mono">
                          ${price.cacheReadPer1M.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button primary"
          disabled={state === "saving"}
          type="submit"
        >
          {state === "saved" ? <Check size={16} /> : <Save size={16} />}
          {state === "saving"
            ? "Salvando…"
            : state === "saved"
              ? "Preferências salvas"
              : "Salvar preferências"}
        </button>
      </form>
      <aside className="privacy-panel">
        <ShieldCheck size={30} />
        <h3>Seu histórico fica aqui.</h3>
        <p>
          Os coletores leem contadores de tokens e metadados de sessão. O
          conteúdo das conversas não é enviado ao navegador.
        </p>
        <p>
          Preferências e métricas são guardadas localmente neste computador. A
          dashboard não usa cookies de login nem chaves das suas ferramentas.
        </p>
        <span className="privacy-badge">
          <i />
          Execução local
        </span>
      </aside>
    </div>
  );
}
