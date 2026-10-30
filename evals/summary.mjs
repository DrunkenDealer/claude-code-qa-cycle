#!/usr/bin/env node
// node evals/summary.mjs <result.json> <scripts-spec.txt> <version> — writes evals/history/<version>.json: the compact record
// kept for comparing versions (per-case runs and judge votes from `claude plugin eval --json`, per-test pass/fail from
// `node --test --test-reporter=spec tests/scripts.test.mjs`). Full transcripts and reports stay out of git.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const [resultPath, specPath, version] = process.argv.slice(2);
const r = JSON.parse(readFileSync(resultPath, "utf8"));
// The spec reporter repeats failures in a closing summary, so the first line per test wins.
const tests = [...new Map([...readFileSync(specPath, "utf8").matchAll(/^([✔✖]) (.+?) \(\d/gm)].reverse().map(([, s, name]) => [name, { name, pass: s === "✔" }])).values()].reverse();
const out = {
  version,
  commit: execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim(),
  at: r.startedAt,
  claude: r.claudeVersion,
  costUsd: Number(r.costUsd.toFixed(2)),
  scripts: { passed: tests.filter((t) => t.pass).length, total: tests.length, tests },
  evals: {
    ...r.aggregates,
    cases: r.cases.map((c) => ({
      name: c.name,
      runs: c.arms.with.map((x) => ({ passed: x.passed, error: x.error, turns: x.turns, votes: x.graders.map((g) => g.judgeVotes) })),
    })),
  },
};
const dest = join(dirname(fileURLToPath(import.meta.url)), "history", `${version}.json`);
writeFileSync(dest, JSON.stringify(out, null, 1) + "\n");
console.log(`${dest}: scripts ${out.scripts.passed}/${out.scripts.total}, evals ${r.aggregates.casesPassed}/${r.aggregates.casesTotal}`);
