# General — regression checklist

For everything that isn't an Android, iOS, or web UI: backend/API, CLI, library or SDK, build logic
and Gradle plugins, scripts, data pipelines, config. There is no platform HIG here, so the bar is
**the behavior that already exists** — the contract callers depend on today must still hold.

## Step 1 — Map what already exists (do this before judging anything)

Never audit the diff in isolation. Reconstruct the surface it sits in:

| Look at | With | Answers |
|---|---|---|
| Public surface | `Grep` for the changed symbols | Who calls this, and what do they assume? |
| Existing tests | `Glob` `**/*Test*`, `**/test/**`, `**/*_test.*` | What was already pinned down, and is it still pinned? |
| Neighbouring code | Read the sibling files | What's the project's convention for this kind of thing? |
| Contracts | API schema, DB schema/migrations, CLI flags, config keys, serialized formats, env vars | Did the shape change under an existing consumer? |
| Docs & runbook | README, CHANGELOG, module docs, `--help` text | Is documented behavior now a lie? |

A change that contradicts an existing convention, test, or documented contract is a finding — cite
both sides (`file:line` of the change, `file:line` of what it breaks).

## Step 2 — Automated regression

Run what the project already has. Running tests is read-only for the source tree; nothing is edited.

1. Find the runner: `gradlew`/`build.gradle.kts`, `package.json` scripts, `Makefile`, `pytest.ini`,
   `cargo`, CI workflow. Use the project's own command — don't invent one.
2. Build, then run the **whole** suite, not just the new tests. A green new test with a red old one
   is the regression.
3. Lint/format/typecheck if configured (`detekt`, `ktlint`, `eslint`, `mypy`, `tsc --noEmit`).
4. Map each changed behavior to the test that covers it. **Uncovered changed behavior is a finding** —
   name the path and the test that should exist.
5. Report failures verbatim with the failing test name. Never summarize a suite as "passing" if you
   didn't run it — say you didn't.

If there is no runner or the build can't complete here, say so explicitly and fall through to step 3.

## Step 3 — Manual regression (do it whenever the thing can actually be run)

Exercise it like a user of that surface, not like a reader of the diff:

- **CLI / script** — run it: happy path, `--help`, a bad flag, missing arg, empty input, huge input,
  a path with spaces, and once more on the *same* input (is it idempotent?). Check the exit code, not
  just stdout.
- **Server / API** — start it locally and hit the touched endpoints with `curl`: valid request,
  missing field, wrong type, unauthenticated, expired token, and the pagination edge. Check status
  codes, error body shape, and that untouched endpoints still answer.
- **Library / SDK** — call the changed function from a scratch file or REPL with boundary inputs;
  then call it the way the *existing* call sites do.
- **Build logic / plugin** — clean build, incremental build, and a second build with no changes
  (does it stay up to date?). Check the produced artifact, not just the exit status.
- **Data / migration** — run it on a copy of realistic input, then re-run it (double-apply safe?),
  and verify the rollback or the old-format read path.

Rules for this step: **read-only and local only** — never against production, never a destructive or
irreversible command, and no edits to the source tree. Use a scratch copy of any data. If comparing
against the previous behavior helps, run the old revision in a separate worktree rather than mutating
the working tree.

If it genuinely can't be run here (needs a device, a secret, a cloud resource), write the exact
commands or steps a human should run, with the expected result for each — one line apiece.

## Pitfalls (phase 1B)

- **Contract drift** — a field made non-optional, a default changed, an enum value added, an error
  now thrown instead of returned. Old clients and old persisted data still exist.
- **Backward compatibility** — persisted/serialized data, cached responses, and stored config written
  by the previous version must still parse. A schema bump needs a migration *and* a read path for the
  old shape.
- **Idempotency & retries** — the operation runs twice (retry, at-least-once queue, double request).
  Does the second run corrupt anything?
- **Concurrency** — shared mutable state, non-atomic read-modify-write, a lock held across I/O, a
  race between two requests touching the same row.
- **Failure paths** — timeout, partial failure, downstream 500, disk full, cancelled mid-write. Is
  the system left in a valid state, and is the error distinguishable from success?
- **Resource lifecycle** — connections, file handles, threads, and temp files closed on the error path
  too, not just the happy one.
- **Boundaries** — empty, one, many, null/absent, unicode, very large, negative, zero, clock skew,
  timezone/DST.
- **Config & environment** — a new env var or config key with no default and no failure message; a
  secret read at import time; behavior that differs between local and CI.
- **Observability** — the new failure mode is loggable and diagnosable; no secret in a log line.

## Report

Same shape as every other platform, plus one line stating what was actually executed:

```
Tests: ./gradlew :server:test — 214 passed, 1 failed (SyncEndpointTest.retryIsIdempotent)
Manual: curl POST /notes ×2 (dup created), GET /notes?cursor=<expired> (500)
```

No line means it wasn't run — and not running it needs a reason in the report.
