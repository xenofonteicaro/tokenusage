import type { UsageEvent } from "../types";
import {
  count,
  date,
  event,
  object,
  projectName,
  str,
  type JsonObject,
} from "./normalize";

export interface LineParser {
  push(value: unknown): void;
  finish(): UsageEvent[];
}

export function codexParser(fallbackSession: string): LineParser {
  let session = fallbackSession;
  let project = "Sem projeto";
  let model = "Modelo não informado";
  let previous: number[] | null = null;
  const events = new Map<string, UsageEvent>();
  return {
    push(raw) {
      const record = object(raw);
      const payload = object(record.payload);
      if (record.type === "session_meta") {
        session = str(payload.id, str(payload.session_id, session));
        project = projectName(payload.cwd);
      }
      if (record.type === "turn_context") {
        model = str(payload.model, model);
        if (payload.cwd) project = projectName(payload.cwd);
      }
      if (record.type !== "event_msg" || payload.type !== "token_count") return;
      const usage = object(object(payload.info).total_token_usage);
      const timestamp = date(record.timestamp);
      if (!timestamp || !Object.keys(usage).length) return;
      const totals = [
        usage.input_tokens,
        usage.output_tokens,
        usage.cached_input_tokens,
        usage.cache_write_input_tokens,
        usage.reasoning_output_tokens,
      ].map(count);
      // Resumed sessions may reset counters. Never sum successive cumulative snapshots.
      const reset =
        previous && (totals[0] < previous[0] || totals[1] < previous[1]);
      const delta = totals.map((value, i) =>
        Math.max(0, value - (reset ? 0 : (previous?.[i] ?? 0))),
      );
      previous = totals;
      if (!delta[0] && !delta[1]) return;
      const id = `${timestamp}:${model}:${totals.join(":")}`;
      events.set(
        id,
        event("codex", {
          id,
          sessionId: session,
          timestamp,
          project,
          model,
          inputTokens: delta[0],
          outputTokens: delta[1],
          cachedTokens: delta[2],
          cacheWriteTokens: delta[3],
          reasoningTokens: delta[4],
        }),
      );
    },
    finish: () => [...events.values()],
  };
}

export function claudeParser(fallbackSession: string): LineParser {
  const events = new Map<string, UsageEvent>();
  return {
    push(raw) {
      const record = object(raw);
      const message = object(record.message);
      const usage = object(message.usage);
      const timestamp = date(record.timestamp);
      if (
        record.type !== "assistant" ||
        !timestamp ||
        !Object.keys(usage).length ||
        message.model === "<synthetic>"
      )
        return;
      const session = str(record.sessionId, fallbackSession);
      const id = str(message.id, str(record.uuid));
      if (!id) return;
      const cache = count(usage.cache_read_input_tokens);
      const write = count(usage.cache_creation_input_tokens);
      const next = event("claude", {
        id,
        sessionId: session,
        timestamp,
        project: projectName(record.cwd),
        model: str(message.model),
        inputTokens: count(usage.input_tokens) + cache + write,
        outputTokens: count(usage.output_tokens),
        cachedTokens: cache,
        cacheWriteTokens: write,
        reasoningTokens: count(
          object(usage.output_tokens_details).reasoning_tokens,
        ),
      });
      const existing = events.get(id);
      // Streaming chunks can repeat a message ID. Preserve its largest usage snapshot.
      if (!existing || next.totalTokens >= existing.totalTokens)
        events.set(id, next);
    },
    finish: () => [...events.values()],
  };
}

export function grokEvents(raw: unknown, metadata: unknown): UsageEvent[] {
  const ledger = object(raw);
  const summary = object(metadata);
  const info = object(summary.info);
  const sessionId = str(ledger.sessionId, str(info.id));
  const project = projectName(info.cwd);
  if (!sessionId) return [];
  // Session inputTokens is full input (unlike the CLI headless projection).
  // Per-turn data retains dates/model changes, rather than assigning lifetime use to the last day.
  const turns = Array.isArray(ledger.turns) ? ledger.turns : [];
  return turns
    .flatMap((rawTurn, index) => {
      const turn = object(rawTurn);
      const timestamp = date(turn.endedAt);
      if (!timestamp) return [];
      const models = object(turn.modelUsage);
      const rows: [string, JsonObject][] = Object.keys(models).length
        ? Object.entries(models).map(([model, usage]) => [model, object(usage)])
        : [[str(turn.primaryModelId, str(summary.current_model_id)), turn]];
      return rows.map(([model, usage]) => {
        const input = count(usage.inputTokens);
        const output = count(usage.outputTokens);
        const ticks = usage.costUsdTicks;
        return event("grok", {
          id: `${sessionId}:${turn.turnNumber ?? index}:${model}`,
          sessionId,
          timestamp,
          model,
          project,
          inputTokens: input,
          outputTokens: output,
          cachedTokens: count(usage.cachedReadTokens),
          cacheWriteTokens: count(usage.cacheCreationTokens),
          reasoningTokens: count(usage.reasoningTokens),
          totalTokens: count(usage.totalTokens),
          // A zero legacy tick field may mean no cost was reported for an OAuth call.
          costUSD:
            typeof ticks === "number" &&
            ticks > 0 &&
            !turn.cost_is_partial &&
            !usage.cost_is_partial
              ? ticks / 1e10
              : null,
        });
      });
    })
    .filter((row) => row.totalTokens > 0);
}

export function geminiParser(
  fallbackSession: string,
  fallbackProject = "Sem projeto",
): LineParser {
  let session = fallbackSession;
  let project = fallbackProject;
  const events = new Map<string, UsageEvent>();
  const consumeMessage = (raw: unknown) => {
    const message = object(raw);
    const tokens = object(message.tokens);
    const timestamp = date(message.timestamp);
    const id = str(message.id);
    if (
      message.type !== "gemini" ||
      !timestamp ||
      !id ||
      !Object.keys(tokens).length
    )
      return;
    const next = event("gemini", {
      id: `${session}:${id}`,
      sessionId: session,
      timestamp,
      project,
      model: str(message.model),
      inputTokens: count(tokens.input) + count(tokens.tool),
      outputTokens: count(tokens.output) + count(tokens.thoughts),
      cachedTokens: count(tokens.cached),
      reasoningTokens: count(tokens.thoughts),
      totalTokens: count(tokens.total),
    });
    const old = events.get(id);
    if (!old || next.totalTokens >= old.totalTokens) events.set(id, next);
  };
  return {
    push(raw) {
      const record = object(raw);
      const metadata = Object.keys(object(record.$set)).length
        ? object(record.$set)
        : record;
      session = str(metadata.sessionId, session);
      if (Array.isArray(metadata.directories) && metadata.directories[0])
        project = projectName(metadata.directories[0]);
      if (Array.isArray(metadata.messages))
        metadata.messages.forEach(consumeMessage);
      consumeMessage(record);
      // Rewinding history does not refund already consumed tokens. Keep recorded calls.
    },
    finish: () => [...events.values()],
  };
}
