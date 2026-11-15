#!/usr/bin/env node
// triage.mjs apply [batch numbers…]   applies the triagers' <scratch>/triage/c<cycle>/batch-<n>.out.md (all batches by default):
//   GROUP <B|M|m> <common|plausible|contrived> <ws|-> | <root cause> | <where> | <finding and D ids>   one tracker item per root cause
//   DROP <finding ids> | <reason>                                                                   a new dropped.md entry
//   DROP <finding ids> = D<n>                                                                       a repeat sighting of that entry
//   KEEP D<n>      a STALE drop re-judged still contrived: re-stamped at main
//   REMOVE D<n>    a drop whose code is gone
//   A D id inside a GROUP promotes that drop back to the tracker. Every finding of an applied batch must appear exactly once in a
//   GROUP or DROP, and every STALE drop it lists in a GROUP, KEEP or REMOVE — otherwise nothing is written.
// triage.mjs drop "<where>" "<symptom>" "<reason>"   a contrived NEW from a planner, fixer or verifier mid-loop: a new dropped.md
//   entry, or a repeat sighting of the entry with the same where key.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config, die, git, withTracker, withDrops, addItem, summary, whereKey, keyFile, nextDropId, SEV, REACH } from "./lib.mjs";

const cfg = config(), [cmd, ...a] = process.argv.slice(2);
const cycle = String(cfg.cycle ?? 0), sha = git(cfg.repo, "rev-parse", "--short", cfg.main).out;
const fileOf = (key) => (/\.\w+$/.test(keyFile(key)) ? keyFile(key) : ".");
const ids = (s) => s.split(/[,\s]+/).filter(Boolean);

if (cmd === "drop") {
  const [where, symptom, reason] = a;
  if (!where || !symptom || !reason) die('usage: triage.mjs drop "<where>" "<symptom>" "<reason>"');
  const key = whereKey(where);
  withDrops(cfg, (drops) => {
    const d = drops.find((x) => x.key === key);
    if (d) { d.seen++; if (!d.cycles.includes(cycle)) d.cycles.push(cycle); console.log(`repeat sighting of ${d.id} (seen ${d.seen}) — a drop seen again from another path is a promotion candidate for the next triager`); }
    else { const id = nextDropId(drops); drops.push({ id, key, symptom, reason, seen: 1, cycles: [cycle], sha, files: [fileOf(key)] }); console.log(`dropped as ${id}`); }
  });
} else if (cmd === "apply") {
  const dir = join(cfg.scratch, "triage", `c${cycle}`), meta = join(dir, "findings.json");
  if (!existsSync(meta)) die(`no ${meta}: run fingerprint.mjs first`);
  const F = JSON.parse(readFileSync(meta, "utf8"));
  const which = a.length ? a.map(Number) : F.batches.map((_, i) => i + 1);
  const groups = [], newDrops = [], repeats = [], keep = [], remove = [], errs = [], seen = new Map();
  const use = (id, where) => (seen.has(id) ? errs.push(`${id} appears twice (${seen.get(id)} and ${where})`) : seen.set(id, where));
  for (const n of which) {
    const b = F.batches[n - 1], out = join(dir, `batch-${n}.out.md`);
    if (!b) { errs.push(`no batch ${n}`); continue; }
    if (!existsSync(out)) { errs.push(`batch ${n}: no answer at ${out}`); continue; }
    readFileSync(out, "utf8").split("\n").forEach((line, i) => {
      const at = `batch-${n}.out.md:${i + 1}`, [head, ...rest] = line.split(" | ").map((s) => s.trim());
      const [kw, ...w] = head.split(/\s+/);
      if (kw === "GROUP") {
        const [sev, reach, ws] = w;
        if (rest.length !== 3 || !SEV.includes(sev) || !REACH.includes(reach) || !ws) return errs.push(`${at}: GROUP <sev> <reach> <ws|-> | <root cause> | <where> | <ids>`);
        const g = { sev, reach, ws: ws === "-" ? undefined : ws, title: rest[0], where: rest[1], ids: ids(rest[2]) };
        g.ids.forEach((id) => use(id, at));
        groups.push(g);
      } else if (kw === "DROP") {
        const m = head.match(/^DROP\s+(.+?)\s*=\s*(D\d+)$/);
        if (m) { ids(m[1]).forEach((id) => use(id, at)); repeats.push({ ids: ids(m[1]), to: m[2] }); }
        else if (rest.length === 1 && w.length) { ids(w.join(" ")).forEach((id) => use(id, at)); newDrops.push({ ids: ids(w.join(" ")), reason: rest[0] }); }
        else errs.push(`${at}: DROP <ids> | <reason>, or DROP <ids> = D<n>`);
      } else if (kw === "KEEP" || kw === "REMOVE") {
        if (w.length !== 1 || !/^D\d+$/.test(w[0])) return errs.push(`${at}: ${kw} D<n>`);
        use(w[0], at);
        (kw === "KEEP" ? keep : remove).push(w[0]);
      } else if (kw && /^[A-Z]{3,}$/.test(kw)) errs.push(`${at}: unknown line "${kw}"`);
    });
    for (const id of [...b.findings, ...b.stale]) if (!seen.has(id)) errs.push(`batch ${n}: ${id} is in no GROUP/DROP${id.startsWith("D") ? "/KEEP/REMOVE" : ""}`);
  }
  for (const id of seen.keys()) if (!id.startsWith("D") && !F.findings[id]) errs.push(`${id} (${seen.get(id)}) is not a finding of this cycle`);
  if (errs.length) die(errs.join("\n") + "\n(nothing written)");

  let added = [], promoted = 0;
  withDrops(cfg, (drops) => {
    const byId = new Map(drops.map((d) => [d.id, d]));
    const missing = [...seen.keys()].filter((id) => id.startsWith("D") && !byId.has(id)).concat(repeats.map((r) => r.to).filter((id) => !byId.has(id)));
    if (missing.length) die(`not in dropped.md: ${[...new Set(missing)].join(" ")} (nothing written)`);
    const promote = new Set(groups.flatMap((g) => g.ids.filter((id) => id.startsWith("D"))));
    promoted = promote.size;
    withTracker(cfg, (D) => {
      const prefix = cfg.idPrefix ?? "N", re = new RegExp(`^${prefix}(\\d+)$`);
      let next = Math.max(0, ...D.items.map((i) => +(i.id.match(re)?.[1] ?? 0))) + 1;
      for (const g of groups) {
        const fs = g.ids.filter((id) => !id.startsWith("D")).map((id) => F.findings[id]);
        const symptoms = [...fs.map((f) => `${f.id} ${f.line}`), ...g.ids.filter((id) => id.startsWith("D")).map((id) => { const d = byId.get(id); return `${id} (dropped, seen ${d.seen}) ${d.key} · ${d.symptom}`; })];
        added.push(addItem(cfg, D, { id: prefix + next++, sev: g.sev, reach: g.reach, ws: g.ws, title: g.title, where: g.where, unit: String(fs[0]?.unit ?? "").replace(/\D/g, "") || 0, symptoms }));
      }
    });
    for (const r of repeats) { const d = byId.get(r.to); d.seen += r.ids.length; if (!d.cycles.includes(cycle)) d.cycles.push(cycle); }
    for (const id of keep) Object.assign(byId.get(id), { sha });
    for (const nd of newDrops) {
      const fs = nd.ids.map((id) => F.findings[id]);
      drops.push({ id: nextDropId(drops), key: fs[0].key, symptom: fs[0].title, reason: nd.reason, seen: fs.length, cycles: [cycle], sha, files: [...new Set(fs.map((f) => fileOf(f.key)))] });
    }
    for (let i = drops.length - 1; i >= 0; i--) if (promote.has(drops[i].id) || remove.includes(drops[i].id)) drops.splice(i, 1);
  });

  const real = (g) => g.ids.filter((id) => !id.startsWith("D")).length;
  const folded = groups.reduce((s, g) => s + Math.max(0, real(g) - 1), 0), total = [...seen.keys()].filter((id) => !id.startsWith("D")).length;
  const dropped = newDrops.reduce((s, d) => s + d.ids.length, 0) + repeats.reduce((s, r) => s + r.ids.length, 0);
  const c = (sev) => added.filter((i) => i.sev === sev).length;
  console.log(`${total} findings → ${added.length} items (${added.filter((i) => i.bucket === "now").length} now, ${added.filter((i) => i.bucket === "later").length} later) · ${folded} folded · ${dropped} dropped (${repeats.length} repeat sightings) · ${promoted} promoted · ${keep.length} kept · ${remove.length} removed`);
  console.log(`items: ${added.map((i) => i.id).join(" ")}`);
  console.log(`record the run: st.mjs run ${cycle} <units|all> ${c("B")}/${c("M")}/${c("m")} --triage ${folded}/${dropped}/${promoted}`);
} else die("usage: triage.mjs apply [batch…] | drop \"<where>\" \"<symptom>\" \"<reason>\"");
