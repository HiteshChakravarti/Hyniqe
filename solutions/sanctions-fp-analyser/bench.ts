// Benchmark on synthetic alert logs (3 seeds × 3,000 alerts, invented names) with planted drivers. Checks that
// (1) every planted driver is found, and (2) the safety rule holds: no driver or good-guy pair containing a true match is
// ever proposed as safe, including a variant where true matches are planted inside a noisy driver. Run: node bench.ts
import { parseCsv } from "../shared/table.ts";
import { analyse, readAlerts } from "./src/analyse.ts";
import { generate } from "./bench/gen.ts";

let found = 0, expected = 0, unsafeProposed = 0, checks = 0;
for (const seed of [1, 2, 3]) {
  const { csv, truth } = generate(seed, 3000);
  const a = analyse(readAlerts(parseCsv(csv)));
  const ids = new Set(a.drivers.map((d) => d.id));
  for (const id of ["REPEAT_PAIRS", "FIELD_ADDRESS_LOCATION", "WEAK_TOKENS", "LOW_SCORE_BANDS", "NO_ALERT_MEMORY"]) { expected++; if (ids.has(id)) found++; else console.log(`  seed ${seed}: missed ${id}`); }
  expected++; if ([...ids].some((i) => i === "STATEMENT_MESSAGES")) found++; else console.log(`  seed ${seed}: missed STATEMENT_MESSAGES`);
  for (const p of truth.repeatPairs) { expected++; if (a.goodGuys.some((g) => g.screened === p)) found++; else console.log(`  seed ${seed}: good-guy pair missing for ${p}`); }
  // safety variant: plant true matches inside the address driver and inside a repeat pair
  const poisoned = csv + `X1,2026-05-01,"9 Cuban Avenue","Cuban Avenue Holdings",OFAC SDN,97,address,pacs.008,true match,40,CX1\nX2,2026-05-02,"Viktor Drazen","Viktor Drazhenko",OFAC SDN,95,name,pacs.008,true match,40,C-13\n`;
  const b = analyse(readAlerts(parseCsv(poisoned)));
  for (const d of b.drivers) { checks++; if (d.safe && d.trues > 0) unsafeProposed++; }
  checks++; if (b.drivers.find((d) => d.id === "FIELD_ADDRESS_LOCATION")?.safe !== false) unsafeProposed++;
  checks++; if (b.goodGuys.some((g) => g.screened === "Viktor Drazen" && g.list === "OFAC SDN")) unsafeProposed++;
}
console.log(`\nSanctions FP Analyser — planted drivers found: ${found}/${expected} (${((found / expected) * 100).toFixed(1)}%)`);
console.log(`Safety: groups containing a true match proposed as safe: ${unsafeProposed} (of ${checks} checks)`);
if (found < expected || unsafeProposed) process.exitCode = 1;
