# Tokenusage TUI — Phase 1 (read-only)

## Goals and decisions

The user wants the same token usage view as the web dashboard, directly in the
terminal. The end goal is parity with the web app (overview, activity, sources,
preferences and prices, filters, charts, search, and CSV). The scope is large,
so delivery is split:

- **Phase 1 (this spec):** read-only screens — Overview, Activity, and Sources —
  with filters and automatic refresh.
- **Phase 2 (its own spec):** preferences, price editing, log import, and CSV
  export.

Decisions made while brainstorming:

- **A full dashboard in the terminal**, not just a compact panel.
- **Standalone:** the TUI imports `src/lib` directly and depends on neither the
  web service nor port 3000.
- **Ink (React for the terminal) in TypeScript.** It reuses the project stack
  (React 19.3, TypeScript, `tsx`, Node 24) and avoids rewriting collectors,
  parsing, and pricing. Ink 8 requires React ≥ 19.3 and Node ≥ 22. Go with
  Bubble Tea was rejected because it would duplicate the logic in `src/lib`.
- **Interface language:** English is the source language of every message and
  Portuguese (Brazil) has a complete dictionary, matching the web convention.
  The language comes from `--lang`, then from the preference saved in
  `settings.json` (the web's "Interface language"). The other web languages show
  English in the TUI as a whole, never a mix on one screen.

Everything the web app already guarantees still holds: local execution, no
credentials, no conversation content, and missing data shown as `—`, never zero.

## Architecture and data

The TUI lives in `src/tui/` (entry point, `screens/`, `components/`, `hooks/`)
and uses relative imports into `src/lib`, which does not depend on Next.

Two small extractions in existing code, with no change to web behavior:

1. **`src/lib/usage-snapshot.ts`** with `buildUsagePayload()`. It gathers local
   collection, imported logs, source status, and `costMetrics`, which used to
   live inside `src/app/api/usage/route.ts`. The route calls it and returns the
   same response; the TUI calls the same function.
2. **`src/lib/overview-metrics.ts`** with `overviewMetrics()`. It holds the
   numbers the `Overview` component used to compute inline (modeled cost, cache
   savings share, unknown savings when cache has no tariff, month tokens, and
   so on). The web and the TUI use the same function.

Flow: the `useSnapshot` hook loads on start, refreshes every 60 s, and on `r`.
The collectors' per-file mtime cache lives in the process, so later refreshes
are cheap. Filters and charts use `selectEvents`, `totals`, `dailySeries`,
`groupEvents`, `sessionGroups`, and `previousChange` from `analytics.ts`; the TUI
reimplements no calculation.

Real data, `.local-data`, and personal metrics never enter code, fixtures, or
commits. Tests use synthetic data.

## Interface

The app uses the terminal's alternate screen (`alternateScreen`) and adapts to
the window size with `useWindowSize`. The look is plain; colors per service
come from `providerInfo` and respect `NO_COLOR`.

**Global filters** (top bar, valid on every screen), the same `Filters` as the
web: channel (Tools or APIs), period (7, 30, or 90 days), service (All, Codex,
Claude, Grok, Gemini), and project.

**Screens:**

- **Overview:** cards for tokens (with change versus the previous period),
  cache (rate and estimated savings in USD and BRL), cost (reported, estimated,
  and coverage), and sessions; a monthly goal progress bar; a daily series
  stacked by service in Unicode blocks; share by service as horizontal bars;
  model and project rankings.
- **Activity:** a scrollable list with search by project or model; date,
  service, model, project, tokens, and cache; grouping by session, model,
  project, or day.
- **Sources:** each source's state (connected, empty, missing, error), files,
  events, latest record, and warnings about incomplete records.

**Keys:**

| Key                   | Action                              |
| --------------------- | ----------------------------------- |
| `1` `2` `3` or `Tab`  | Switch screen                       |
| `c`                   | Switch between Tools and APIs       |
| `d`                   | Cycle the period (7 → 30 → 90 days) |
| `s`                   | Cycle the service                   |
| `p`                   | Open the project picker             |
| `/`                   | Search (in Activity)                |
| `g`                   | Cycle the grouping (in Activity)    |
| `↑` `↓` `PgUp` `PgDn` | Scroll                              |
| `r`                   | Refresh now                         |
| `?`                   | Help                                |
| `q`                   | Quit                                |

Missing data shows as `—`, never zero, as in the web app. Missing or empty
sources do not distort totals.

## Command and errors

`tokenusage tui` (`npm run tui` during development). Flags: `--days`,
`--channel`, `--lang` (initial filters and language), and `--once`, which renders
a static Overview frame and exits, for pipes and smoke tests.

- A failed refresh keeps the last valid snapshot and shows an error banner. The
  full error screen appears only if the first load fails.
- First load: progress message.
- No TTY and no `--once`: a clear message and exit code 1.
- Terminal smaller than 80×24: a warning instead of a broken layout; it
  re-renders on resize.

## Tests

Same runner as the project (`tsx --test`):

- **Unit:** `usage-snapshot` (the route keeps returning the same payload),
  `overview-metrics` (no data, no tariff, null goal), bar and chart helpers,
  layout budgeting, argument parsing, and the i18n module. A scan test fails
  when a message key used in `src/tui` has no Portuguese translation.
- **Components:** `ink-testing-library` (`lastFrame()`, `stdin.write()`) for
  navigation, filters, search, and both languages with a synthetic snapshot.
- **CLI:** the real entry point through `tsx` against a temporary synthetic
  profile (`--once`, `--help`, error exit codes, saved language).
- The existing tests (`analytics-pricing`, `pricing`, `parsers`, `settings`,
  `languages`, and the Playwright e2e suite) keep passing.

## Packaging

- Dependencies: `ink` (runtime); `ink-testing-library` and `esbuild` (dev).
- Scripts: `npm run tui` (development, via `tsx`) and `npm run build:tui`, which
  writes the self-contained bundle `dist/tui.mjs`.
- Homebrew: the formula pins a released source archive, so the `tokenusage tui`
  subcommand (running the bundle) is wired into the formula with the next
  release. `scripts/build-tui.mjs` is already part of the source package
  allowlist.

## Out of scope

Preferences, price editing, log import, and CSV export (Phase 2); any visual
change to the web dashboard; changes to collectors and the pricing engine;
translations of the TUI beyond English and Portuguese. Phase 2 only needs the
screens to be registered in a list (id, label, component) so a screen can be
added without rewriting the navigation.
