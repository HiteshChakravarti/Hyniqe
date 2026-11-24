// Benchmark: 24 workbooks generated with openpyxl (an independent Excel library) with known planted risk features
// (bench/labels.json). Checks each feature is detected and nothing is invented. Run: node bench.ts
import { readFileSync, readdirSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { printScores, type Score } from "../shared/bench.ts";
import { scanWorkbook } from "./src/scan.ts";

const dir = new URL("./bench/workbooks/", import.meta.url);
const labels: Record<string, string[]> = JSON.parse(readFileSync(new URL("./bench/labels.json", import.meta.url), "utf8"));
const inflate = async (d: Uint8Array) => new Uint8Array(inflateRawSync(d));
const per = new Map<string, Score>();
for (const f of readdirSync(dir).filter((x) => labels[x])) {
  const rep = await scanWorkbook(f, new Uint8Array(readFileSync(new URL(f, dir))), inflate);
  const got = new Set(rep.findings.map((x) => x.rule).filter((r) => !["OWNERSHIP", "CONNECTIONS", "SIZE"].includes(r)));
  const exp = new Set(labels[f]);
  for (const k of new Set([...got, ...exp])) { const s = per.get(k) ?? { label: k, tp: 0, fp: 0, fn: 0 }; if (got.has(k) && exp.has(k)) s.tp++; else if (got.has(k)) s.fp++; else s.fn++; per.set(k, s); }
}
const o = printScores("EUC Risk Scanner — 24 openpyxl-generated workbooks", [...per.values()].sort((a, b) => a.label.localeCompare(b.label)));
if (o.recall < 1 || o.precision < 1) process.exitCode = 1;
