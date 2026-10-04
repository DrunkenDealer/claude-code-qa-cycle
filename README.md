# qa-cycle

A Claude Code plugin for whole-app QA run by an orchestrator: map every feature, cut small test units, fan out
one tester agent per unit, return the findings as a list, then, after your go-ahead, fan out fixers in git
worktrees and fresh verifiers in sandboxes, cycle after cycle until every fix-now item is verified.

It ships the `qa-cycle` skill and five agents: `qa-mapper`, `qa-planner` (Opus), `qa-fixer`, `qa-tester`,
`qa-verifier` (Sonnet).

## Install

```
/plugin marketplace add DrunkenDealer/qa-cycle
/plugin install qa-cycle@qa-cycle
```

Requires `git` and Node.js (the tracker and merge tooling are plain `.mjs` scripts).

## Set up a project

The scripts live once, in the skill's `scripts/` folder. Give each project a tooling folder (gitignored, outside
the repo is fine) holding symlinks to them plus its own data:

```sh
cd <tooling> && for f in <skill>/scripts/*.mjs <skill>/scripts/*.sh; do ln -sf "$(realpath "$f")" "$(basename "$f")"; done
cp <skill>/scripts/qa.config.example.json qa.config.json   # then fill it in
node mkrules.mjs                                         # writes FIXRULES.md / VERIFYRULES.md
```

Add `.claude/worktrees/` to the project's `.gitignore`. Then ask Claude to "run a QA cycle" or `/qa-cycle`.

The skill's `references/` hold the full process: `orchestration.md` (roles, models, load budget, scheduling),
`test-phase.md`, `fix-verify.md` and `tracker.md` (the durable tracker and every script).
