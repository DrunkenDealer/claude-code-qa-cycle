---
name: scope-new-finding
tags: [scope,new]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

The session is scoped by the user to the notifications area (workstream W3). A qa-tester running unit U9 (notification settings) reports: `FINDING Looks picker crashes when a look is deleted · M · features/looks/LookPicker.kt · …` — the bug is real but lives in the Looks area (workstream W5), which is outside the scope. It also reports one in-scope finding: `FINDING reminder time resets after rotation · M · features/settings/ReminderRow.kt · …`.

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
