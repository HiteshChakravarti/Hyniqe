// Synthetic benchmark: 10,000-customer legacy → new-core migration with injected defects and harmless format changes
// (date format, number format, Y/N → true/false, case, leading zeros). Scores record-level detection. Run: node bench.ts
import { parseCsv } from "../shared/table.ts";
import { printScores, score } from "../shared/bench.ts";
import { reconcile, SERIOUS } from "./src/reconcile.ts";
import { generate } from "./bench/gen.ts";

const g = generate(2024, 10000);
const r = reconcile(parseCsv(g.source), parseCsv(g.target), { key: ["customer_id"], map: { customer_id: "cust_no", full_name: "customer_name", address_line: "address", postcode: "post_code", date_of_birth: "dob", balance: "balance_amt", marketing_consent: "consent_marketing" }, ignoreLeadingZeros: true, ignoreCase: true });
const gotSerious = new Map<string, Set<string>>();
for (const d of r.diffs) if (SERIOUS.includes(d.kind)) (gotSerious.get(d.key) ?? gotSerious.set(d.key, new Set()).get(d.key)!).add(d.kind);
const scores = [
  score("MISSING records", g.truth.missing, new Set(r.missing)),
  score("EXTRA records", g.truth.extra, new Set(r.extra)),
  score("DUPLICATE keys", g.truth.dupTarget, new Set(r.dupTarget)),
  ...["TRUNCATED", "EMPTIED", "NUMBER_CHANGED", "DATE_CHANGED", "CHANGED"].map((k) => score(k, new Set([...g.truth.serious].filter(([, v]) => v === k).map(([id]) => id)), new Set([...gotSerious].filter(([, v]) => v.has(k)).map(([id]) => id)))),
];
const o = printScores("Migration Reconciler — synthetic benchmark (10,000 customers)", scores);
const harmlessFlagged = r.diffs.filter((d) => SERIOUS.includes(d.kind) && !g.truth.serious.has(d.key)).length;
console.log(`Harmless format changes wrongly reported as real differences: ${harmlessFlagged}`);
if (o.recall < 0.99 || o.precision < 0.99 || harmlessFlagged) process.exitCode = 1;
