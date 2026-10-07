"use client";
import { useState } from "react";
import { Check, Save, ShieldCheck, Wallet } from "lucide-react";
import { PROVIDERS, providerInfo, type Settings } from "@/lib/types";
import { formatBRL } from "@/lib/analytics";

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
