---
name: usage-limit
tags: [limits,new]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

A qa-verifier (agent id v41, item N22, sandbox sbx/N22, port 3920) stopped mid-run with the message "You've hit your session limit · resets 3pm". It had run 5 of its 9 scenarios. Its agents.txt row still says `running`. Two more verifiers and one long tester are queued. The session itself is still alive (no restart).

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
