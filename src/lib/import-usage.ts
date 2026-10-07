import { z } from "zod";
import { PROVIDERS, type UsageEvent } from "./types";
import { count, date, event, hash, object } from "./collectors/normalize";
import {
  currentFallbackLabel,
  LEGACY_IMPORTED_API_PROJECT,
} from "./i18n/legacy-identifiers";

const envelope = z.object({
  provider: z.enum(PROVIDERS),
  timestamp: z.string().refine((value) => date(value) !== null, "Invalid date"),
  id: z.string().max(200).optional(),
  model: z.string().max(120),
  project: z.string().max(100).optional(),
  usage: z.record(z.string(), z.unknown()).optional(),
  usageMetadata: z.record(z.string(), z.unknown()).optional(),
  costUSD: z.number().finite().nonnegative().nullable().optional(),
});

export function parseImport(text: string): UsageEvent[] {
  let records: unknown[];
  try {
    const value: unknown = JSON.parse(text);
    records = Array.isArray(value) ? value : [value];
  } catch {
    try {
      records = text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    } catch {
      throw new Error(
        "Invalid file. Use JSON or JSONL with one usage record per request.",
      );
    }
  }
  if (!records.length || records.length > 10000)
    throw new Error("Import between 1 and 10,000 records per file.");
  const unique = new Map<string, UsageEvent>();
  records.forEach((raw, index) => {
    const parsed = envelope.safeParse(raw);
    if (!parsed.success)
      throw new Error(
        `Record ${index + 1}: provide provider, timestamp, model and usage (or usageMetadata).`,
      );
    const row = parsed.data;
    const usage = object(row.usage ?? row.usageMetadata);
    const tokenKeys = [
      "input_tokens",
      "output_tokens",
      "prompt_tokens",
      "completion_tokens",
      "total_tokens",
      "cache_read_input_tokens",
      "cache_creation_input_tokens",
      "promptTokenCount",
      "candidatesTokenCount",
      "thoughtsTokenCount",
      "cachedContentTokenCount",
      "toolUsePromptTokenCount",
      "totalTokenCount",
    ];
    const counts = tokenKeys
      .filter((key) => key in usage)
      .map((key) => usage[key]);
    for (const detailKey of [
      "input_tokens_details",
      "output_tokens_details",
      "prompt_tokens_details",
      "completion_tokens_details",
    ]) {
      const detail = object(usage[detailKey]);
      for (const key of ["cached_tokens", "reasoning_tokens"])
        if (key in detail) counts.push(detail[key]);
    }
    if (
      counts.some(
        (value) =>
          typeof value !== "number" ||
          !Number.isSafeInteger(value) ||
          value < 0,
      )
    )
      throw new Error(
        `Record ${index + 1}: counters must be nonnegative integers.`,
      );
    let input = 0,
      output = 0,
      cached = 0,
      write = 0,
      reasoning = 0;
    if (row.provider === "claude") {
      cached = count(usage.cache_read_input_tokens);
      write = count(usage.cache_creation_input_tokens);
      input = count(usage.input_tokens) + cached + write;
      output = count(usage.output_tokens);
    } else if (row.provider === "gemini") {
      input =
        count(usage.promptTokenCount) + count(usage.toolUsePromptTokenCount);
      output =
        count(usage.candidatesTokenCount) + count(usage.thoughtsTokenCount);
      cached = count(usage.cachedContentTokenCount);
      reasoning = count(usage.thoughtsTokenCount);
    } else {
      input = count(usage.input_tokens ?? usage.prompt_tokens);
      output = count(usage.output_tokens ?? usage.completion_tokens);
      cached = count(
        object(usage.input_tokens_details ?? usage.prompt_tokens_details)
          .cached_tokens,
      );
      reasoning = count(
        object(usage.output_tokens_details ?? usage.completion_tokens_details)
          .reasoning_tokens,
      );
    }
    if (!input && !output)
      throw new Error(
        `Record ${index + 1}: no recognized token counter for ${row.provider}.`,
      );
    const timestamp = date(row.timestamp)!;
    const project = row.project || "Imported API";
    const identity =
      row.id ||
      hash(
        JSON.stringify([
          row.provider,
          timestamp,
          row.model,
          row.project || LEGACY_IMPORTED_API_PROJECT,
          usage,
        ]),
      );
    const normalized = event(row.provider, {
      id: identity,
      sessionId: identity,
      channel: "api",
      timestamp,
      project,
      model: row.model,
      inputTokens: input,
      outputTokens: output,
      cachedTokens: cached,
      cacheWriteTokens: write,
      reasoningTokens: reasoning,
      costUSD: row.costUSD ?? null,
    });
    unique.set(normalized.id, normalized);
  });
  return [...unique.values()];
}

// Rows saved by earlier releases carry Portuguese fallback labels. Event IDs are
// unchanged, so relabeling never duplicates a record.
export function upgradeLegacyLabels(rows: UsageEvent[]): UsageEvent[] {
  return rows.map((row) => {
    const project = currentFallbackLabel(row.project);
    const model = currentFallbackLabel(row.model);
    return project === row.project && model === row.model
      ? row
      : { ...row, project, model };
  });
}

export function mergeImports(
  existing: UsageEvent[],
  incoming: UsageEvent[],
): UsageEvent[] {
  const merged = new Map(existing.map((row) => [row.id, row]));
  for (const row of incoming) merged.set(row.id, row);
  return [...merged.values()];
}
