#!/usr/bin/env node
// fingerprint.mjs [--batch N] [findings.md …]   (default: <scratch>/tester-*/findings.md)
// The zero-token pass before qa-triager: parses the testers' findings files, clusters them by file (same function adjacent),
// attaches the dropped.md entries for those files (OK ones as repeats to match, STALE ones to re-judge), and packs whole
// clusters into batches of at most N findings (default 80) under <scratch>/triage/c<cycle>/batch-<n>.md, one triager each.
// Lines it reads: `FINDING <title> · <sev> · <reach> · <where> · <repro> · <script> · <expected vs actual>`
//                 `EDGE <where> · <symptom> · <why contrived>`
// Anything else in the file is ignored; a FINDING/EDGE line with the wrong field count is an error (nothing written).
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { config, die, git, whereKey, keyFile, readDrops, stampState, SEV, REACH } from "./lib.mjs";

const cfg = config(), a = process.argv.slice(2);
const bi = a.indexOf("--batch"), cap = bi >= 0 ? Number(a.splice(bi, 2)[1]) : 80;
if (!(cap > 0)) die("--batch needs a positive number");
const files = a.length ? a : readdirSync(cfg.scratch).filter((d) => d.startsWith("tester-")).map((d) => join(cfg.scratch, d, "findings.md")).filter(existsSync);
if (!files.length) die(`no findings files (looked for ${join(cfg.scratch, "tester-*/findings.md")})`);

const findings = [], errs = [];
for (const f of files) {
  const unit = basename(dirname(f)).replace(/^tester-/, "");
  let n = 0;
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    const kind = line.match(/^(FINDING|EDGE)\s+/)?.[1];
    if (!kind) return;
    const p = line.slice(kind.length).split(" · ").map((s) => s.trim());
    const id = `${unit}.${++n}`;
    if (kind === "FINDING") {
      if (p.length !== 7 || !SEV.includes(p[1]) || !REACH.includes(p[2])) return errs.push(`${f}:${i + 1}: FINDING needs 7 fields with sev ${SEV.join("|")} and reach ${REACH.join("|")}`);
      findings.push({ id, unit, kind, title: p[0], sev: p[1], reach: p[2], where: p[3], key: whereKey(p[3]), line: line.trim() });
    } else {
      if (p.length !== 3) return errs.push(`${f}:${i + 1}: EDGE needs 3 fields (where · symptom · why contrived)`);
      findings.push({ id, unit, kind, title: p[1], sev: "m", reach: "contrived", where: p[0], key: whereKey(p[0]), line: line.trim() });
    }
  });
}
if (errs.length) die(errs.join("\n") + "\n(nothing written)");

const drops = readDrops(cfg).map((d) => ({ ...d, state: stampState(cfg, d.sha, d.files) }));
const clusters = new Map();
const cluster = (file) => clusters.get(file) ?? clusters.set(file, { file, findings: [], drops: [] }).get(file);
for (const f of findings) cluster(keyFile(f.key)).findings.push(f);
for (const d of drops) if (clusters.has(keyFile(d.key)) || d.state !== "OK") cluster(keyFile(d.key)).drops.push(d);

const batches = [];
for (const c of [...clusters.values()].sort((x, y) => x.file.localeCompare(y.file))) {
  c.findings.sort((x, y) => x.key.localeCompare(y.key));
  const last = batches.at(-1);
  if (last && last.n + c.findings.length <= cap) { last.clusters.push(c); last.n += c.findings.length; }
  else batches.push({ clusters: [c], n: c.findings.length });
}

const dir = join(cfg.scratch, "triage", `c${cfg.cycle ?? 0}`);
mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) if (/^batch-\d+/.test(f) || f === "findings.json") rmSync(join(dir, f));
const sha = git(cfg.repo, "rev-parse", "--short", cfg.main).out;
batches.forEach((b, i) => {
  const out = join(dir, `batch-${i + 1}.out.md`);
  const body = [`# Triage batch ${i + 1} of ${batches.length} — cycle ${cfg.cycle ?? 0}, main ${sha}`, `Answer in ${out}`, ""];
  for (const c of b.clusters) {
    body.push(`## ${c.file} (${c.findings.length})`, ...c.findings.map((f) => `${f.id} ${f.line}`));
    for (const d of c.drops) body.push(`${d.state === "OK" ? "~" : "!"} ${d.id} ${d.state} ${d.key} · ${d.symptom} · ${d.reason} · seen ${d.seen} (${d.cycles.join(",")})`);
    body.push("");
  }
  writeFileSync(join(dir, `batch-${i + 1}.md`), body.join("\n"));
});
writeFileSync(join(dir, "findings.json"), JSON.stringify({
  cycle: String(cfg.cycle ?? 0), sha,
  findings: Object.fromEntries(findings.map((f) => [f.id, f])),
  batches: batches.map((b) => ({ findings: b.clusters.flatMap((c) => c.findings.map((f) => f.id)), stale: b.clusters.flatMap((c) => c.drops.filter((d) => d.state !== "OK").map((d) => d.id)) })),
}));
const edge = findings.filter((f) => f.kind === "EDGE").length, stale = drops.filter((d) => d.state !== "OK").length;
console.log(`${findings.length} findings (${edge} EDGE) from ${files.length} file(s), ${clusters.size} file clusters → ${batches.length} batch(es) in ${dir}`);
console.log(`dropped.md: ${drops.length} entries, ${stale} STALE to re-judge`);
