#!/usr/bin/env node
// close.mjs [--yes] — frees what the loop left behind, at the end of every cycle and session (SKILL.md step 10). Dry run by
// default (WOULD … per leftover); --yes acts (DONE …). It covers: sandboxes under the sandbox root that no `running`
// agents.txt row names; TCP listeners in the loop's ports that no running row owns (killed by PID); devices recorded as
// `device:<serial|UDID>` in a finished row's note that are still booted (`adb emu kill`, `simctl shutdown`); and merged
// worktrees and branches (reap.mjs --all-merged, with its own skip rules). Nothing unrecorded is ever touched, so the
// user's own emulators, simulators and servers stay up. Running rows are listed, not stopped: mark the ones that handed
// back `done` first. Run done.mjs afterwards; criterion 7 checks the same things.
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { config, configPath, agentRows, itemIds, listeners, leftoverDevices, here } from "./lib.mjs";

const cfg = config(), yes = process.argv.includes("--yes");
const running = agentRows(cfg).filter((r) => r.state === "running");
const act = (what, fn) => { console.log(`${yes ? "DONE" : "WOULD"} ${what}`); if (yes) fn(); };
if (running.length) console.log(`KEEP ${running.length} running agent(s): ${running.map((r) => `${r.role} ${r.id}`).join(", ")} (mark the ones that handed back done, then re-run)`);

const owned = (name) => running.some((r) => itemIds(r.items).includes(name) || new RegExp(`(^|[^\\w-])${name}($|[^\\w-])`).test(r.note));
for (const box of existsSync(cfg.sandboxRoot) ? readdirSync(cfg.sandboxRoot).filter((f) => !f.startsWith(".")) : []) {
  if (owned(box)) console.log(`KEEP sandbox ${box} (running agent)`);
  else act(`remove sandbox ${join(cfg.sandboxRoot, box)}`, () => rmSync(join(cfg.sandboxRoot, box), { recursive: true, force: true }));
}
// A listener can exit between the lsof and the kill; that is the outcome we wanted.
for (const l of listeners(cfg).filter((l) => !l.owner)) act(`stop :${l.port} pid ${l.pid} (cwd ${l.cwd})`, () => { try { process.kill(Number(l.pid)); } catch {} });
for (const d of leftoverDevices(cfg))
  act(`shut down ${d.kind} ${d.id}`, () => d.kind === "android" ? spawnSync("adb", ["-s", d.id, "emu", "kill"]) : spawnSync("xcrun", ["simctl", "shutdown", d.id]));

const reap = spawnSync("node", [join(here, "reap.mjs"), "--all-merged", ...(yes ? ["--yes"] : [])], { encoding: "utf8", env: { ...process.env, QA_CONFIG: configPath() } });
process.stdout.write(reap.stdout + reap.stderr);
process.exit(reap.status ?? 1);
