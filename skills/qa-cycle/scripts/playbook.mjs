#!/usr/bin/env node
// playbook.mjs [file] — checks the how-to playbook (default <tooling>/playbook.md) that tester and verifier briefs carry.
// Each entry is a `- ` line ending in `@<sha> files: a, b`: OK while no commit after <sha> touches those files, STALE once
// one does (re-check the step, then re-stamp or drop it), UNSTAMPED without a stamp. Exits 1 on any STALE or UNSTAMPED
// entry, or past the line cap, so the orchestrator fixes the playbook before it goes into the next brief.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config, git, die } from "./lib.mjs";

const CAP = 150;
const cfg = config(), file = process.argv[2] ?? join(cfg.tooling, "playbook.md");
if (!existsSync(file)) die(`no playbook at ${file}`);
const lines = readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
let bad = 0;
for (const l of lines.filter((l) => l.startsWith("- "))) {
  const m = l.match(/@([0-9a-f]{7,40})\s+files:\s*(.+)$/);
  let tag = "UNSTAMPED";
  if (m) {
    const files = m[2].split(/[,\s]+/).filter(Boolean);
    const known = git(cfg.repo, "rev-parse", "--verify", "--quiet", m[1] + "^{commit}").ok;
    tag = !known ? "STALE (unknown sha)" : git(cfg.repo, "rev-list", "--count", `${m[1]}..${cfg.main}`, "--", ...files).out !== "0" ? "STALE" : "OK";
  }
  if (tag !== "OK") bad++;
  console.log(`${tag.padEnd(9)} ${l.slice(2, m?.index).trim()}`);
}
if (lines.length > CAP) { console.log(`over the ${CAP}-line cap (${lines.length} lines): trim before the next brief`); bad++; }
process.exit(bad ? 1 : 0);
