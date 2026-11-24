// Benchmark against 50 hand-labelled banking AI use cases (bench/labelled.csv), including tricky ones:
// fraud vs credit, corporate vs consumer credit, 1:1 face verification vs facial recognition, internal chatbots.
// Labels are an indicative reading of the EU AI Act categories, not legal determinations. Run: node bench.ts
import { readFileSync } from "node:fs";
import { parseCsv } from "../shared/table.ts";
import { classify, readUseCases } from "./src/classify.ts";

const rows = parseCsv(readFileSync(new URL(`./bench/${process.argv[2] ?? "labelled"}.csv`, import.meta.url), "utf8"));
const tiers = ["PROHIBITED?", "HIGH-RISK", "REVIEW", "TRANSPARENCY", "MINIMAL"];
const matrix: Record<string, Record<string, number>> = Object.fromEntries(tiers.map((t) => [t, Object.fromEntries(tiers.map((u) => [u, 0]))]));
const misses: string[] = [];
let right = 0;
readUseCases(rows).forEach((uc, i) => {
  const exp = rows[i].expected;
  const got = classify(uc).tier;
  matrix[exp][got]++;
  if (got === exp) right++;
  else misses.push(`  ${uc.name}: expected ${exp}, got ${got}`);
});
console.log(`\nAI Use Register — tier accuracy on ${rows.length} hand-labelled use cases: ${((right / rows.length) * 100).toFixed(1)}%`);
console.log("expected \\ got".padEnd(16) + tiers.map((t) => t.padStart(14)).join(""));
for (const t of tiers) console.log(t.padEnd(16) + tiers.map((u) => String(matrix[t][u]).padStart(14)).join(""));
const missedHigh = tiers.slice(0, 2).reduce((s, t) => s + tiers.slice(3).reduce((x, u) => x + matrix[t][u], 0), 0);
console.log(`Prohibited/high-risk cases under-classified as transparency/minimal (the dangerous error): ${missedHigh}`);
console.log(`Sent to REVIEW (safety net): ${tiers.reduce((s, t) => s + matrix[t]["REVIEW"], 0)}`);
if (misses.length) console.log("Misses:\n" + misses.join("\n"));
if (right / rows.length < 0.9 || missedHigh > 0) process.exitCode = 1;
