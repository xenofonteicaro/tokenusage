# Phase 1 implementation plan: Shadcn UI, themes, pricing, and cache savings

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to execute this plan task by task. Completed steps use `- [x]`.

**Goal:** Integrate shadcn, Tailwind v4, and next-themes for Dark/Light/System support, plus model pricing and estimated prompt-cache savings.

**Architecture:** Compose UI primitives in `src/components/ui/`, use CSS-variable theme tokens, and calculate event/aggregate USD/BRL costs in `src/lib/pricing/`. Preserve reported costs and estimate only missing ones. Store exchange rates and custom prices in the existing settings store.

**Stack:** Next.js 16 App Router, React 19, Tailwind v4, next-themes, CVA, clsx, tailwind-merge, lucide-react, Zod, tsx/node:test, and Playwright.

**Specification:** [Phase 1 design](../specs/2026-10-07-fase1-custos-shadcn-design.md).

## Historical delivery snapshot (2026-10-07)

Implementation was completed on `feat/token-usage-dashboard`, with follow-up fixes for editing, cost coverage, precision, and themes. The original delivery used [PR #1](https://github.com/xenofonteicaro/tokenusage/pull/1). Later PRs added the neutral stock shadcn redesign (#2), six languages and sanitized packaging (#3), and unified Homebrew distribution (#4).

- Editable rates, custom models, and default restoration.
- Existing settings contract uses PUT for writes and GET for reads.
- `/api/usage` exposes separate `costMetrics.tool` and `costMetrics.api`; filtered dashboard summaries use current settings.
- Reported and unreported costs remain separate during compaction; retain precision until display and match exact/dated model names.
- No assumed rate for `gpt-5.6-terra` or `gemini-2.0-pro`; use custom prices. Defaults are historical presets, not live quotes.
- Cache savings and their percentage use the modeled no-cache scenario.
- Phase 1 validation recorded 27 unit/integration tests, six Playwright cases, lint, types, formatting, build, and synthetic desktop/mobile captures. Later language coverage added further tests.

## Constraints and review focus

- Never commit real histories, personal metrics, credentials, or `.local-data` files.
- Keep supported startup paths on loopback and preserve parser regression coverage.
- Never replace reported costs with estimates. Distinguish reported, estimated, and uncovered records.
- Group days in America/Sao_Paulo.
- Unknown models remain unestimated rather than breaking calculations or inheriting an unrelated rate.
- Zero cache must not produce division-by-zero or negative savings.
- Light/Dark/System switching must keep readable colors and avoid theme flashes.
- Validate exchange rates; recover invalid stored values to 5.75 and reject invalid updates.
- Reimports and price edits must update summaries without manual cache deletion.

## Task 1: Tailwind v4, utilities, and next-themes

Files: `package.json`, `src/app/globals.css`, `src/lib/utils.ts`, `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`, `src/app/layout.tsx`.

Interfaces: `cn(...inputs: ClassValue[]): string`, ThemeProvider, and ThemeToggle.

- [x] Install dependencies.

```sh
npm install tailwindcss @tailwindcss/postcss next-themes clsx tailwind-merge class-variance-authority
```

- [x] Implement the class-name helper with clsx/tailwind-merge.
- [x] Add Tailwind and theme CSS variables for background, foreground, card, primary, muted, border, and related tokens in light/dark roots.
- [x] Create the client ThemeProvider with class-based System defaults and a Light/Dark/System toggle.
- [x] Wrap root-layout children and add `suppressHydrationWarning` to `html`.
- [x] Validate types and build.

```sh
npm run typecheck
npm run build
```

- [x] Commit as `feat(ui): setup tailwind v4, next-themes and shadcn utils`.

## Task 2: UI primitives

Files: `src/components/ui/{button,card,badge,input,select,tabs}.tsx` (the later stock redesign replaced select with NativeSelect).

- [x] Create Button variants and sizes.
- [x] Create Card, CardHeader, CardTitle, CardDescription, CardContent, and CardFooter.
- [x] Create Badge variants for value provenance and source states.
- [x] Create Input/Select with focus, hover, disabled, and dark-theme states.
- [x] Create keyboard-accessible Tabs, TabsList, TabsTrigger, and TabsContent.
- [x] Validate types with `npm run typecheck`.
- [x] Commit as `feat(ui): add core shadcn primitives (button, card, badge, input, select, tabs)`.

## Task 3: Pricing and cache savings

Files: `src/lib/pricing/{types,defaults,calculator}.ts`, `tests/pricing.test.ts`.

Interfaces: `findModelPrice`, `calculateEventCost`, and `calculateCacheSavings`, using normalized usage events and per-million-token model prices.

- [x] Write tests for exact/dated model matching, missing-cost estimates, reported-cost precedence, cache savings, BRL conversion, and unknown models.
- [x] Run the initial failing test before implementation.

```sh
npx tsx --test tests/pricing.test.ts
```

- [x] Implement price types (`inputPer1M`, `outputPer1M`, `cacheReadPer1M`) and historical Anthropic/OpenAI/xAI/Google presets.
- [x] Implement matching, cost calculation, cache savings, and exchange conversion.
- [x] Re-run pricing tests and verify success.
- [x] Commit as `feat(pricing): implement model pricing engine, cache savings and currency conversion`.

## Task 4: Settings persistence

Files: `src/lib/types.ts`, `src/lib/local-store.ts`, `src/app/api/settings/route.ts`.

- [x] Add optional `usdToBrlRate` (positive, default 5.75) and `customPricing` (model-to-rate mapping) to types and schema.
- [x] Validate settings writes and reads while retaining local Host/Origin guards. The delivered write endpoint uses PUT.
- [x] Run the original 13 regressions plus the new pricing tests with `npm test`.
- [x] Commit as `feat(settings): support custom model prices and usd/brl rate in local settings`.

## Task 5: Analytics integration

Files: `src/lib/analytics.ts`, `src/app/api/usage/route.ts`.

- [x] Extend summaries with reported/estimated USD/BRL costs, cache savings, and cost coverage.
- [x] Load current prices/rate before computing usage metrics and return the new indicators.
- [x] Validate all tests with `npm test`.
- [x] Commit as `feat(analytics): integrate estimated cost and cache savings in usage payload`.

## Task 6: Dashboard UI

Files: dashboard, overview, settings, activity, and sources components.

- [x] Add ThemeToggle to the header.
- [x] Add a cache-savings card and explicit reported/estimated cost breakdown with coverage.
- [x] Add the USD/BRL field and editable per-model rate table.
- [x] Replace legacy tables/cards with theme-aware shadcn compositions.
- [x] Validate lint, types, and production build.

```sh
npm run lint
npm run typecheck
npm run build
```

- [x] Commit as `feat(ui): modernize dashboard with shadcn components, theme toggle and pricing panels`.

## Task 7: Browser and visual validation

File: `tests/browser/dashboard.spec.ts`.

- [x] Add Light/Dark/System tests, cache-savings/cost assertions, and exchange-rate editing flows.
- [x] Run unit and browser suites against isolated synthetic data.

```sh
npm test
npm run test:e2e
```

- [x] Commit as `test(e2e): add browser tests for dark mode, cache savings and pricing settings`.

## Task 8: Documentation and PR

File: `README.md`.

- [x] Document themes, model prices, cache savings, and USD/BRL exchange.
- [x] Commit as `docs: update README with pricing engine, cache savings and shadcn theme guide`, push the feature branch, and open the delivery PR.
- [x] Keep all later source/documentation work in English, with supported interface languages confined to localization resources and their explicit test expectations.
