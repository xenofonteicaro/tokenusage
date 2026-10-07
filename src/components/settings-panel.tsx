"use client";
import { useState } from "react";
import { Check, Save, ShieldCheck, Wallet } from "lucide-react";
import { PROVIDERS, providerInfo, type Settings } from "@/lib/types";
import { formatBRL } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import type { ModelPrice } from "@/lib/pricing/types";
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
  const [modelName, setModelName] = useState("");
  const prices = { ...DEFAULT_MODEL_PRICES, ...values.customPricing };
  function updatePrice(model: string, field: keyof ModelPrice, value: number) {
    setState("idle");
    setValues({
      ...values,
      customPricing: {
        ...values.customPricing,
        [model]: { ...prices[model], [field]: value },
      },
    });
  }
  function removePrice(model: string) {
    const customPricing = { ...values.customPricing };
    delete customPricing[model];
    setState("idle");
    setValues({ ...values, customPricing });
  }
  function addModel() {
    const model = modelName.trim().toLowerCase();
    if (!model || Object.hasOwn(prices, model)) {
      setError(
        model ? "Este modelo já está na tabela." : "Informe o nome do modelo.",
      );
      return;
    }
    setValues({
      ...values,
      customPricing: {
        ...values.customPricing,
        [model]: { inputPer1M: 0, outputPer1M: 0, cacheReadPer1M: 0 },
      },
    });
    setState("idle");
    setError("");
    setModelName("");
  }
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
        <Tabs defaultValue="general">
          <TabsList aria-label="Preferências">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="pricing">Tabela de preços</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <p className="muted">
              Informe o que você paga nas assinaturas. Esses valores ficam
              separados dos custos registrados pelas ferramentas.
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
                  <Input
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
                Opcional. Acompanhamento de consumo, sem bloquear suas
                ferramentas.
              </small>
              <Input
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
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  });
                }}
              />
            </label>

            <label className="goal-field">
              <span>Cotação do Dólar (USD / BRL)</span>
              <small>
                Usada para estimar custos e economia em reais. Padrão: R$ 5,75.
              </small>
              <Input
                type="number"
                min="0.01"
                max="100"
                step="any"
                inputMode="decimal"
                placeholder="5.75"
                value={values.usdToBrlRate ?? 5.75}
                onChange={(event) => {
                  setState("idle");
                  setValues({
                    ...values,
                    usdToBrlRate:
                      event.target.value === ""
                        ? 5.75
                        : Number(event.target.value),
                  });
                }}
              />
            </label>
          </TabsContent>
          <TabsContent value="pricing">
            <div className="pricing-section pt-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <strong className="block text-sm font-semibold">
                    Tabela de Preços por Modelo (USD por 1M tokens)
                  </strong>
                  <small className="text-[var(--muted-foreground)]">
                    Preços de referência históricos, sem atualização automática.
                    Personalize para estimar ferramentas sem custo informado.
                  </small>
                </div>
              </div>

              <div className="add-model-fields">
                <label>
                  <span>Nome do modelo</span>
                  <Input
                    value={modelName}
                    maxLength={100}
                    placeholder="Ex.: meu-modelo"
                    onChange={(event) => setModelName(event.target.value)}
                  />
                </label>
                <Button variant="outline" type="button" onClick={addModel}>
                  Adicionar modelo
                </Button>
              </div>
              <div className="table-scroll pricing-table-scroll">
                <Table className="pricing-table">
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Entrada ($)</th>
                      <th>Saída ($)</th>
                      <th>Cache ($)</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(prices).map(([model, price]) => (
                      <tr key={model}>
                        <td className="pricing-model">
                          {model}
                          {values.customPricing?.[model] && (
                            <Badge variant="outline">Personalizado</Badge>
                          )}
                        </td>
                        {(
                          [
                            ["inputPer1M", "Entrada"],
                            ["outputPer1M", "Saída"],
                            ["cacheReadPer1M", "Cache"],
                          ] as const
                        ).map(([field, label]) => (
                          <td key={field}>
                            <Input
                              type="number"
                              min="0"
                              max="1000000"
                              step="any"
                              required
                              inputMode="decimal"
                              aria-label={`${label} de ${model}`}
                              value={price[field]}
                              onChange={(event) =>
                                updatePrice(
                                  model,
                                  field,
                                  Number(event.target.value),
                                )
                              }
                            />
                          </td>
                        ))}
                        <td>
                          {values.customPricing?.[model] && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`${DEFAULT_MODEL_PRICES[model] ? "Restaurar padrão" : "Remover modelo"} de ${model}`}
                              onClick={() => removePrice(model)}
                            >
                              {DEFAULT_MODEL_PRICES[model]
                                ? "Restaurar padrão"
                                : "Remover modelo"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button
          variant="outline"
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
        </Button>
      </form>
      <Card className="privacy-panel">
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
      </Card>
    </div>
  );
}
