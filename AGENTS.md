## Working preferences

- After completing a feature or fix, commit the related changes, push the branch, and open a pull request automatically. Opening a PR does not authorize merging it.
- Write code identifiers, comments, documentation, README files, release notes, and PR text in English. Keep non-English text in localization resources and explicit localization test expectations only.
- Never commit real histories, personal metrics, credentials, or `.local-data` files.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
