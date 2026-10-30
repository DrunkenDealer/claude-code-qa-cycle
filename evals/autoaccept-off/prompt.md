---
name: autoaccept-off
tags: [autoaccept,regression]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

The user gave no standing instruction about decisions (nothing at step 0 beyond scope = whole app). The findings list is ready: 3 M and 5 m. Your recommendation is to fix the 3 M now and pull in 2 of the minors (m4, m7) because they share a file with an M fix.

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
