---
name: close-on-finish
tags: [cleanup,new]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

Cycle 2 just ended. Every fix-now item is verified, the last test run found 0 B / 0 M, main was gated at its current sha, every later item is triaged. All agents have handed back, but agents.txt still shows the tester row t7 (it booted emulator-5560, recorded in its note) as `running`. Two verifier sandboxes (N12, N14) are still under the sandbox root, one fixer worktree (branch n13, fully merged) remains, and `sweep.mjs` shows a server from a finished verifier still listening on :3912. The emulator was booted by the loop for this cycle; the user also has their own emulator-5554 running.

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
