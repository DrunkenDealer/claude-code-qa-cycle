#!/usr/bin/env node
// node add.mjs ID sev "title" "where" "note" [later] [--now] [--ws W] [--unit N] [--force]
// sev: B|M|m. ws defaults to config.defaultWs, else the last item's workstream.
// Bucket follows severity: B and M go to `now`, m goes to `later` (status deferred) — a new minor waits for the user's gate.
// --now puts an m in `now` (only after the user said so); the 6th argument "later" parks any severity.
// Outside the session's scope (qa.config `scope.ws`) any severity is parked in `later`, tagged `scope: "out"`, for the user
// to pull in; --now overrides that too, on the user's word.
import { config, withTracker, summary, knownWs, inScope, SEV, die } from "./lib.mjs";
const pos = [], o = {};
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i++) {
  if (a[i] === "--force") o.force = true;
  else if (a[i] === "--now") o.now = true;
  else if (a[i] === "--ws" || a[i] === "--unit") o[a[i].slice(2)] = a[++i];
  else if (a[i].startsWith("--")) die(`unknown flag ${a[i]}`);
  else pos.push(a[i]);
}
const [id, sev, title, where, note = "", later] = pos;
if (!id || !title || !where) die('usage: add.mjs ID sev "title" "where" "note" [later] [--ws W]');
if (!SEV.includes(sev)) die(`severity "${sev}" not in ${SEV.join("|")}`);
if (later !== undefined && later !== "later") die(`6th argument must be "later" or absent, got "${later}"`);
if (o.now && later) die("--now and \"later\" contradict each other");
const cfg = config();
withTracker(cfg, (D) => {
  if (D.items.some((i) => i.id === id)) { console.log("exists", id); return false; }
  const ws = o.ws ?? cfg.defaultWs ?? D.items.at(-1)?.ws;
  if (!o.force && !knownWs(D).has(ws)) die(`workstream "${ws}" is new (known: ${[...knownWs(D)].join(" ")}); --force to create it`);
  const out = !o.now && !inScope(cfg, { ws });
  const isLater = !!later || out || (sev === "m" && !o.now);
  D.items.push({ id, sev, bucket: isLater ? "later" : "now", ws, unit: Number(o.unit ?? 0), title, where, note, status: isLater ? "deferred" : "open", commit: "", verify: "", ...(out ? { scope: "out" } : {}) });
  console.log("added", id, isLater ? "(later)" : "(now)", "ws", ws, "|", summary(D));
  if (out) console.log(`OUT OF SCOPE: ${ws} is not in this session's scope (${cfg.scope.ws.join(", ")}); parked in later. Tell the user; it stays out unless they pull it in (--now).`);
});
