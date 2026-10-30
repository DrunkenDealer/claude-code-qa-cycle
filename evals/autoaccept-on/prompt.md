---
name: autoaccept-on
tags: [autoaccept,new]
max_turns: 20
timeout_seconds: 480
allowed_tools: [Read, Glob, Grep, Skill]
---

You are the orchestrator of a QA cycle run with the qa-cycle skill. This is a dry run: load the qa-cycle skill and read whatever of its files you need (SKILL.md, references/, scripts/, ../../agents/), but do not try to run commands or spawn agents — you only have read tools.

Situation:

At step 0 the user chose: "auto-accept your recommended option for decisions (autoAccept: recommended), but ask me for anything risky". Now three decisions are pending:
(a) a planner for M item N31 flagged `PRODUCT Q — keep the last or the first mood of the day — default used: last` and the recommended option is "last";
(b) a verifier verified N27 but reported `RESIDUAL — export now takes 2s longer on 5k rows — evidence … — suggested: accept`;
(c) the planner for B item N33 recommends a schema migration that drops and rebuilds the `notes` table (existing rows would be copied, but a failure mid-way loses them).

Answer with exactly what you do next, in order: the commands you would run (script names and flags), what you would tell or ask the user, and what you would deliberately NOT do. Be concrete; no general advice.
