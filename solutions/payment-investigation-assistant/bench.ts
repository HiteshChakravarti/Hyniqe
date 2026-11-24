// Classification benchmark on bench/cases.txt (40 hand-written queries, written before the first run). Run: node bench.ts
import { readFileSync } from "node:fs";
import { analyse } from "./src/investigate.ts";

const lines = readFileSync(new URL("./bench/cases.txt", import.meta.url), "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
let right = 0, missedFraud = 0;
const misses: string[] = [];
for (const l of lines) {
  const [exp, text] = l.split("\t");
  const got = analyse(text).type;
  if (got === exp) right++; else misses.push(`  expected ${exp}, got ${got}  ←  ${text}`);
  if (exp === "RECALL_FRAUD" && got !== "RECALL_FRAUD") missedFraud++;
}
console.log(`\nPayment Investigation Assistant — case-type accuracy: ${((right / lines.length) * 100).toFixed(1)}% (${right}/${lines.length})`);
console.log(`Fraud recalls not recognised as urgent fraud (the dangerous error): ${missedFraud}`);
if (misses.length) console.log("Misses:\n" + misses.join("\n"));
if (missedFraud) process.exitCode = 1;
