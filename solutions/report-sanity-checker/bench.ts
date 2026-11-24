// Synthetic benchmark: 3,000 derivatives-report rows, ~40% with one injected error of 12 types. Row-level scoring.
// Run: node bench.ts
import { parseCsv } from "../shared/table.ts";
import { printScores, type Score } from "../shared/bench.ts";
import { checkReport } from "./src/check.ts";
import { generate } from "./bench/gen.ts";

const { csv, labels } = generate(2026, 3000);
const { issues } = checkReport(parseCsv(csv));
const got = new Map<number, Set<string>>();
for (const i of issues) (got.get(i.row) ?? got.set(i.row, new Set()).get(i.row)!).add(i.rule);
const per = new Map<string, Score>();
labels.forEach((lab, idx) => {
  const g = got.get(idx + 2) ?? new Set();
  const e = new Set(lab);
  for (const k of new Set([...g, ...e])) { const s = per.get(k) ?? { label: k, tp: 0, fp: 0, fn: 0 }; if (g.has(k) && e.has(k)) s.tp++; else if (g.has(k)) s.fp++; else s.fn++; per.set(k, s); }
});
const o = printScores("\"Valid but wrong\" Report Checker — synthetic benchmark (3,000 rows)", [...per.values()].sort((a, b) => a.label.localeCompare(b.label)));
if (o.recall < 0.95 || o.precision < 0.95) process.exitCode = 1;
