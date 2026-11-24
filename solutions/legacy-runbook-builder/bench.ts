// Gap-detection benchmark on bench/gaps.txt: single procedure lines labelled with the knowledge gaps a reviewer
// would flag (or none). Document-level gaps (no owner / schedule / failure path) are covered by the tests.
// Run: node bench.ts
import { readFileSync } from "node:fs";
import { buildRunbook } from "./src/extract.ts";
import { printScores, type Score } from "../shared/bench.ts";

const DOC_LEVEL = new Set(["NO_FAILURE_PATH", "NO_OWNER", "NO_SCHEDULE", "UNEXPLAINED_ACRONYM"]);
const lines = readFileSync(new URL("./bench/gaps.txt", import.meta.url), "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
const per = new Map<string, Score>();
const diffs: string[] = [];
let negatives = 0, clean = 0;
for (const l of lines) {
  const [exp, text] = l.split("\t");
  const expected = new Set(exp === "NONE" ? [] : exp.split(","));
  const isCode = /^(rm|DELETE|TRUNCATE|UPDATE|scp|copy|sshpass|sqlplus|export)\b/.test(text);
  const rb = buildRunbook([{ name: isCode ? "line.sh" : "line.txt", text }]);
  const got = new Set(rb.gaps.map((g) => g.type as string).filter((t) => !DOC_LEVEL.has(t)));
  if (exp === "NONE") { negatives++; if (!got.size) clean++; }
  for (const t of new Set([...expected, ...got])) {
    const s = per.get(t) ?? { label: t, tp: 0, fp: 0, fn: 0 };
    if (expected.has(t) && got.has(t)) s.tp++; else if (got.has(t)) s.fp++; else s.fn++;
    per.set(t, s);
  }
  const d = [...expected].filter((x) => !got.has(x)).map((x) => "-" + x).concat([...got].filter((x) => !expected.has(x)).map((x) => "+" + x));
  if (d.length) diffs.push(`  ${d.join(" ")}  ←  ${text}`);
}
const o = printScores(`Legacy Runbook Builder — gap detection (${lines.length} lines, ${negatives} clean lines)`, [...per.values()].sort((a, b) => a.label.localeCompare(b.label)));
console.log(`Clean lines with no false gap: ${clean}/${negatives}`);
if (diffs.length) console.log("Differences:\n" + diffs.join("\n"));
if (o.recall < 0.85 || o.precision < 0.85) process.exitCode = 1;
