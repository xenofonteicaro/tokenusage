# Tokenusage — personal dashboard

## Goal and decisions

The user wants to track Grok, Codex, Claude, and Gemini usage from both
subscription tools and project API requests. Without administrative API access,
the first delivery collects metrics from the local computer profile.

We chose a local app over a hosted app with a synchronization agent or a request
proxy. It reuses retained histories without credentials or workflow changes.
Hosted collection/authentication would require separate work. A proxy would not
recover past usage.

## Sources and limits

- Codex: active/archived JSONL sessions. Calculate cumulative counter deltas,
  skip repeated snapshots, and retain model/project metadata by turn.
- Claude Code: assistant `message.usage`; deduplicate by message ID and retain
  the highest-usage snapshot, including cache.
- Grok Build: session/turn `usage.json`; `summary.json` only for metadata. Ledger
  input includes cache; reasoning is part of output. Costs use 10^10 ticks per
  USD and represent tool-reported values, not a full subscription invoice.
- Gemini CLI: JSON/JSONL sessions with `tokens`. Cache is part of input;
  thoughts are included in normalized output. Old message-only logs cannot
  provide exact usage.
- API: JSON/JSONL imports with per-request usage, including OpenAI/xAI,
  Anthropic, and Gemini formats. Without credentials, unrecorded remote usage
  cannot be collected automatically.

Only dates, project/model names, counters, and reported costs reach persistent
metrics and browser outputs. Cookies/authentication files are not usage sources.
Do not present missing information as zero usage or zero cost.

## Product

Use neutral shadcn/ui with Light, Dark, and System themes. The interface supports
six languages, with Portuguese (Brazil) as the default. Source and documentation
are written in English.

Overview shows tokens, cache utilization, session counts, reported/estimated
costs and coverage, daily usage, provider shares, and model/project rankings.
Activity contains searchable sessions and counters/dates. Data sources provides
diagnostics and imports. Preferences stores language, BRL subscriptions, token
goals, exchange rate, and model prices locally. CSV export respects filters.

Tools and APIs remain separate because adding them could double-count
API-authenticated CLI requests. Group days in America/Sao_Paulo with inclusive
period boundaries and up to 90 days of history.

## Architecture and data

Next.js App Router / Node.js, isolated collectors, typed normalization, and
shared aggregation. Local endpoints return normalized data only. File/mtime
caching avoids re-reading unchanged files. JSONL reads are streamed; selected
Grok/Gemini JSON documents are parsed whole. Traversal has bounded depth and
concurrency and skips discovered symbolic links.

With npm, imported metrics/preferences/cache default to Git-ignored
`.local-data`. Homebrew uses the user's Application Support directory. Writes
are atomic, with process-local mutation/scan coordination. Supported startup
paths bind to 127.0.0.1. Check Host/Origin before accessing personal data.

## Validation and delivery

Test cumulative counters, duplicate streaming, cache/reasoning, repeated
imports, time zones, inclusive periods, missing data, and request origins.
Validate build, lint, types, and synthetic desktop/mobile browser flows.
Commit, push, and open a PR under the user's workflow instructions. A PR alone
does not authorize merging. Keep code, formula, and releases in the same public
repository; distribute an explicitly allowlisted source package without local
profiles or private runtime artifacts.
