---
name: tokenusage
description: Local AI usage dashboard using stock neutral shadcn/ui without ornament.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  sidebar: "oklch(0.985 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  dark-background: "oklch(0.145 0 0)"
  dark-foreground: "oklch(0.985 0 0)"
  dark-card: "oklch(0.205 0 0)"
  dark-primary: "oklch(0.922 0 0)"
  dark-primary-foreground: "oklch(0.205 0 0)"
  dark-muted: "oklch(0.269 0 0)"
  dark-muted-foreground: "oklch(0.708 0 0)"
  dark-border: "oklch(1 0 0 / 10%)"
  dark-input: "oklch(1 0 0 / 15%)"
  dark-destructive: "oklch(0.704 0.191 22.216)"
typography:
  metric:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.375
    fontFeature: "tnum"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  pill: "1.625rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  badge-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "20px"
    padding: "2px 8px"
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "20px"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
  native-select:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 32px 4px 10px"
---

# Design System: tokenusage

## Overview

**Creative North Star: "The Plain Ledger"**

tokenusage is stock shadcn/ui (style base-nova, base color neutral, lucide icons) executed with discipline. The user rejected the earlier green/graphite world and a bolder intermediate direction; the chosen world is the category canon, neutral and legible, with no visual identity of its own beyond honesty about the numbers. Every surface is achromatic: white and near-black in light, near-black and off-white in dark, with grey steps doing all the hierarchy work.

Density is that of a working dashboard: an inset sidebar shell, a 56px header, four summary cards, one daily area chart, then breakdown cards and tables. Ornament is absent. What carries meaning is typography weight, tabular numerals, outline badges that name the state of a number, and the em dash that stands in for data that does not exist.

Both light and dark themes are product requirements; every token has a pair and every component must read in both.

**Key Characteristics:**

- Neutral oklch tokens with zero chroma for every surface, text, border and chart color.
- Geist for all text, Geist Mono for paths, code and chart tooltip values; tabular numerals on every figure.
- Flat cards defined by a hairline ring, not shadows; one radius base (0.625rem).
- State language in outline badges ("No data", "no rate", "Partial", "Estimated").
- Missing data is shown as missing, never as zero.

## Colors

A fully achromatic palette; the only chroma in the system is the destructive red reserved for errors.

### Primary

- **Ink Black** (oklch(0.205 0 0); dark theme Paper Grey oklch(0.922 0 0)): primary buttons (Export CSV), the app mark tile, progress fills, the daily area chart stroke and fill, and text selection. In dark mode it inverts to a light grey with a near-black foreground.

### Neutral

- **White** (oklch(1 0 0)): light page and card background.
- **Near Black** (oklch(0.145 0 0)): light foreground; dark page background.
- **Graphite** (oklch(0.205 0 0)): dark card and sidebar surface.
- **Smoke** (oklch(0.97 0 0); dark oklch(0.269 0 0)): secondary, muted and accent fills: active nav item, tab list track, secondary badges, code blocks.
- **Mid Grey** (oklch(0.556 0 0); dark oklch(0.708 0 0)): muted foreground for descriptions, secondary lines in card footers, axis ticks, "no rate" cells.
- **Hairline** (oklch(0.922 0 0); dark oklch(1 0 0 / 10%)): borders, table rules, separators, input strokes (dark inputs at 15%), scrollbar thumb.
- **Ring Grey** (oklch(0.708 0 0); dark oklch(0.556 0 0)): focus rings at 50% opacity.
- **Off-white Sidebar** (oklch(0.985 0 0)): the light sidebar and inset frame behind the main panel.

### Semantic

- **Destructive Red** (oklch(0.577 0.245 27.325); dark oklch(0.704 0.191 22.216)): only for failure: the collection-error Alert and a source's error badge, always as a 10-20% tint with red text.

### Named Rules

**The Neutral Primary Rule.** There is no accent color beyond the neutral primary. Charts, progress bars, active states and calls to action all use the primary or a grey step; destructive red appears only when something failed.

**The Same Selection Rule.** Text selection uses the primary as background and primary-foreground as text in both themes; the scrollbar thumb uses the border color on a transparent track. Both are set globally, never per component.

## Typography

**Display Font:** none (no display face; headings use the body sans)
**Body Font:** Geist (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono (with ui-monospace)

**Character:** One quiet grotesque at three weights (400, 500, 600) and a matching mono. Hierarchy comes from size and weight, never from case, tracking or color.

### Hierarchy

- **Metric** (600, 1.5rem, tabular): the headline number of each summary card and the monthly goal figure.
- **Title** (500, 1rem): card titles and the page title in the header.
- **Body** (400, 0.875rem): card descriptions, footers, table cells, form text. Footer lines pair a 500-weight statement with a muted 400-weight detail.
- **Label** (500, 0.75rem): badges, sidebar group labels and menu badges, source metadata rows.
- **Mono** (400, 0.75rem): file paths, JSON examples, chart tooltip values.

### Named Rules

**The Tabular Figures Rule.** Every number that can change (tokens, currency, percentages, counts) is set with tabular numerals, and numeric table columns are right-aligned.

## Layout

An inset sidebar shell: the sidebar sits on the off-white frame and the main panel is inset by 8px with a 0.875rem radius on md and up; below md the sidebar becomes an off-canvas sheet opened from the header trigger. The header is 56px tall with a bottom border, holding the sidebar trigger, a vertical separator, the page title, and on the right the theme toggle, Refresh (outline) and Export CSV (primary); button labels collapse to icons below sm.

Content padding is 16px, 24px from md; vertical gaps follow the same 16px / 24px step. The filter row puts the Tools/APIs tabs on the left and three native selects on the right (a two-column grid on mobile with the period select spanning both). Summary cards run 1 column, 2 from sm (640px), 4 from xl (1280px). Breakpoint usage is Tailwind's default sm / md / lg / xl.

## Elevation & Depth

The system is flat. Cards are separated by a 1px ring at 10% foreground, not by shadow. The only shadow is the shadcn small shadow under the inset main panel on md and up, which lifts the work area off the sidebar frame. Depth otherwise comes from tonal steps: off-white sidebar, white panel, smoke fills for selected states (in dark: graphite cards on a near-black page).

### Shadow Vocabulary

- **Inset panel** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): the main content panel inside the inset sidebar layout only.

### Named Rules

**The Ring Not Shadow Rule.** Containers are outlined by a hairline ring; do not add shadows to cards, badges or inputs.

## Shapes

One radius base (0.625rem) scaled by the shadcn ratios: buttons, inputs and selects at 0.625rem, small buttons at up to 0.5rem, nav items at 0.375rem, cards and the inset panel at 0.875rem, badges fully pill-shaped. Status dots for tools are 8px circles, filled for connected and outlined for unavailable. Icons are lucide line icons at 16px (12-14px inside badges and small buttons).

## Components

### Buttons

- **Shape:** gently rounded (0.625rem), 32px tall, 28px in the header's small size.
- **Primary:** ink black fill with white text; hover drops to 80% opacity. Used once per view for the main action (Export CSV).
- **Outline:** background fill with a hairline border; hover fills with smoke. Used for secondary actions (Refresh, Configure).
- **Hover / Focus:** 3px focus ring in ring grey at 50%; active presses down 1px; disabled at 50% opacity.

### Badges (state language)

- **Outline:** hairline pill, foreground text, 0.75rem medium, optional 12px leading icon. This is the voice for the state of a number: "Partial" (with a warning triangle), "Estimated", "Estimated", "Actual", "Mixed", "No data", "no rate", trend percentages, and service names in tables.
- **Secondary:** smoke pill for confirmed or user-set states: a collecting source ("Collecting"), a user-edited rate ("Custom"), the cost provenance under activity rows ("Actual", "Estimated", "Mixed").
- **Destructive:** red tint, only for a source in error.

### Cards / Containers

- **Corner Style:** 0.875rem.
- **Background:** card token (white; graphite in dark).
- **Shadow Strategy:** none; see Elevation.
- **Border:** 1px ring at 10% foreground.
- **Internal Padding:** 16px. Summary cards use description, metric title and a CardAction badge in the top-right header slot, then a footer (muted fill) with a medium statement line and muted detail lines.

### Inputs / Fields

- **Style:** filters use the native select: 32px tall, 0.625rem radius, hairline input border, transparent fill (input at 30% in dark), chevron at the right.
- **Focus:** border shifts to ring grey plus a 3px ring at 50%.
- **Error / Disabled:** destructive border and ring at 20%; disabled is non-interactive.

### Navigation

- **Sidebar:** inset variant, off-canvas on mobile. A brand row (primary tile with chart icon, "tokenusage", muted subtitle), a group "Tracking" with lucide-iconed items, and a group "Tools" listing each tool with a status dot and a menu badge carrying its token total or "no data". Active item: smoke fill, medium weight. A footer note in a bordered box states the privacy premise.
- **Tabs:** ToggleGroup-style tab list for Tools / APIs on a smoke track; theme switch is an outline ToggleGroup of three icon buttons (light, dark, system).

### Daily Usage Chart

Area chart in the primary color: 1.5px monotone stroke, vertical gradient fill from 25% to 2% opacity, horizontal grid lines only, no axis lines, compact token labels on the Y axis, dot-indicator tooltip with mono tabular values. No animation. A selection with no records shows the Empty state instead of the chart; days without records inside the period plot at zero, because the collectors cannot tell an idle day from a missing one.

## Do's and Don'ts

### Do:

- **Do** use only the neutral tokens; reach for the primary (oklch(0.205 0 0) light, oklch(0.922 0 0) dark) for any emphasis, chart series or progress fill.
- **Do** show missing data as missing: an em dash in metric slots, an outline "No data" or "no rate" badge or muted text, and an explanation line in the card footer.
- **Do** label the quality of a number with an outline badge in the card's action slot ("Partial", "Estimated", "Actual").
- **Do** use the native select for filters (service, project, period).
- **Do** set every figure in tabular numerals and right-align numeric columns.
- **Do** keep shadcn primitives as generated (Card, Badge, Button, NativeSelect, Table, Alert, Progress, ToggleGroup, Sidebar, Empty) and compose them rather than restyling them.
- **Do** verify every surface in both light and dark themes.

### Don't:

- **Don't** introduce an accent hue, colored chart series, or colored status fills; red is for errors only.
- **Don't** render a missing value as 0, "0%" or "US$ 0,00"; use an em dash or a state badge.
- **Don't** add shadows to cards or use offset, glow or colored shadows.
- **Don't** add uppercase tracked labels or eyebrow text above titles; hierarchy is size and weight.
