# Test phase (steps 0–4)

## 0. Ask first

One `AskUserQuestion` round before anything runs: `autoAccept` (`off` | `recommended`, SKILL.md › Gates), the scope (the whole app, or an area or change — record a scoped session as `scope: {"ws": [...], "units": [...]}` in `qa.config.json`; SKILL.md non-negotiable 8), environments to never touch (prod URLs in shell variables, payment/AI providers), whether real third-party calls are allowed, devices/browsers in scope, what "done" means. Write the answers into the rule templates.

## 1. Feature map

One read-only `qa-mapper` agent (or you, for a small app) walks the code, not memory:
entry points (routes, CLI commands, screens) → features → sub-features → states (idle/loading/empty/error/busy) → cross-feature flows (auth → create → edit → export → share) → integrations (storage, payments, AI, email).

Output: a numbered tree where every leaf is testable on its own and names its files. Show it to the user with the plan.

## 2. Unit plan

Split the map into **units an agent can finish well in one run** — typically one feature leaf or one cross-flow, ~30–80 cases. 30 units of 50 cases beats 3 units of 500. For each unit:

```
U<n> <name>
  files:     <paths the unit exercises>
  surface:   UI | API | CLI | data
  cases:     happy path, edges, states, failure injection (lost/5xx/429 answers, reloads, two tabs), a11y/keyboard if UI
  bar:       /regression references/<platform>.md (+ project ui/ux skill if it exists)
  load:      small | medium | high
```

Order units so high-load ones run alone. Publish the plan as the first version of the tracker, with the units in `D.units` (`{"U1": {"name": "…", "files": ["paths"]}}`): `done.mjs` checks coverage against them, and a unit's `files` decide when a later commit makes its last run stale.

## 3. Tester brief (one `qa-tester` per unit, Sonnet)

Every brief carries the playbook's OK entries that touch the unit (orchestration.md › Playbook), marked as hints to verify.

- "Read and follow `<tooling>/VERIFYRULES.md`" — testers use the verifier rules (sandbox, ports, prod/off-limits, headless, load).
- Its unit only; its sandbox (`mkbox.sh <unit-id> <port>`: built from the commit of main, `SANDBOX_SHA` records which, test-only config file, own data dirs) and ports.
- Drive it the way a user would — real headless browser for UI, the real CLI against the local server — plus failure injection by intercepting requests.
- **Reproduce every finding twice** before reporting it; save the script that reproduces it.
- Findings go to `<scratch>/tester-<unit>/findings.md`: `FINDING title · severity (B/M/m) · reach (common/plausible/contrived) · where (file / function) · repro steps · script path · expected vs actual`, or a one-line `EDGE where · symptom · why contrived` with no repro (never for security or data loss). The report back carries counts and that path, not the findings. Then `cases run / passed`, and a `PLAYBOOK WRONG:` line for every hint that misled it or didn't hold, even if it worked around it. (Format is built into the agent.)

## 4. Triage into the list

You never read the raw findings — hundreds of lines would crowd out your judgement and cost the most expensive context in the loop. Triage is a script, then cheap agents, then a script:

1. **`node <tooling>/fingerprint.mjs`** (no tokens): parses every `tester-*/findings.md`, clusters by file, attaches the `dropped.md` entries for those files (OK ones to match repeats, STALE ones to re-judge), and packs whole clusters into batches of ≤ 80 findings under `<scratch>/triage/c<cycle>/`.
2. **One `qa-triager` per batch** (Sonnet, in parallel, read-only but for its answer file — light load). Brief: the batch path, the workstreams (`ws` keys and scopes) to pick from. It groups findings by **root cause — the one fix that closes them** — folds duplicates across units, drops what no real user reaches (never security or data loss), re-grades severity, and re-judges STALE drops.
3. **`node <tooling>/triage.mjs apply`**: validates every answer (each finding exactly once, each STALE drop handled; nothing is written otherwise), adds one tracker item per root cause with all its symptoms (`symptoms`), writes drops to `dropped.md`, and prints the counts and the `st.mjs run` line.

- A tracker item is a **root cause**: its planner sees every symptom (a sturdier invariant), one fixer closes them, and its verifier checks each one.
- Buckets come from severity and reach: B and a reachable M → **now**; `m` and a contrived M → **later** (`--now` only on the user's word); `later` reaches `now` only at the user's gate. Re-bucket by hand only what needs a product decision or design pass (`st.mjs - --bucket later`).
- Assign each fix-now item a **workstream** by file scope so fixers in parallel don't collide (see fix-verify.md); the triager fills it where it can.
- Record the run with the line `triage.mjs apply` printed: `st.mjs run <cycle> <units|all> <B/M/m new items> --triage <folded/dropped/promoted> --platforms <p,…>` (it stamps main's sha). Without it `done.mjs` can't tell a converged cycle from an untested one; the triage counts show which units' testers are noisy.
- **`dropped.md`** (`<tooling>/dropped.md`) is read by the triager only — never by you, a tester, or the user. Each entry is stamped like the playbook; a drop comes back on a repeat sighting from another path or unit, or when its files change and the triager judges it reachable. Its only cost after the first cycle is re-judging STALE entries.
- Return the list to the user — `<findings> findings → <items> items · <folded> folded · <dropped> dropped · <promoted> promoted`, counts by severity, then the items (root causes, not symptoms), plus every open question in the same gate packet (SKILL.md › Gates) — send a `PushNotification` if the tool exists, and **stop until they confirm** (with `autoAccept: recommended`, take and log the recommended option instead, except what SKILL.md always asks). Their answers on "later" items become notes on those items.
- While you wait, start read-only `qa-planner`s on the B/M items that need a plan (fix-verify.md › Plan first), so fixers can launch the moment the user says go. No fixer, merge or `--now` before the go-ahead.
