#!/usr/bin/env node
// playbook.mjs [file] — checks the how-to playbook (default <tooling>/playbook.md) that tester and verifier briefs carry.
// Each entry is a `- ` line ending in `@<sha> files: a, b`: OK while no commit after <sha> touches those files, STALE once
// one does (run the step, then re-stamp or drop it), UNSTAMPED without a stamp, WRONG when flagged `- WRONG:`. Exits 1 on
// any STALE, UNSTAMPED or WRONG entry, or past the line cap, so the orchestrator fixes the playbook before it goes into
// the next brief.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config, die, STAMP, stampFiles, stampState } from "./lib.mjs";

const CAP = 150;
const cfg = config(), file = process.argv[2] ?? join(cfg.tooling, "playbook.md");
if (!existsSync(file)) die(`no playbook at ${file}`);
const lines = readFileSync(file, "utf8").split("\n").filter((l) => l.trim());
let bad = 0;
for (const l of lines.filter((l) => l.startsWith("- "))) {
  const m = l.match(STAMP);
  let tag = l.startsWith("- WRONG:") ? "WRONG" : "UNSTAMPED";
  if (m && tag !== "WRONG") tag = stampState(cfg, m[1], stampFiles(m[2]));
  if (tag !== "OK") bad++;
  console.log(`${tag.padEnd(9)} ${l.slice(2, m?.index).trim()}`);
}
if (lines.length > CAP) { console.log(`over the ${CAP}-line cap (${lines.length} lines): trim before the next brief`); bad++; }
process.exit(bad ? 1 : 0);
