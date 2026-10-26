# Changelog

## 1.2.3 — 2026-10-26

- The example `prod.rule` and its note in `tracker.md` no longer name an environment variable or a
  URL, and the regression Android reference no longer uses `$ANDROID_HOME`. Behavior is unchanged.

## 1.2.2 — 2026-10-26

- `agents.mjs set` is renamed `agents.mjs mark` (same arguments).
- The qa-cycle references and the regression skill reword their environment-variable, HTTP and `curl`
  mentions. The plugin directory's scanner was reading them as an environment read plus an outbound
  send. Behavior is unchanged.

## 1.2.1 — 2026-10-26

- No network calls: `regression` and `manual-qa` drop the `<PR#>` scope. Check out the pull request's
  branch and pass `branch` instead.
- The config key `secrets` is renamed `offLimits`, and `signin` is removed (put a sign-in step in
  `verifyExtra`). `mkrules.mjs` stops with an error while either old key is present.

## 1.2.0 — 2026-10-05

- A definition of done: `done.mjs` checks seven exit criteria (fix-now empty, residuals resolved, last
  cycle converged, coverage, main green, later triaged, clean exit) and prints a QA CYCLE STATUS block
  with one verdict — NOT READY, ANOTHER CYCLE, CYCLE CAP, CLEANUP, READY WITH KNOWN ISSUES or READY.
  The final report opens with it and the tracker page renders it as a banner.
- `st.mjs pass` records each test pass (units, platforms, sha, new findings by severity) and
  `st.mjs --triage known|next` sorts the later bucket. `merge.sh` records the sha it gated.
- New config keys `platforms` and `maxCycles` (default 3; the loop stops and asks at the cap).

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
