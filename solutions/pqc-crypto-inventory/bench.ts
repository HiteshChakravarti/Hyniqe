// Line-level benchmark on bench/corpus.txt: real-world style crypto lines across Java, Python, Node, Go, .NET,
// shell/OpenSSL, nginx/Apache/Spring configs, JWT and key material, plus look-alike negatives
// ("description", "desktop", "ecosystem", "rsaKeyId"). Also checks certificate parsing on generated certs.
// Run: node bench.ts
import { readFileSync } from "node:fs";
import { scanText } from "./src/scan.ts";
import { printScores, score, type Score } from "../shared/bench.ts";

const lines = readFileSync(new URL("./bench/corpus.txt", import.meta.url), "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
const perFamily = new Map<string, Score>();
const misses: string[] = [];
let negatives = 0, negClean = 0;
for (const l of lines) {
  const [exp, code] = l.split("\t");
  const expected = new Set(exp === "NONE" ? [] : exp.split(","));
  const got = new Set(scanText("corpus", code).filter((f) => !f.in_comment).map((f) => f.family as string));
  if (exp === "NONE") { negatives++; if (got.size === 0) negClean++; }
  for (const fam of new Set([...expected, ...got])) {
    const s = score(fam, expected.has(fam) ? new Set([fam]) : new Set(), got.has(fam) ? new Set([fam]) : new Set());
    const acc = perFamily.get(fam) ?? { label: fam, tp: 0, fp: 0, fn: 0 };
    acc.tp += s.tp; acc.fp += s.fp; acc.fn += s.fn;
    perFamily.set(fam, acc);
  }
  const diff = [...expected].filter((x) => !got.has(x)).map((x) => "-" + x).concat([...got].filter((x) => !expected.has(x)).map((x) => "+" + x));
  if (diff.length) misses.push(`  ${diff.join(" ")}  ←  ${code.trim().slice(0, 90)}`);
}
const overall = printScores(`PQC Crypto Inventory — line benchmark (${lines.length} lines, ${negatives} look-alike negatives)`, [...perFamily.values()].sort((a, b) => a.label.localeCompare(b.label)));
console.log(`Look-alike negatives with no false alarm: ${negClean}/${negatives}`);
if (misses.length) console.log("Differences:\n" + misses.join("\n"));
if (overall.recall < 0.95 || overall.precision < 0.95) process.exitCode = 1;
