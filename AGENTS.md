## Working preferences

- After completing a feature or fix, commit the related changes, push the branch, and open a pull request automatically. Opening a PR does not authorize merging it.
- Write code identifiers, comments, documentation, README files, release notes, and PR text in English. Keep non-English text in localization resources and explicit localization test expectations only.
- Never commit real histories, personal metrics, credentials, or `.local-data` files.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


<claude-mem-context>
# Memory Context

# [tokenusage/tokenusage-tui] recent context, 2026-10-07 3:22pm GMT-3

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 37 obs (14,770t read) | 263,224t work | 94% savings

### Oct 7, 2026
S4678 Brainstorm creating a TUI (Terminal User Interface) version of the tokenusage token-tracking dashboard (Oct 7 at 2:25 PM)
S4679 Brainstorm creating a TUI (Terminal User Interface) version of tokenusage token-tracking dashboard with architecture approach discussion (Oct 7 at 2:25 PM)
S4680 Design TUI Phase 1: screens (overview/activity/sources), keyboard navigation, filters, and proposed refactor to extract metrics calculations to shared lib (Oct 7 at 2:28 PM)
19888 2:38p 🟣 Phase 1 TUI implementation complete with three read-only screens
19889 " 🔄 Shared library extraction for data collection and metric calculation
19890 " 🟣 Standalone esbuild bundle with Homebrew formula integration
19891 " 🟣 Comprehensive test suite with 76 passing tests covering TUI and shared libraries
19887 2:56p ✅ PR #5: English-source localization refactor with backward-compatible persisted data
19892 2:59p 🔵 Token usage TUI renders and passes interactive tests
19893 " 🔵 Linter finds 15 errors and 940 warnings in codebase
19895 " ✅ Added dist/** to ESLint globalIgnores to fix post-build lint failures
19896 3:02p ✅ Added regression test for long pasted search destroying Activity header
19894 " 🔵 Whole-branch TUI review: 76 tests pass, 5 issues identified
19897 3:03p ✅ Attempted search box width fix; test assertion pattern mismatch
19898 " ✅ Restructured search box to keep "Busca:" label visible while truncating input
19899 " 🔵 Search box width constraint not limiting rendered output to 80 columns
19900 3:04p ✅ Fixed long search overflow by pre-truncating search string instead of using layout constraints
19901 " ✅ Regenerated Homebrew tarball with TUI files and updated formula sha256
19902 " ⚖️ Branch ready to merge: all critical issues resolved, minor items deferred
19903 " ✅ Fixes committed and branch pushed to origin
19904 3:05p ✅ Pull request created and work session concluded
19905 3:06p 🔵 Branch has merge conflicts with main; cannot merge as-is
19906 " 🔵 Merge conflicts reveal main's Homebrew architecture changed from local to release-based
19907 " 🔵 Main uses sophisticated Homebrew packaging script; TUI used manual approach
19908 " 🔵 Package conflicts are mostly additive; usage route refactoring is compatible with main
19909 3:07p ✅ Resolved package.json and tarball conflicts; Formula and README remain
19910 " 🔵 Overview component conflict: TUI extracted logic vs main refactored UI with i18n
19911 " ✅ Accepted main's Overview component; all major merge conflicts resolved
19912 " ✅ Extended overviewMetrics tests to match main's Overview component logic; tests now RED
19913 " 🔵 Captured main's Overview computation block (lines 74-142) for extraction into overviewMetrics
19914 " ✅ Extracted main's Overview computation into overviewMetrics function; all tests now pass
19915 " 🔵 TUI's overviewMetrics returns savingsPercentage; main's version uses savingsShare
19916 " ✅ Added TUI tests for partial/unknown cache savings; started updating cards() function signature
19917 3:08p ✅ New TUI tests for cache-savings edge cases now RED (failing); awaiting implementation
19918 " ✅ TUI Overview cards now use overviewMetrics and handle partial/unknown cache savings; tests GREEN
19919 " ✅ Added scripts/build-tui.mjs to Homebrew source tarball allowlist
19920 3:09p ✅ Full integration verified: all quality checks pass after TUI-main merge
19922 " ✅ TUI-main merge committed and pushed; PR #6 merge state re-evaluating
19923 " ✅ PR #6 confirmed CLEAN and MERGEABLE; description updated with merge details
19924 " ✅ Added RED tests for TUI English language support (i18n)

Access 263k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>