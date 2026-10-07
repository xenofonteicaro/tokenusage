# Phase 1: Shadcn UI, themes, pricing, and cache savings

## Context

Tokenusage reads local histories from Codex, Claude Code, Grok Build, and Gemini
CLI, plus imported API logs. The initial delivery showed costs only when
explicitly reported, such as Grok ticks or imported `costUSD`. Other local tools
may omit USD costs, leaving them unknown.

Phase 1 adds:

1. A shadcn design system with Light/Dark/System themes, Tailwind, and next-themes.
2. Model-based estimated costs when reported costs are absent.
3. Estimated savings from reused cached tokens.
4. A configurable USD/BRL exchange rate alongside existing BRL subscriptions.

## Architecture decisions

### UI and themes

Use Tailwind v4, `@tailwindcss/postcss`, CSS color variables, and next-themes for
persistent theme selection/system detection. Compose components from
`src/components/ui/` in dashboard, overview, activity, sources, settings, and
charts. The later approved design uses stock shadcn base-nova neutral tokens.

### Pricing engine

Keep historical reference prices in `src/lib/pricing/defaults.ts`. The original
planned rates below are USD per million input/output/cache-read tokens and are
not a current provider quote:

| Provider  | Model             | Input | Output | Cache read |
| --------- | ----------------- | ----: | -----: | ---------: |
| Anthropic | claude-3-7-sonnet |  3.00 |  15.00 |       0.30 |
| Anthropic | claude-3-5-sonnet |  3.00 |  15.00 |       0.30 |
| Anthropic | claude-3-5-haiku  |  0.80 |   4.00 |       0.08 |
| Anthropic | claude-3-opus     | 15.00 |  75.00 |       1.50 |
| OpenAI    | gpt-4o            |  2.50 |  10.00 |       1.25 |
| OpenAI    | gpt-4o-mini       |  0.15 |   0.60 |      0.075 |
| OpenAI    | o1                | 15.00 |  60.00 |       7.50 |
| OpenAI    | o3-mini           |  1.10 |   4.40 |       0.55 |
| xAI       | grok-2            |  2.00 |  10.00 |       0.50 |
| xAI       | grok-3            |  3.00 |  15.00 |       0.75 |
| Google    | gemini-1.5-pro    |  3.50 |  10.50 |      0.875 |
| Google    | gemini-1.5-flash  | 0.075 |   0.30 |    0.01875 |
| Google    | gemini-2.0-flash  |  0.10 |   0.40 |      0.025 |

Match exact model names and supported dated snapshots, such as
`claude-3-7-sonnet-20250219`. Users can add/override prices in Preferences,
persisted in the settings store. Unpriced models, including `gpt-5.6-terra` and
`gemini-2.0-pro`, remain explicitly uncovered until a price is supplied.

### Cost and savings rules

- Preserve reported costs, including zero, instead of replacing them with estimates.
- Estimate unreported costs from model rates; unknown models stay unestimated.
- Estimate cache savings as `cachedTokens * (inputRate - cacheReadRate) / 1_000_000`.
- Display USD/BRL savings and compare the modeled cost with the no-cache scenario.
- Default USD/BRL exchange rate: 5.75, editable in Preferences.
- Keep subscription fees separate from usage-based costs.

### Storage and security

Use the existing settings store for prices/rate. Do not version real histories,
personal metrics, or credentials. Strictly validate configuration with Zod and
retain local request-origin protection.

## Validation

Unit tests cover exact/dated model matching, costs with/without cache, reported
cost precedence, unknown-model coverage, cache savings, exchange conversion,
and persisted overrides. Browser tests cover theme classes on `html`, cache
savings and cost coverage, and live price/exchange edits in Preferences.
