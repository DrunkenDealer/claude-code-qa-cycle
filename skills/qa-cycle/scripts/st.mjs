#!/usr/bin/env node
// node st.mjs <status|-> [--verify text|+append] [--item-note text|+append]
//   [--commit sha] [--bucket now|later] [--ws W] [--by agentId] [--residual text] [--resolve-residual n accept|fix] [--force] ID ...
// status: open|fixing|fixed|verified|failed|deferred, or - to leave it.
// `verified` needs: a commit + verify evidence, every sha in commit an ancestor of main, `--by <agentId>` (an agents.txt
//   verifier that is not a fixer of the item), no unresolved residual, and a prior `fixed` (else --force).
//   On a verified item `--commit` only ADDS shas to the ones the merge recorded; replacing them needs --force.
// --residual "text" records a residual the user has to judge (repeatable); --resolve-residual <n> accept|fix records the
//   user's answer (1-based; run by the orchestrator after the gate). An item with an unresolved residual cannot be verified.
// `show ID...` prints id | status | commit [| by X] [| residuals: n open / m] and changes nothing.
// `legacy` marks every verified item with no commit (verified before shas were recorded) `legacy: true` instead of backfilling a sha
//   nobody can vouch for; it backs the page up first to tracker.html.pre-legacy.<time> and runs under the tracker lock. Idempotent.
// --verify is the verifier-evidence field, --item-note the item's own note. (--note no longer exists: it silently meant --verify.)
import { copyFileSync } from "node:fs";
import { config, updateItems, withTracker, die } from "./lib.mjs";
const [status, ...rest] = process.argv.slice(2);
if (!status) die("usage: st.mjs <status|-> [--verify t] [--item-note t] [--commit sha] [--bucket b] [--ws W] [--by agentId] [--residual t] [--resolve-residual n accept|fix] [--force] ID...");
if (status === "show") { // read-only: st.mjs show ID... → id | status | commit (the stale check reads the commit shas)
  const want = rest;
  withTracker(config(), (D) => {
    for (const id of want) {
      const i = D.items.find((x) => x.id === id);
      const res = i?.residuals?.length ? ` | residuals: ${i.residuals.filter((r) => r.state === "open").length} open / ${i.residuals.length}` : "";
      console.log(i ? `${i.id} | ${i.status} | ${i.commit || "-"}${i.by ? " | by " + i.by : ""}${res}` : `${id} | unknown`);
    }
    return false;
  });
  process.exit(0);
}
if (status === "legacy") {
  const cfg = config();
  withTracker(cfg, (D) => {
    const todo = D.items.filter((i) => i.status === "verified" && !i.commit && !i.legacy);
    if (!todo.length) return console.log("nothing to mark") ?? false;
    copyFileSync(cfg.tracker, `${cfg.tracker}.pre-legacy.${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`);
    for (const i of todo) i.legacy = true;
    console.log(`marked ${todo.length} legacy: ${todo.map((i) => i.id).join(" ")}`);
  });
  process.exit(0);
}
const patch = { status }, ids = [];
const opts = { "--verify": "verify", "--item-note": "note", "--commit": "commit", "--bucket": "bucket", "--ws": "ws", "--by": "by" };
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a === "--note") die("--note is gone (it used to write the verifier-evidence field): use --verify for evidence or --item-note for the item's own note");
  if (a === "--force") patch.force = true;
  else if (a === "--residual") { if (rest[i + 1] === undefined) die("--residual needs text"); (patch.residual ??= []).push(rest[++i]); }
  else if (a === "--resolve-residual") {
    const n = Number(rest[++i]), as = rest[++i];
    if (!Number.isInteger(n) || n < 1 || !["accept", "fix"].includes(as)) die("--resolve-residual needs <n> accept|fix");
    patch.resolveResidual = { n, as };
  }
  else if (opts[a]) { if (rest[i + 1] === undefined) die(`${a} needs a value`); patch[opts[a]] = rest[++i]; }
  else if (a.startsWith("--")) die(`unknown flag ${a}`);
  else ids.push(a);
}
if (!ids.length) die("no item ids given");
if ((patch.residual || patch.resolveResidual) && ids.length > 1) die("--residual / --resolve-residual take exactly one item id");
console.log(updateItems(config(), ids, patch));
