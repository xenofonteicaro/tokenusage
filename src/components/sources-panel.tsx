"use client";
import { useI18n } from "./language-provider";
import { useRef, useState } from "react";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDashedIcon,
  InfoIcon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react";
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
  connected: "Collecting",
  empty: "No counters",
  missing: "Not found",
  error: "Needs attention",
};

export function SourcesPanel({
  sources,
  onImport,
}: {
  sources: SourceStatus[];
  onImport: () => Promise<void>;
}) {
  const { t, formatNumber, formatDate, formatTime } = useI18n();
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
        throw new Error(t("Select a file up to 4 MB."));
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await file.text(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(
        t(
          "{added} new records; {processed} processed. Repeated imports do not duplicate usage.",
          {
            added: formatNumber(result.added),
            processed: formatNumber(result.processed),
          },
        ),
      );
      await onImport();
    } catch (error) {
      setError(true);
      setMessage(
        error instanceof Error ? error.message : t("Could not import."),
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
            {t("Your usage sources")}
          </CardTitle>
          <CardDescription>
            {t(
              "Automatic reading of this computer’s local history. No API key required.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {tools.map((source, index) => (
            <div key={source.id} className="flex flex-col gap-4">
              {index > 0 && <Separator />}
              <article className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-sm font-medium">{t(source.name)}</h3>
                    <code className="truncate font-mono text-xs text-muted-foreground">
                      {t(source.location)}
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
                    {t(statusLabels[source.state])}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(source.detail)}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                  <span>
                    {formatNumber(source.files)}{" "}
                    {source.files === 1
                      ? t("file checked")
                      : t("files checked")}
                  </span>
                  <span>
                    {formatNumber(source.events)}{" "}
                    {source.events === 1
                      ? t("usage record")
                      : t("usage records")}
                  </span>
                  {source.latest && (
                    <span>
                      {t("Latest:")} {formatDate(source.latest)},{" "}
                      {formatTime(source.latest)}
                    </span>
                  )}
                </div>
                {source.warnings > 0 && (
                  <p className="text-sm text-destructive">
                    {source.warnings} {t("files or records from")}{" "}
                    {providerInfo[source.provider].name}{" "}
                    {t("could not be read. Totals may be incomplete.")}
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
              {t("Bring your API logs")}
            </CardTitle>
            <CardDescription>
              {t(
                "Import counters returned by Grok, OpenAI, Claude or Gemini. The file is processed on this computer.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              hidden
              ref={fileInput}
              type="file"
              accept=".json,.jsonl,application/json"
              aria-label={t("API usage file")}
              onChange={(event) => upload(event.target.files?.[0])}
            />
            <Button
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              <UploadIcon data-icon="inline-start" />
              {uploading ? t("Importing…") : t("Import JSON or JSONL")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("Up to 4 MB · 10,000 records per file")}
            </p>
            {message && (
              <p
                className={
                  error ? "text-sm text-destructive" : "text-sm text-foreground"
                }
                role={error ? "alert" : "status"}
              >
                {t(message)}
              </p>
            )}
            <Collapsible className="rounded-lg border text-sm">
              <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-lg p-3 text-left font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-data-panel-open:rotate-90" />
                {t("How to prepare the file")}
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-2 px-3 pb-3 text-muted-foreground">
                <p>
                  {t(
                    "One request per record, with provider (codex, claude, grok or gemini), timestamp, model, optional project and usage. For Gemini use usageMetadata. Include the request ID to avoid duplicates.",
                  )}
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground">
                  {
                    '{\n  "provider": "grok",\n  "timestamp": "CALL_TIMESTAMP_ISO",\n  "id": "CALL_ID",\n  "model": "MODEL_NAME",\n  "usage": {\n    "prompt_tokens": 1200,\n    "completion_tokens": 300\n  }\n}'
                  }
                </pre>
                <p className="text-xs">
                  {t(
                    "Format example. These values are not added to the dashboard.",
                  )}
                </p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        <Alert>
          <InfoIcon />
          <AlertDescription>
            {t(
              "Local history covers sessions saved on this computer. Website usage, other computers and requests without logs do not appear automatically.",
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
