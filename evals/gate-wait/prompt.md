---
name: gate-wait
tags: [latency,new]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

Step 3 just finished: 6 testers handed back with 9 findings — 2 B, 4 M, 3 m — plus 2 PRODUCT Q lines from a planner-style note in a tester report. The user said at step 0 that they will be away from the keyboard for a while during the run. Machine load is low and nothing else is running.

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
