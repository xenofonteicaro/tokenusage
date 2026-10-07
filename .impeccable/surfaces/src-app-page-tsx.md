---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/overview.tsx", "src/components/dashboard.tsx"]
---

# Overview — light and dark redesign

Mode: Operate. Surface: the main tokenusage dashboard and its components. The user approved a mockup before the redesign, originally referenced as `mockups/visao-geral.tsx` and `mockups/png/`.

Audience/job: a developer tracking personal local usage; a quick daily check of tokens, USD/BRL costs, and cache savings. Constraints: missing data must not appear as zero; separate Tools and APIs; equally cared-for themes; responsive mobile layouts.

Chosen direction: the category canon — shadcn/ui, base-nova preset, neutral base color — selected after the user rejected the vibrant Brasília Tile direction. Reference: shadcn dashboard-01.

The implementation uses the approved stock components and tokens. The former custom-component-versus-token-only question was resolved by the redesign.

## Direction contract

THESIS: A disciplined stock shadcn dashboard: neutral, legible, and unadorned. No vibrant palette or separate visual world.
OWN-WORLD: Achromatic neutral oklch tokens, Geist, 0.625rem radius, stock Card/Badge/Progress/Table/Alert/ToggleGroup, primary-color area chart with a subtle gradient.
STORY: Show usage, cost with price coverage, savings, and cache utilization within seconds; identify coverage gaps explicitly.
FIRST VIEWPORT: Inset sidebar with navigation and tool totals; header with title, theme, Refresh, and Export CSV; Tools/APIs tabs and filters; four summary cards; daily area chart and 90/30/7-day periods.
FORM: Category canon chosen by the user; seed c49cb29d.
FINISH: Review and document the shipped result in DESIGN.md; keep synthetic raster provenance explicit.
