# Changelog

## 1.1.2 — 2026-10-04

- `regression` and `manual-qa` read a pull request's diff with `git fetch origin pull/<N>/head`
  instead of `gh pr diff`, so the GitHub CLI is no longer needed.

## 1.1.1 — 2026-10-04

- Skills pre-approve only read-only tools, `Agent`, `AskUserQuestion` and `SendMessage`. Shell commands,
  file writes and other skills now go through your normal permission prompts.
- Adds a plugin icon. Drops the `documentationUrl` and `supportUrl` fields (the plugin directory doesn't
  recognize them; `homepage` and `repository` cover both).
- The example config serves with `npm start` instead of reading a `.env` file.

## 1.1.0 — 2026-10-04

- Bundles the `regression` and `manual-qa` skills. Testers audit against their platform checklists
  (Android, iOS, web, non-UI), so the plugin now works on its own.
- Adds plugin metadata (homepage, repository, license, keywords), an MIT license and a full README.

## 1.0.0 — 2026-10-04

- First public release: the `qa-cycle` skill, the `qa-mapper`, `qa-planner`, `qa-fixer`, `qa-tester` and
  `qa-verifier` agents, and the tracker, sandbox, merge and cleanup scripts.
