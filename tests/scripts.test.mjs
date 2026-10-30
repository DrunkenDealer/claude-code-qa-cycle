// node --test published/qa-cycle/tests — deterministic checks of the qa-cycle scripts against throwaway repos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), "../skills/qa-cycle/scripts");
const git = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd, encoding: "utf8" }).stdout.trim();

function fixture({ items = [], units = {}, runs, gate = true, config = {}, agents = "" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "qa-test-"));
  const repo = join(root, "repo"), tooling = join(root, "tooling"), scratch = join(root, "scratch");
  for (const d of [repo, tooling, scratch]) mkdirSync(d);
  git(repo, "init", "-q", "-b", "main");
  writeFileSync(join(repo, "a.txt"), "a\n");
  writeFileSync(join(repo, "b.txt"), "b\n");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "init");
  const head = git(repo, "rev-parse", "--short", "main");
  const D = {
    workstreams: { W1: { name: "notifications" }, W2: { name: "looks" } },
    items,
    units,
    runs: runs ?? (Object.keys(units).length ? [{ cycle: "1", sha: head, at: "x", units: Object.keys(units), platforms: [], found: { B: 0, M: 0, m: 0 } }] : []),
    ...(gate ? { gate: { sha: head, at: "x" } } : {}),
  };
  writeFileSync(join(tooling, "tracker.html"), `<script>\nconst D=${JSON.stringify(D)};\n</script>\n`);
  writeFileSync(join(tooling, "agents.txt"), agents);
  const cfgPath = join(tooling, "qa.config.json");
  writeFileSync(cfgPath, JSON.stringify({ project: "T", cycle: "1", repo, main: "main", scratch, platforms: [], ...config }));
  const run = (script, ...args) => {
    const r = spawnSync("node", [join(SCRIPTS, script), ...args], { env: { ...process.env, QA_CONFIG: cfgPath }, encoding: "utf8" });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  const tracker = () => JSON.parse(readFileSync(join(tooling, "tracker.html"), "utf8").match(/const D=(\{.*\});\n/)[1]);
  const done = () => JSON.parse(run("done.mjs", "--json").out);
  const crit = (n) => done().criteria.find((c) => c.n === n);
  return { root, repo, tooling, scratch, head, run, tracker, done, crit };
}
const item = (id, o = {}) => ({ id, sev: "M", bucket: "now", ws: "W1", unit: 1, title: id, where: "x", note: "", status: "verified", commit: "", verify: "ok", ...o });
const freePort = () => new Promise((res) => { const s = createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });

// ── regression: behavior 1.2.4 already has ──

test("add: B/M go to now, m goes to later as deferred", () => {
  const f = fixture();
  f.run("add.mjs", "N1", "M", "major", "x", "", "--ws", "W1");
  f.run("add.mjs", "N2", "m", "minor", "x", "", "--ws", "W1");
  const [a, b] = f.tracker().items;
  assert.equal(a.bucket, "now"); assert.equal(a.status, "open");
  assert.equal(b.bucket, "later"); assert.equal(b.status, "deferred");
});

test("done: READY when everything is verified, gated, covered and clean", () => {
  const f = fixture({ items: [item("N1")], units: { U1: { files: ["a.txt"] } } });
  assert.equal(f.done().verdict, "READY");
});

test("done: NOT READY while a fix-now item is open", () => {
  const f = fixture({ items: [item("N1", { status: "open" })], units: { U1: { files: ["a.txt"] } } });
  assert.equal(f.done().verdict, "NOT READY");
});

test("done: CLEANUP when only a sandbox is left", () => {
  const f = fixture({ items: [item("N1")], units: { U1: { files: ["a.txt"] } } });
  mkdirSync(join(f.scratch, "sbx", "N1"), { recursive: true });
  const d = f.done();
  assert.equal(d.verdict, "CLEANUP");
  assert.match(d.criteria[6].evidence, /sandbox/);
});

// ── scope: a scoped session judges and fills only its own scope ──

test("add: a finding outside the session scope is parked in later and flagged", () => {
  const f = fixture({ config: { scope: { ws: ["W1"] } } });
  const r = f.run("add.mjs", "N1", "M", "major elsewhere", "x", "", "--ws", "W2");
  const [i] = f.tracker().items;
  assert.equal(i.bucket, "later"); assert.equal(i.status, "deferred"); assert.equal(i.scope, "out");
  assert.match(r.out, /out of scope/i);
});

test("add: a finding inside the scope keeps the severity policy", () => {
  const f = fixture({ config: { scope: { ws: ["W1"] } } });
  f.run("add.mjs", "N1", "M", "major here", "x", "", "--ws", "W1");
  const [i] = f.tracker().items;
  assert.equal(i.bucket, "now"); assert.equal(i.scope, undefined);
});

test("add: --now pulls an out-of-scope finding in only when asked", () => {
  const f = fixture({ config: { scope: { ws: ["W1"] } } });
  f.run("add.mjs", "N1", "M", "user said fix it", "x", "", "--ws", "W2", "--now");
  assert.equal(f.tracker().items[0].bucket, "now");
});

test("done: out-of-scope leftovers from other areas don't hold a scoped session", () => {
  const f = fixture({
    config: { scope: { ws: ["W1"], units: ["U1"] } },
    items: [item("N1"), item("L1", { ws: "W2", status: "open" }), item("L2", { ws: "W2", bucket: "later", status: "deferred" })],
    units: { U1: { files: ["a.txt"] }, U2: { files: ["b.txt"] } },
    runs: [],
  });
  f.run("st.mjs", "run", "1", "U1", "0/0/0");
  const d = f.done();
  assert.ok(d.criteria[0].ok, d.criteria[0].evidence);
  assert.ok(d.criteria[3].ok, d.criteria[3].evidence);
  assert.ok(d.criteria[5].ok, d.criteria[5].evidence);
  assert.match(d.criteria[0].evidence, /out of scope/i);
  assert.equal(d.verdict, "READY");
});

test("done: without a scope every item still counts", () => {
  const f = fixture({ items: [item("N1"), item("L1", { ws: "W2", status: "open" })], units: { U1: { files: ["a.txt"] } } });
  assert.equal(f.done().verdict, "NOT READY");
});

// ── close: one command frees what the loop left behind ──

test("close: dry run lists a leftover sandbox, --yes removes it, an owned one stays", () => {
  const f = fixture({ agents: "v2 | verifier | sonnet | N2 | running | x |  | sbx/N2 :3910\n" });
  mkdirSync(join(f.scratch, "sbx", "N1"), { recursive: true });
  mkdirSync(join(f.scratch, "sbx", "N2"), { recursive: true });
  const dry = f.run("close.mjs");
  assert.equal(dry.code, 0, dry.out);
  assert.match(dry.out, /N1/);
  assert.ok(existsSync(join(f.scratch, "sbx", "N1")));
  f.run("close.mjs", "--yes");
  assert.ok(!existsSync(join(f.scratch, "sbx", "N1")));
  assert.ok(existsSync(join(f.scratch, "sbx", "N2")));
});

test("close and done: a leftover listener in the loop's ports fails criterion 7 until close stops it", async () => {
  const port = await freePort();
  const srv = spawn("node", ["-e", `require("net").createServer().listen(${port}); setInterval(() => {}, 1e3)`], { stdio: "ignore" });
  try {
    await new Promise((r) => setTimeout(r, 400));
    const f = fixture({ items: [item("N1")], units: { U1: { files: ["a.txt"] } }, config: { sweepPorts: [`${port}-${port}`] } });
    const c7 = f.crit(7);
    assert.ok(!c7.ok); assert.match(c7.evidence, /listener/);
    f.run("close.mjs", "--yes");
    await new Promise((r) => setTimeout(r, 400));
    assert.ok(srv.exitCode !== null || srv.signalCode !== null, "listener still alive");
    assert.ok(f.crit(7).ok);
  } finally { srv.kill(); }
});

// ── auto-accept: decisions taken on the user's standing word are logged and reported ──

test("st auto: refused unless the config says autoAccept recommended", () => {
  const f = fixture();
  assert.notEqual(f.run("st.mjs", "auto", "minors gate — took the recommended split").code, 0);
  assert.equal(f.tracker().auto, undefined);
});

test("st auto: logs the decision and done's report lists it", () => {
  const f = fixture({ items: [item("N1")], units: { U1: { files: ["a.txt"] } }, config: { autoAccept: "recommended" } });
  assert.equal(f.run("st.mjs", "auto", "N1 plan — took option A (keep the last entry)").code, 0);
  assert.equal(f.tracker().auto.length, 1);
  assert.match(f.run("done.mjs").out, /Auto-decided[\s\S]*option A/);
});

// ── playbook: how-to notes go stale with the files they describe ──

test("playbook: entries are OK until their files change, unstamped ones are flagged", () => {
  const f = fixture();
  writeFileSync(join(f.tooling, "playbook.md"), [
    "# Playbook",
    `- seed the db with seed.py before the insights unit @${f.head} files: a.txt`,
    `- open settings via the deep link @${f.head} files: b.txt`,
    "- the emulator needs a cold boot",
  ].join("\n") + "\n");
  appendFileSync(join(f.repo, "a.txt"), "changed\n");
  git(f.repo, "commit", "-qam", "touch a");
  const r = f.run("playbook.mjs");
  assert.notEqual(r.code, 0);
  assert.match(r.out, /STALE.*seed the db/);
  assert.match(r.out, /OK.*deep link/);
  assert.match(r.out, /UNSTAMPED.*cold boot/);
});

test("playbook: over the line cap is an error", () => {
  const f = fixture();
  writeFileSync(join(f.tooling, "playbook.md"), Array.from({ length: 151 }, (_, i) => `- tip ${i} @${f.head} files: a.txt`).join("\n") + "\n");
  const r = f.run("playbook.mjs");
  assert.notEqual(r.code, 0);
  assert.match(r.out, /cap/i);
});
