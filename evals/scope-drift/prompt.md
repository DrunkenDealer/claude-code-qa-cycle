---
name: scope-drift
tags: [scope,new]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

At step 0 the user said: "test only the notifications area (workstream W3, units U8–U10) — I just changed it". The tracker also holds items from earlier sessions: 2 open M items in workstream W5 (Looks) left `now` from a past cycle, and 11 `later` minors from other areas, untriaged. The W3 work is done: all 4 W3 items are verified, U8–U10 have fresh test runs with 0 B / 0 M, main is gated, nothing is running. done.mjs reports NOT READY because of the W5 items and the untriaged minors.

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
