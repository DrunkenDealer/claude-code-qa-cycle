#!/usr/bin/env node
// sweep.mjs — read-only: lists TCP listeners in the loop's port ranges (qa.config.json `sweepPorts`, e.g. ["3700-3799","4700-4799"],
// default: every range in `ports` plus +1000 for Vite) with pid and cwd, and marks which belong to a `running` agents.txt row
// (its note/items mention the port or sandbox). Stops nothing: close.mjs (or the orchestrator, by PID) stops leftovers.
import { config, listeners } from "./lib.mjs";
const found = listeners(config());
for (const l of found) console.log(`:${l.port} pid ${l.pid} cwd ${l.cwd} ${l.owner ? "KEEP (running " + l.owner + ")" : "leftover?"}`);
if (!found.length) console.log("no listeners in the loop's port ranges");
