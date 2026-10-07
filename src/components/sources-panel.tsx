"use client";
import { useRef, useState } from "react";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDashedIcon,
  InfoIcon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react";
import { formatDate, formatNumber, formatTime } from "@/lib/analytics";
import { providerInfo, type SourceStatus } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const statusLabels = {
  connected: "Coletando",
  empty: "Sem contadores",
  missing: "Não encontrado",
  error: "Requer atenção",
};

export function SourcesPanel({
  sources,
  onImport,
}: {
  sources: SourceStatus[];
  onImport: () => Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null),
    [uploading, setUploading] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    setError(false);
    try {
      if (file.size > 4 * 1024 * 1024)
        throw new Error("Selecione um arquivo de até 4 MB.");
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await file.text(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(
        `${formatNumber(result.added)} novos registros; ${formatNumber(result.processed)} processados. Importações repetidas não duplicam consumo.`,
      );
      await onImport();
    } catch (error) {
      setError(true);
      setMessage(
        error instanceof Error ? error.message : "Não foi possível importar.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  const tools = sources.filter((source) => source.channel === "tool");
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            Suas fontes de consumo
          </CardTitle>
          <CardDescription>
            Leitura automática do histórico local deste computador. Nenhuma
            chave de API necessária.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {tools.map((source, index) => (
            <div key={source.id} className="flex flex-col gap-4">
              {index > 0 && <Separator />}
              <article className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-sm font-medium">{source.name}</h3>
                    <code className="truncate font-mono text-xs text-muted-foreground">
                      {source.location}
                    </code>
                  </div>
                  <Badge
                    variant={
                      source.state === "error"
                        ? "destructive"
                        : source.state === "connected"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {source.state === "connected" ? (
                      <CheckCircle2Icon data-icon="inline-start" />
                    ) : source.state === "error" ? (
                      <TriangleAlertIcon data-icon="inline-start" />
                    ) : (
                      <CircleDashedIcon data-icon="inline-start" />
                    )}
                    {statusLabels[source.state]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{source.detail}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                  <span>
                    {formatNumber(source.files)}{" "}
                    {source.files === 1
                      ? "arquivo consultado"
                      : "arquivos consultados"}
                  </span>
                  <span>
                    {formatNumber(source.events)}{" "}
                    {source.events === 1
                      ? "registro de uso"
                      : "registros de uso"}
                  </span>
                  {source.latest && (
                    <span>
                      Último: {formatDate(source.latest)},{" "}
                      {formatTime(source.latest)}
                    </span>
                  )}
                </div>
                {source.warnings > 0 && (
                  <p className="text-sm text-destructive">
                    {source.warnings} arquivo(s) ou registro(s) de{" "}
                    {providerInfo[source.provider].name} não puderam ser lidos.
                    Os totais podem estar incompletos.
                  </p>
                )}
              </article>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              Traga seus logs de API
            </CardTitle>
            <CardDescription>
              Importe os contadores retornados por Grok, OpenAI, Claude ou
              Gemini. O arquivo é processado neste computador.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              hidden
              ref={fileInput}
              type="file"
              accept=".json,.jsonl,application/json"
              aria-label="Arquivo de consumo de API"
              onChange={(event) => upload(event.target.files?.[0])}
            />
            <Button
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              <UploadIcon data-icon="inline-start" />
              {uploading ? "Importando…" : "Importar JSON ou JSONL"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Até 4 MB · 10.000 registros por arquivo
            </p>
            {message && (
              <p
                className={
                  error ? "text-sm text-destructive" : "text-sm text-foreground"
                }
                role={error ? "alert" : "status"}
              >
                {message}
              </p>
            )}
            <Collapsible className="rounded-lg border text-sm">
              <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-lg p-3 text-left font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-data-panel-open:rotate-90" />
                Como preparar o arquivo
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-2 px-3 pb-3 text-muted-foreground">
                <p>
                  Uma chamada por registro, com provider (codex, claude, grok ou
                  gemini), timestamp, model, project opcional e usage. Para
                  Gemini use usageMetadata. Inclua o ID da chamada para
                  deduplicar.
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">
                  {
                    '{\n  "provider": "grok",\n  "timestamp": "DATA_ISO_DA_CHAMADA",\n  "id": "ID_DA_CHAMADA",\n  "model": "MODELO_UTILIZADO",\n  "usage": {\n    "prompt_tokens": 1200,\n    "completion_tokens": 300\n  }\n}'
                  }
                </pre>
                <p className="text-xs">
                  Exemplo de formato. Esses valores não entram na dashboard.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        <Alert>
          <InfoIcon />
          <AlertDescription>
            O histórico local cobre as sessões salvas nesta máquina. Uso nos
            sites, em outros computadores e chamadas sem logs não aparece
            automaticamente.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
