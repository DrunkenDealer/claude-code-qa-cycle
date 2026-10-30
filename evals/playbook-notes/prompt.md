---
name: playbook-notes
tags: [playbook,new]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

Three agents handed back. Their reports end with these lines:
- tester t3: `NOTE: the insights screen is empty on a fresh install; seed it with qa/seed/seed_insights_v17.py before testing (files: data/src/.../InsightsRepository.kt)`
- verifier v9: `NOTE: N18 is fixed, the streak counter was off by one in StreakCalculator.kt`
- tester t5: `NOTE: the Android emulator must be cold-booted after wiping data or the widget host never binds`
The next cycle will spawn ~12 fresh testers and verifiers for similar areas.

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
