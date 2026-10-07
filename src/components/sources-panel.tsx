"use client";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  FileJson2,
  FolderOpen,
  Info,
  Upload,
  CircleDashed,
  TriangleAlert,
} from "lucide-react";
import { formatDate, formatNumber, formatTime } from "@/lib/analytics";
import { providerInfo, type SourceStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  return (
    <div className="sources-layout">
      <Card className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PERFIL DESTE COMPUTADOR</span>
            <h2>Suas fontes de consumo</h2>
          </div>
          <FolderOpen size={20} />
        </div>
        <p className="muted">
          Leitura automática do histórico local. Nenhuma chave de API
          necessária.
        </p>
        <div className="source-detail-list">
          {sources
            .filter((source) => source.channel === "tool")
            .map((source) => (
              <article key={source.id} className="source-detail">
                <div className="source-detail-heading">
                  <span className={`provider-mark ${source.provider}`}>
                    {providerInfo[source.provider].letter}
                  </span>
                  <div>
                    <h3>{source.name}</h3>
                    <code>{source.location}</code>
                  </div>
                  <span className={`status-pill ${source.state}`}>
                    {source.state === "connected" ? (
                      <CheckCircle2 size={12} />
                    ) : source.state === "error" ? (
                      <TriangleAlert size={12} />
                    ) : (
                      <CircleDashed size={12} />
                    )}
                    {statusLabels[source.state]}
                  </span>
                </div>
                <p>{source.detail}</p>
                <div className="source-metadata">
                  <span>{formatNumber(source.files)} arquivos consultados</span>
                  <span>{formatNumber(source.events)} registros de uso</span>
                  {source.latest && (
                    <span>
                      Último: {formatDate(source.latest)},{" "}
                      {formatTime(source.latest)}
                    </span>
                  )}
                </div>
                {source.warnings > 0 && (
                  <p className="source-warning">
                    {source.warnings} arquivo(s) ou registro(s) não puderam ser
                    lidos. Os totais podem estar incompletos.
                  </p>
                )}
              </article>
            ))}
        </div>
      </Card>
      <div className="source-aside">
        <Card className="panel import-panel">
          <span className="import-icon">
            <FileJson2 size={25} />
          </span>
          <span className="eyebrow">CHAMADAS DOS SEUS PROJETOS</span>
          <h2>Traga seus logs de API</h2>
          <p>
            Importe os contadores retornados por Grok, OpenAI, Claude ou Gemini.
            O arquivo é processado neste computador.
          </p>
          <Input
            hidden
            ref={fileInput}
            type="file"
            accept=".json,.jsonl,application/json"
            aria-label="Arquivo de consumo de API"
            onChange={(event) => upload(event.target.files?.[0])}
          />
          <Button
            variant="outline"
            className="button primary"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} />
            {uploading ? "Importando…" : "Importar JSON ou JSONL"}
          </Button>
          <small>Até 4 MB · 10.000 registros por arquivo</small>
          {message && (
            <p
              className={error ? "form-error" : "form-success"}
              role={error ? "alert" : "status"}
            >
              {message}
            </p>
          )}
          <details>
            <summary>
              Como preparar o arquivo <ArrowUpRight size={14} />
            </summary>
            <p>
              Uma chamada por registro, com provider (codex, claude, grok ou
              gemini), timestamp, model, project opcional e usage. Para Gemini
              use usageMetadata. Inclua o ID da chamada para deduplicar.
            </p>
            <pre>
              {
                '{\n  "provider": "grok",\n  "timestamp": "DATA_ISO_DA_CHAMADA",\n  "id": "ID_DA_CHAMADA",\n  "model": "MODELO_UTILIZADO",\n  "usage": {\n    "prompt_tokens": 1200,\n    "completion_tokens": 300\n  }\n}'
              }
            </pre>
            <small>
              Exemplo de formato. Esses valores não entram na dashboard.
            </small>
          </details>
        </Card>
        <div className="source-note">
          <Info size={18} />
          <p>
            O histórico local cobre as sessões salvas nesta máquina. Uso nos
            sites, em outros computadores e chamadas sem logs não aparece
            automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
