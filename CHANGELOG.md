# Changelog

## 1.2.5 — 2026-10-30

- A scoped session: `scope: {"ws": [...], "units": [...]}` in `qa.config.json`. `add.mjs` parks a
  finding outside it in `later` tagged `scope: "out"` (`--now` pulls it in on the user's word), and
  `done.mjs` judges only the scope and lists the rest as out of scope.
- New `close.mjs` (dry run, then `--yes`) frees what the loop left: sandboxes, listeners in the
  loop's ports, devices recorded as `device:<id>`, merged worktrees. `done.mjs` criterion 7 now also
  fails on those listeners and devices.
- `autoAccept: "recommended"` lets the orchestrator take recommended gate options; `st.mjs auto` logs
  each and `done.mjs` reports them. Destructive, prod, scope and residual decisions are still asked.
- Gates go out as one batched packet with a push notification, and planners run while the gate waits.
- New `playbook.mjs` checks the how-to playbook: entries stamped `@sha files:` turn `STALE` when those
  files change; agents propose entries with `NOTE:` lines.
- Testers and verifiers checkpoint to `progress.md`; a usage-limit stop is `stopped`, not failed, and
  resumes from the checkpoint.
- An eval set (`evals/`) and script tests (`tests/`), with results kept in `evals/history/`.

## 1.2.4 — 2026-10-26

- The `st.mjs` subcommand that records a test run is now `st.mjs run` (same arguments), and the
  tracker keeps those records under `runs`. Records written by 1.2.3 or earlier are not read: record a
  fresh run for each unit, or rename that key in the tracker to `runs`, before `done.mjs` counts
  convergence and coverage again.

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
