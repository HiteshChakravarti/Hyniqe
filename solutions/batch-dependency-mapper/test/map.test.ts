import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { buildGraph, dataKey, parseAll, parseCron, parseJcl, parseShell } from "../src/map.ts";
import { edgesCsv, mermaid, svg, toMarkdown } from "../src/report.ts";

const dir = new URL("../samples/batch/", import.meta.url);
const files = readdirSync(dir).map((name) => ({ name, text: readFileSync(new URL(name, dir), "utf8") }));
const { jobs } = parseAll(files);
const g = buildGraph(jobs);
const has = (a: string, b: string) => g.edges.some((e) => e.from === a && e.to === b);

test("JCL: reads/writes from DISP, GDG generations and continuation lines", () => {
  const [j] = parseJcl(readFileSync(new URL("PAYEXTR.jcl", dir), "utf8"), "PAYEXTR.jcl");
  assert.ok(j.reads.has("PROD.PAYMENTS.SETTLED.DAILY"));
  assert.ok(j.writes.has("PROD.GL.FEED.PAYMENTS"));
  assert.ok(j.writes.has("PROD.GL.FEED.SORTED"));
  assert.deepEqual(j.programs, ["PAYX0100", "SORT"]);
});
test("cron and shell parsing", () => {
  assert.equal(parseCron("15 6 * * 1-5 /opt/x/fetch.sh >> /var/log/f.log 2>&1", "crontab")[0].schedule, "Mon–Fri at 06:15");
  const [s] = parseShell("SRC=/a/b.dat\ncp $SRC /c/d.dat\n./next.sh\n", "run.sh");
  assert.ok(s.reads.has("/a/b.dat") && s.writes.has("/c/d.dat") && s.calls.has("next.sh"));
});
test("same-name JCL and Control-M jobs merge; mainframe dataset copies match", () => {
  assert.equal(jobs.filter((j) => j.name === "SETTLE").length, 1);
  assert.equal(dataKey("/data/mainframe/PROD.GL.POSTINGS"), "PROD.GL.POSTINGS");
  assert.ok(has("GLPOST", "send_gl_to_dwh"));
  assert.ok(has("fx_rates_fetch", "GLPOST"));
});
test("dependencies, run order and risks", () => {
  assert.ok(has("SETTLE", "PAYEXTR") && has("PAYEXTR", "GLPOST") && has("GLPOST", "GL_TO_DWH") && has("send_gl_to_dwh", "load_dwh"));
  assert.ok((g.levels.get("load_dwh") ?? 0) > (g.levels.get("SETTLE") ?? 0));
  assert.deepEqual(g.missingConditions.map((m) => m.condition).sort(), ["FX-RATES-LOADED", "LEDGER-OPEN"]);
  assert.ok(g.isolated.includes("eod_cleanup"));
});
test("cycles detected", () => {
  const c = buildGraph(parseAll([{ name: "a.jcl", text: "//A JOB X\n//S EXEC PGM=P\n//I DD DSN=X.Y.B,DISP=SHR\n//O DD DSN=X.Y.A,DISP=(NEW,CATLG)\n//B JOB X\n//S EXEC PGM=Q\n//I DD DSN=X.Y.A,DISP=SHR\n//O DD DSN=X.Y.B,DISP=(NEW,CATLG)" }]).jobs);
  assert.equal(c.cycles.length, 1);
});
test("outputs render", () => {
  assert.match(toMarkdown(g), /never set|which no job sets/);
  assert.match(mermaid(g), /^flowchart LR/);
  assert.match(svg(g), /^<svg/);
  assert.match(edgesCsv(g), /^from,to,via,type/);
});
