# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A developer using Codex, Claude Code, Grok Build, and Gemini CLI on their own computer. Personal use is confirmed. They open the dashboard for frequent, quick checks of token usage, USD/BRL costs, and cache savings, without sending their history to the cloud.

## Product Purpose

A local dashboard that reads retained tool histories (up to 90 days) and imports API logs in JSON/JSONL without administrative keys. Success means understanding usage, costs, and cache savings within seconds while seeing coverage gaps explicitly.

## Positioning

Local collection from the computer profile, without provider credentials or conversation content in dashboard outputs. Records without prices or counters are shown as gaps rather than zero usage.

## Operating Context

Runs on 127.0.0.1 using Next.js and can be installed as a macOS Homebrew service. Refreshes every minute while visible. Days are grouped in America/Sao_Paulo. Local tools and imported API requests are separate views to avoid possible double counting.

## Capabilities and Constraints

- Four automatic sources and deduplicated API log imports.
- Filters by service, project, and period; daily usage, period comparison, provider shares, and model/project rankings.
- USD/BRL costs, preserving reported amounts; editable model estimates and explicit uncovered records.
- Cache savings, BRL subscription fees, and monthly token goals.
- Overview, Activity, Data sources, and Preferences views. Filtered CSV export, Light/Dark/System themes, keyboard navigation, and responsive layouts.
- Interface languages: Portuguese (Brazil), English, Spanish, Italian, French, and Simplified Chinese. Portuguese is the default; the selected language is stored locally.
- Stack: Next.js App Router, React, Tailwind 4, shadcn components, next-themes, and lucide-react.
- Retain the 90-day limit and explicit missing-data states. Old Gemini logs without counters do not produce usage metrics.

## Brand Commitments

Keep the name `tokenusage`. Both light and dark themes are requirements. The approved visual direction (2026-10-07) is stock shadcn/ui with neutral tokens and subdued colors; experimental or vibrant directions were rejected. Source and documentation are written in English, with supported interface languages held in localization resources.

## Evidence on Hand

Synthetic captures in `docs/screenshots/` show light/dark overview, preferences/prices, and mobile. There are no customer claims or real metrics to publish; example figures must be labeled synthetic.

## Product Principles

- Every number explains its source and coverage.
- Privacy is the premise: normalized local metrics, without conversation content in the browser or cloud.
- A missing value is useful information and stays visibly missing.
- Usage, cost, and cache savings answer the daily question first.
- Give both themes the same care.

## Accessibility & Inclusion

Keyboard-accessible tabs and controls, readable themes, responsive layouts, and correctly labeled language selection.
