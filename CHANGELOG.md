# Changelog

## 1.2.3 — 2026-10-26

- The example `prod.rule` and its note in `tracker.md` no longer name an environment variable or a
  URL, and the regression Android reference no longer uses `$ANDROID_HOME`.
- `done.mjs` and `st.mjs pass` reword their pass-count output, and the changelog stops naming network
  tools.
- Locks store their owner's random id in a `nonce` file. A lock left by an older version is taken over
  once its owner is gone or it goes stale, as before.
- `mkrules.mjs` no longer checks for the config keys removed in 1.2.1.

## 1.2.2 — 2026-10-26

- `agents.mjs set` is renamed `agents.mjs mark` (same arguments).
- The qa-cycle references and the regression skill reword phrasing the plugin directory's scanner
  misread. Behavior is unchanged.

## 1.2.1 — 2026-10-26

- No network calls: `regression` and `manual-qa` drop the `<PR#>` scope. Check out the pull request's
  branch and pass `branch` instead.
- Files agents must never open are listed under the new `offLimits` key, and a setup step for
  verifiers goes in `verifyExtra`. Two older keys are removed; `mkrules.mjs` stops with an error while
  either is present.

## 1.2.0 — 2026-10-05

- A definition of done: `done.mjs` checks seven exit criteria (fix-now empty, residuals resolved, last
  cycle converged, coverage, main green, later triaged, clean exit) and prints a QA CYCLE STATUS block
  with one verdict — NOT READY, ANOTHER CYCLE, CYCLE CAP, CLEANUP, READY WITH KNOWN ISSUES or READY.
  The final report opens with it and the tracker page renders it as a banner.
- `st.mjs pass` records each test pass (units, platforms, sha, new findings by severity) and
  `st.mjs --triage known|next` sorts the later bucket. `merge.sh` records the sha it gated.
- New config keys `platforms` and `maxCycles` (default 3; the loop stops and asks at the cap).

## 1.1.2 — 2026-10-04

- `regression` and `manual-qa` read a pull request's diff with git, so the GitHub CLI is no longer
  needed.

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
