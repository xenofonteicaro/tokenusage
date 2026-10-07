"use client";
import { useI18n } from "./language-provider";
import { useState } from "react";
import {
  CheckIcon,
  RotateCcwIcon,
  SaveIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { PROVIDERS, providerInfo, type Settings } from "@/lib/types";
import type { ModelPrice } from "@/lib/pricing/types";
import { DEFAULT_MODEL_PRICES } from "@/lib/pricing/defaults";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { LANGUAGES, type Language } from "@/lib/i18n/languages";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SettingsPanel({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (settings: Settings) => void;
}) {
  const { t, formatBRL } = useI18n();
  const [values, setValues] = useState(settings),
    [state, setState] = useState<"idle" | "saving" | "saved">("idle"),
    [error, setError] = useState("");
  const [modelName, setModelName] = useState("");
  const prices = { ...DEFAULT_MODEL_PRICES, ...values.customPricing };
  const hasCustom = Object.keys(values.customPricing ?? {}).length > 0;
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
        model
          ? t("This model is already in the table.")
          : t("Enter the model name."),
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
      setError(error instanceof Error ? error.message : t("Could not save."));
      setState("idle");
    }
  }
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:gap-6 lg:grid-cols-3">
      <form onSubmit={save} className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              {t("Tracking preferences")}
            </CardTitle>
            <CardDescription>
              {t(
                "Subscription fees, token goal, exchange rate and model prices.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList aria-label={t("Preferences")} activateOnFocus>
                <TabsTrigger value="general">{t("General")}</TabsTrigger>
                <TabsTrigger value="pricing">{t("Price table")}</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="pt-4">
                <FieldGroup>
                  <Field className="language-field">
                    <FieldLabel htmlFor="interface-language">
                      {t("Interface language")}
                    </FieldLabel>
                    <NativeSelect
                      id="interface-language"
                      aria-describedby="language-hint"
                      value={values.language ?? "pt-BR"}
                      onChange={(event) => {
                        setState("idle");
                        setValues({
                          ...values,
                          language: event.target.value as Language,
                        });
                      }}
                    >
                      {LANGUAGES.map(({ code, name }) => (
                        <NativeSelectOption key={code} value={code} lang={code}>
                          {name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldDescription id="language-hint">
                      {t("Your choice takes effect when you save preferences.")}
                    </FieldDescription>
                  </Field>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "Enter what you pay for subscriptions. These amounts are separate from costs recorded by the tools.",
                    )}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {PROVIDERS.map((provider) => (
                      <Field key={provider}>
                        <FieldLabel htmlFor={`subscription-${provider}`}>
                          {providerInfo[provider].name}
                          <span className="font-normal text-muted-foreground">
                            {t("R$ / month")}
                          </span>
                        </FieldLabel>
                        <Input
                          id={`subscription-${provider}`}
                          type="number"
                          min="0"
                          max="1000000"
                          step="0.01"
                          inputMode="decimal"
                          placeholder={t("Not provided")}
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
                      </Field>
                    ))}
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("Reported monthly total")}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatBRL(monthly)}
                    </span>
                  </div>
                  <Separator />
                  <Field>
                    <FieldLabel htmlFor="monthly-goal">
                      {t("Monthly token goal")}
                    </FieldLabel>
                    <Input
                      id="monthly-goal"
                      type="number"
                      min="1"
                      max="1000000000000"
                      step="1"
                      inputMode="numeric"
                      placeholder={t("E.g. 100000000")}
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
                    <FieldDescription>
                      {t("Optional. Track usage without blocking your tools.")}
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="usd-brl">
                      {t("Dollar exchange rate (USD / BRL)")}
                    </FieldLabel>
                    <Input
                      id="usd-brl"
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
                    <FieldDescription>
                      {t(
                        "Used to estimate costs and savings in BRL. Default: R$ 5.75.",
                      )}
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </TabsContent>
              <TabsContent value="pricing" className="pt-4">
                <FieldGroup>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {t("Model price table (USD per 1M tokens)")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "Historical reference prices, without automatic updates. Customize to estimate tools with no reported costs.",
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Field className="sm:flex-1">
                      <FieldLabel htmlFor="model-name">
                        {t("Model name")}
                      </FieldLabel>
                      <Input
                        id="model-name"
                        value={modelName}
                        maxLength={100}
                        placeholder={t("E.g. my-model")}
                        onChange={(event) => setModelName(event.target.value)}
                      />
                    </Field>
                    <Button variant="outline" type="button" onClick={addModel}>
                      {t("Add model")}
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Model")}</TableHead>
                        <TableHead>{t("Input ($)")}</TableHead>
                        <TableHead>{t("Output ($)")}</TableHead>
                        <TableHead>{t("Cache ($)")}</TableHead>
                        {hasCustom && (
                          <TableHead className="text-right">
                            {t("Actions")}
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(prices).map(([model, price]) => (
                        <TableRow key={model}>
                          <TableCell className="font-medium">
                            <span className="inline-flex items-center gap-2">
                              {model}
                              {values.customPricing?.[model] && (
                                <Badge variant="secondary">{t("Custom")}</Badge>
                              )}
                            </span>
                          </TableCell>
                          {(
                            [
                              ["inputPer1M", t("Input")],
                              ["outputPer1M", t("Output")],
                              ["cacheReadPer1M", t("Cache")],
                            ] as const
                          ).map(([field, label]) => (
                            <TableCell key={field}>
                              <Input
                                className="w-24 text-right tabular-nums"
                                type="number"
                                min="0"
                                max="1000000"
                                step="any"
                                required
                                inputMode="decimal"
                                aria-label={t("{label} for {model}", {
                                  label: t(label),
                                  model,
                                })}
                                value={price[field]}
                                onChange={(event) =>
                                  updatePrice(
                                    model,
                                    field,
                                    Number(event.target.value),
                                  )
                                }
                              />
                            </TableCell>
                          ))}
                          {hasCustom && (
                            <TableCell className="text-right">
                              {values.customPricing?.[model] && (
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={t("{label} for {model}", {
                                          label: DEFAULT_MODEL_PRICES[model]
                                            ? t("Restore default")
                                            : t("Remove model"),
                                          model,
                                        })}
                                        onClick={() => removePrice(model)}
                                      />
                                    }
                                  >
                                    {DEFAULT_MODEL_PRICES[model] ? (
                                      <RotateCcwIcon />
                                    ) : (
                                      <Trash2Icon />
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {DEFAULT_MODEL_PRICES[model]
                                      ? t("Restore default")
                                      : t("Remove model")}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </FieldGroup>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button disabled={state === "saving"} type="submit">
              {state === "saved" ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              {state === "saving"
                ? t("Saving…")
                : state === "saved"
                  ? t("Preferences saved")
                  : t("Save preferences")}
            </Button>
            {error && <FieldError role="alert">{t(error)}</FieldError>}
          </CardFooter>
        </Card>
      </form>
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            {t("Your history stays here")}
          </CardTitle>
          <CardDescription>{t("Local execution, no login.")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            {t(
              "Collectors read token counters and session metadata. Conversation content is not sent to the browser.",
            )}
          </p>
          <p>
            {t(
              "Preferences and metrics are stored locally on this computer. The dashboard uses no login cookies or tool keys.",
            )}
          </p>
        </CardContent>
        <CardFooter>
          <Badge variant="outline">
            <ShieldCheckIcon data-icon="inline-start" />
            {t("Local execution")}
          </Badge>
        </CardFooter>
      </Card>
    </div>
  );
}
