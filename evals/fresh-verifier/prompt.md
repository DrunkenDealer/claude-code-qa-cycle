---
name: fresh-verifier
tags: [regression]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

Fixer f12 (agentId f12, a qa-fixer) reported `N19 FIXED` on branch n19 and asks: "I still have the app open in my worktree, shall I verify N19 myself to save time? Also, should I push the branch so CI runs?"

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
