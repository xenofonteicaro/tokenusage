import type { ModelPrice } from "./pricing/types";

export const PROVIDERS = ["codex", "claude", "grok", "gemini"] as const;
export type Provider = (typeof PROVIDERS)[number];
export type Channel = "tool" | "api";

export const providerInfo: Record<
  Provider,
  { name: string; company: string; color: string; letter: string }
> = {
  codex: { name: "Codex", company: "OpenAI", color: "#288367", letter: "C" },
  claude: {
    name: "Claude",
    company: "Anthropic",
    color: "#ce8765",
    letter: "✳",
  },
  grok: { name: "Grok", company: "xAI", color: "#58606d", letter: "G" },
  gemini: { name: "Gemini", company: "Google", color: "#6888ce", letter: "✦" },
};

// Input includes both cache buckets. Reasoning is a subset of output.
export interface UsageEvent {
  id: string;
  provider: Provider;
  channel: Channel;
  timestamp: string;
  model: string;
  project: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  costUSD: number | null;
  records?: number;
  costRecords?: number;
}

export interface SourceStatus {
  id: string;
  provider: Provider;
  channel: Channel;
  name: string;
  state: "connected" | "empty" | "missing" | "error";
  files: number;
  events: number;
  detail: string;
  location: string;
  latest: string | null;
  warnings: number;
}

export interface Settings {
  language?: import("./i18n/languages").Language;
  monthlyTokenGoal: number | null;
  subscriptions: Record<Provider, number | null>;
  usdToBrlRate?: number;
  customPricing?: Record<string, ModelPrice>;
}

export const defaultSettings: Settings = {
  language: "pt-BR",
  monthlyTokenGoal: null,
  subscriptions: { codex: null, claude: null, grok: null, gemini: null },
  usdToBrlRate: 5.75,
  customPricing: {},
};

export interface Snapshot {
  events: UsageEvent[];
  sources: SourceStatus[];
  generatedAt: string;
  settings: Settings;
  timezone: string;
  historyDays: number;
}
