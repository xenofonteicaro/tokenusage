import { createHash } from "node:crypto";
import path from "node:path";
import type { UsageEvent, Provider } from "../types";

export type JsonObject = Record<string, unknown>;
export function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}
export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
export function count(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}
export function date(value: unknown): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    return null;
  return new Date(value).toISOString();
}
export function projectName(value: unknown): string {
  const name = path.basename(str(value).replaceAll("\\", "/"));
  return name && name !== "." ? name.slice(0, 100) : "Sem projeto";
}
export function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export function event(
  provider: Provider,
  fields: Partial<UsageEvent> &
    Pick<UsageEvent, "id" | "timestamp" | "sessionId">,
): UsageEvent {
  const inputTokens = count(fields.inputTokens);
  const outputTokens = count(fields.outputTokens);
  return {
    provider,
    channel: fields.channel ?? "tool",
    id: hash(`${provider}:${fields.channel ?? "tool"}:${fields.id}`),
    timestamp: fields.timestamp,
    sessionId: hash(`${provider}:${fields.sessionId}`),
    model: (fields.model || "Modelo não informado").slice(0, 120),
    project: (fields.project || "Sem projeto").slice(0, 100),
    inputTokens,
    outputTokens,
    cachedTokens: Math.min(inputTokens, count(fields.cachedTokens)),
    cacheWriteTokens: Math.min(inputTokens, count(fields.cacheWriteTokens)),
    reasoningTokens: Math.min(outputTokens, count(fields.reasoningTokens)),
    totalTokens: count(fields.totalTokens) || inputTokens + outputTokens,
    costUSD:
      typeof fields.costUSD === "number" &&
      Number.isFinite(fields.costUSD) &&
      fields.costUSD >= 0
        ? fields.costUSD
        : null,
  };
}
