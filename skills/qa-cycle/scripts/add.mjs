#!/usr/bin/env node
// node add.mjs ID sev "title" "where" "note" [later] [--now] [--reach common|plausible|contrived] [--ws W] [--unit N] [--force]
// sev: B|M|m. ws defaults to config.defaultWs, else the last item's workstream.
// Bucket follows severity and reach: B and M go to `now`, m and a contrived M go to `later` (status deferred) — they wait for the user's gate.
// --now puts an m in `now` (only after the user said so); the 6th argument "later" parks any severity.
// Outside the session's scope (qa.config `scope.ws`) any severity is parked in `later`, tagged `scope: "out"`, for the user
// to pull in; --now overrides that too, on the user's word.
import { config, withTracker, summary, addItem, die } from "./lib.mjs";
const pos = [], o = {};
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i++) {
  if (a[i] === "--force") o.force = true;
  else if (a[i] === "--now") o.now = true;
  else if (["--ws", "--unit", "--reach"].includes(a[i])) o[a[i].slice(2)] = a[++i];
  else if (a[i].startsWith("--")) die(`unknown flag ${a[i]}`);
  else pos.push(a[i]);
}
const [id, sev, title, where, note = "", later] = pos;
if (!id || !title || !where) die('usage: add.mjs ID sev "title" "where" "note" [later] [--ws W]');
if (later !== undefined && later !== "later") die(`6th argument must be "later" or absent, got "${later}"`);
if (o.now && later) die("--now and \"later\" contradict each other");
const cfg = config();
withTracker(cfg, (D) => {
  const it = addItem(cfg, D, { id, sev, reach: o.reach, title, where, note, ws: o.ws, unit: o.unit }, { now: o.now, later: !!later, force: o.force });
  if (!it) { console.log("exists", id); return false; }
  console.log("added", id, it.bucket === "later" ? "(later)" : "(now)", "ws", it.ws, "|", summary(D));
  if (it.scope === "out") console.log(`OUT OF SCOPE: ${it.ws} is not in this session's scope (${cfg.scope.ws.join(", ")}); parked in later. Tell the user; it stays out unless they pull it in (--now).`);
});
