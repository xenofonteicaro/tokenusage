# Tokenusage

A local dashboard for token usage from **Codex, Claude Code, Grok Build, and
Gemini CLI**, using histories saved on your computer. You can also import API
usage logs from your projects without administrative API keys.

## Run locally

Requires Node.js 24 or later.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. The first collection reads local history;
subsequent collections reuse cached files that have not changed. The dashboard
refreshes every minute while its tab is visible. The npm scripts bind to
`127.0.0.1`.

To run the production build:

```sh
npm run build
npm start
```

## Install with Homebrew

Requires macOS and [Homebrew](https://brew.sh). The formula installs Node.js as
a dependency, builds the production app from the release archive, registers a
macOS service, and reads usage counters from the local profile. Code, formula,
and releases live in this repository. Use the explicit URL because the
repository name does not start with `homebrew-`:

```sh
brew tap --custom-remote xenofonteicaro/tokenusage https://github.com/xenofonteicaro/tokenusage.git
brew install xenofonteicaro/tokenusage/tokenusage
tokenusage start
```

The first install compiles the app, so it takes a few minutes.
`tokenusage start` starts the service and opens **http://127.0.0.1:3000** in your
browser. Use `tokenusage stop`, `tokenusage restart`, `tokenusage open`, or
`tokenusage logs` to manage it, or `tokenusage tui` for the terminal version
(see [Terminal UI](#terminal-ui-tui)). The service starts again when you log in to macOS.
Preferences, prices, imports, and the collector cache are stored in
`~/Library/Application Support/tokenusage`. Tool histories stay in their
original directories.

### Upgrade

```sh
brew update
brew upgrade tokenusage
tokenusage restart
```

The restart makes the running service use the new version. Your preferences,
prices, and imports are kept.

The tap command also migrates installations that used the archived
`homebrew-tokenusage` repository. After migration, `brew update` and
`brew upgrade tokenusage` use this repository.

### Uninstall

```sh
tokenusage stop
brew uninstall tokenusage
brew untap xenofonteicaro/tokenusage
```

Uninstalling does not delete `~/Library/Application Support/tokenusage`. Remove
that directory too if you want to erase preferences, prices, and imports. Tool
histories are never touched.

### Release archive

The release archive contains only the source and configuration needed to build
the app. It excludes Git history, internal documentation, screenshots, tests,
profile data, and prebuilt output. Generate a reproducible package from a Git
revision with:

```sh
python3 scripts/package-homebrew.py --ref HEAD --out /tmp/tokenusage.tar.gz
```

The script uses an explicit source allowlist and normalizes archive ownership
and timestamps. The formula pins the archive's SHA-256 checksum.

## Terminal UI (TUI)

Besides the web dashboard, a terminal version shows the same numbers: an
overview, a searchable activity list, and source diagnostics. It reads the local
history directly, so it needs neither the web service nor port 3000.

```sh
npm run tui                          # from the repository
tokenusage tui                       # installed with Homebrew
tokenusage tui --days 7 --channel api
tokenusage tui --once                # print the overview once and exit
```

It needs a terminal of at least 80×24. `--days` (7, 30, or 90) and `--channel`
(`tool` or `api`) set the initial filters; `--lang` sets the interface language
(`pt-BR` or `en`).

| Key                   | Action                                                         |
| --------------------- | -------------------------------------------------------------- |
| `1` `2` `3` or `Tab`  | Overview, Activity, and Sources                                |
| `c` `d` `s` `p`       | Channel, period, service, and project                          |
| `/` and `g`           | Search and grouping in Activity (session, model, project, day) |
| `↑` `↓` `PgUp` `PgDn` | Scroll lists                                                   |
| `r`                   | Refresh now (automatic every 60 s)                             |
| `?` and `q`           | Help and quit                                                  |

This first phase is read-only: preferences, prices, log import, and CSV export
stay in the web dashboard. Colors follow `NO_COLOR`. `npm run build:tui` builds
the single bundle `dist/tui.mjs`, which the Homebrew formula installs for the
`tokenusage tui` subcommand.

The TUI speaks Portuguese (Brazil) and English. Without `--lang` it follows the
language saved under **Preferences → General → Interface language**. Spanish,
Italian, French, and Chinese show the English text in the TUI, never a mix of
languages on one screen.

## Interface languages

Under **Preferences → General → Interface language**, choose Portuguese
(Brazil), English, Spanish, Italian, French, or Simplified Chinese, then save.
The menu shows each language's native name. The choice is stored locally and
changes interface text, numbers, and dates. Currency, the São Paulo time zone,
and usage grouping keep their existing meaning.

Project source, comments, documentation, and release/PR text are written in
English. Localization resources and explicit localization test expectations
contain the supported languages.

## Features

| Feature                     | What you can track                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Four tools**              | Local histories with available token counters from Codex, Claude Code, Grok Build, and Gemini CLI.                                 |
| **Tools and APIs**          | Separate views for local sessions and imported JSON/JSONL API logs, with deduplication.                                            |
| **Filters and charts**      | Input, output, and cached tokens by service, model, project, and period; daily usage and previous-period comparisons.              |
| **USD and BRL costs**       | Preserved reported costs, model-based estimates, and explicit coverage for records without prices.                                 |
| **Cache savings**           | Estimated savings in USD/BRL, cache utilization, and savings relative to the modeled cost without cache.                           |
| **Editable prices**         | Input, output, and cache-read rates; custom models, default restoration, and override removal.                                     |
| **Local preferences**       | Language, USD/BRL exchange rate, subscription fees, and monthly token goal.                                                        |
| **Activity and export**     | Search by project/model and filtered CSV export, grouped by session, model, project, and day.                                      |
| **Themes and mobile**       | Light, Dark, and System themes; responsive layouts and keyboard navigation.                                                        |
| **Diagnostics and privacy** | Source status, incomplete-record warnings, and local execution without administrative keys or conversation content in the browser. |

## Screenshots

These captures use **synthetic test data**. Project names, counters, costs, and
preferences are examples, not personal usage. Prices are editable historical
references. Screenshots may show the Portuguese interface.

### Overview — light theme

Tokens, cache, reported/estimated costs, charts, and filters in one view.

![Light dashboard with synthetic usage and costs](docs/screenshots/dashboard-light.png)

<details>
<summary>Overview — dark theme</summary>

![Dark dashboard with the same synthetic data](docs/screenshots/dashboard-dark.png)

</details>

<details>
<summary>Preferences and prices</summary>

Editable prices per million tokens for each model.

![Model prices in the dark theme](docs/screenshots/pricing.png)

</details>

<details>
<summary>Mobile interface</summary>

Compact navigation and horizontally scrollable tables within their panels.

<img src="docs/screenshots/mobile.png" alt="Preferences and prices on a mobile screen" width="390" />

</details>

## Sources and formats

### Automatic sources

| Service     | Source                                             | Normalization                                                                                                                  |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Codex       | `~/.codex/sessions` and `archived_sessions`        | Cumulative counter deltas; repeated snapshots and copied histories are deduplicated.                                           |
| Claude Code | `~/.claude/projects/**/*.jsonl`                    | Assistant usage; deduplicated message IDs for streaming; cache included in input.                                              |
| Grok Build  | `~/.grok/sessions/*/*/usage.json`                  | Usage by turn/model; cache included in input; known children already counted by their parent are excluded; USD = ticks / 10¹⁰. |
| Gemini CLI  | `~/.gemini/tmp/*/chats/session-*.json` or `.jsonl` | Recorded session counters; thoughts included in output; old message-only logs produce no usage metrics.                        |

Collectors respect `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, and `GROK_HOME`.
`GEMINI_HOME` is this collector's override for the default Gemini directory.
`TOKENUSAGE_PROFILE_DIR` replaces the profile root, primarily for isolated tests.

**Limits:** collection covers retained local sessions with counters, up to 90
days. Website/app usage, other computers, deleted histories, and API requests
without local logs cannot be recovered from this profile. Old Gemini logs
without counters do not provide exact usage.

Tools and APIs are separate views because API-authenticated CLIs may appear in
both. Adding the views could count the same request twice. Model/project labels
come from available metadata; an unidentified model is shown explicitly.

### API logs

Under **Data sources → Import JSON or JSONL**, upload an object, array of
objects, or one object per line. Limits: 4 MiB and 10,000 records per file.

```json
{
  "provider": "grok",
  "id": "ACTUAL_REQUEST_ID",
  "timestamp": "2026-10-07T12:00:00Z",
  "model": "ACTUAL_MODEL",
  "project": "my-project",
  "usage": {
    "prompt_tokens": 1200,
    "completion_tokens": 300,
    "prompt_tokens_details": { "cached_tokens": 800 }
  }
}
```

This is a format example; it does not add demo data to the product. `provider`
accepts `codex`, `claude`, `grok`, and `gemini`. The Codex label also groups general
OpenAI API requests; the model remains identified.

`usage` supports Responses/Chat Completions counters from OpenAI/xAI and Messages
counters from Anthropic. For Gemini, use `usageMetadata` with
`promptTokenCount`, `candidatesTokenCount`, `cachedContentTokenCount`, and
`thoughtsTokenCount`.

Optional `costUSD` means **reported by the imported file**, without provider
verification. Include the real request ID: importing that ID again updates its
record. Without an ID, identical records receive the same identifier and are
deduplicated within and across imports.

### Prices and estimates

Under **Preferences → Price table**, edit input, output, and cache-read rates in
USD per million tokens. Add a custom name for a model without a price. Restoring
a default removes its override; removing a custom model makes its events
uncovered again. Save to update overview/activity costs immediately. The
exchange rate is under General.

Built-in prices are historical text-model presets from the Phase 1 design, with
no automatic updates. Check applicable provider rates:
[Anthropic](https://platform.claude.com/docs/en/about-claude/pricing),
[OpenAI](https://developers.openai.com/api/docs/pricing),
[xAI](https://docs.x.ai/developers/pricing), and
[Google](https://ai.google.dev/gemini-api/docs/pricing).

Models without prices stay unestimated; they do not inherit another model's
rate. Reported costs are preserved, including sessions mixing reported and
unreported costs. Coverage distinguishes reported, estimated, and uncovered
records.

Cache savings estimate `cached tokens × (input rate − cache-read rate) / 1,000,000`.
The percentage compares modeled cost with the scenario without cache. It does
not reproduce long-context, batch, cache-write, storage, image, tool, tax, or
discount pricing. Subscription fees remain separate. These figures do not
replace an invoice. Missing/invalid stored exchange rates fall back to 5.75;
invalid API updates are rejected.

## Privacy and storage

Conversation content, cookies, and authentication files are not usage outputs.
JSONL is streamed; selected Grok/Gemini JSON documents are parsed as whole files.
Only normalized metrics and metadata are persisted and sent to the browser.

With npm, local files default to `.local-data/`, ignored by Git and excluded from
build artifacts. `TOKENUSAGE_DATA_DIR` overrides that location. New directories
request `0700` permissions and new files `0600`; existing directory permissions
are not changed. Writes use atomic replacement. Import/settings mutations are
serialized within the process; collector scans have a separate concurrency
gate. The app does not modify tool histories.

Endpoints check Host/Origin and reject external website requests. The supported
npm scripts and Homebrew service bind to loopback. Direct standalone invocation
or operator overrides can change binding. This is a single-user local app;
cloud deployment requires separate collection, authentication, and storage.
A hosted server cannot directly read your Mac's profile.

## Validate

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests use `.test-profile`, `.test-data`, and port 3101 without modifying
the real profile. Validation captures go to Git-ignored `artifacts/`.
Selected synthetic README captures are versioned in `docs/screenshots/`.

Production dependencies had no reported vulnerabilities in the release
validation (`npm audit --omit=dev`). The complete audit flagged the development
`braces` dependency chain used by lint/CLI tools. No patched `braces` version was
available at that check; no forced downgrade was applied.

## Format references

- [Gemini CLI — sessions and storage](https://geminicli.com/docs/cli/session-management/)
- [Gemini CLI — recording types](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/services/chatRecordingTypes.ts)
- [Claude Code — usage metrics](https://code.claude.com/docs/en/monitoring-usage)
- [Grok Build — execution and usage](https://docs.x.ai/build/cli/headless-scripting)

Delivery design and limits:
[Tokenusage design](docs/superpowers/specs/2026-10-07-tokenusage-design.md).
