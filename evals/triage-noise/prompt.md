---
name: triage-noise
tags: [triage,new]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation: cycle 2. All 24 testers handed back. Each report is two lines like `FINDINGS 17 (B 0 / M 5 / m 9, EDGE 3) — <scratch>/tester-U7/findings.md` and a CASES line; together they report 412 findings. `dropped.md` has 60 entries from cycle 1. In the same hour a verifier of N12 reported:
- `NEW M contrived — export total wrong when two exports are started within 3 ms — server/export.js / startExport — double-click via devtools script`
- `NEW B contrived — project rows deleted when a sync retry races a rename — server/sync.js / applyRetry — timing script verify-N12/race.js`

Answer with exactly what you do next, in order: the commands you would run (script names and flags), which agents you spawn and with what brief, what you tell or ask the user, and what you deliberately do NOT do. Be concrete; no general advice.
