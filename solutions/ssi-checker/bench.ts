// Benchmark: detection rate per defect type and false-flag rate on clean SSIs, on synthetic labelled data.
// Usage: node solutions/ssi-checker/bench.ts [--count 2000] [--seed 11] [--min-recall 0.99] [--max-false 0.01] [--out out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateSsis, INJECTED } from './src/sample.ts';
import { checkSsis, compareSsis } from './src/ssi.ts';
import { label } from './src/report.ts';

const args = process.argv.slice(2);
const flag = (n: string, d: string): string => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const g = generateSsis({ count: Number(flag('count', '2000')), seed: Number(flag('seed', '11')) });
const check = checkSsis(g.rows, { asOf: new Date(Date.UTC(2026, 10, 1)) });
const compare = compareSsis(g.rows, g.golden);
const flagged = new Map<string, Set<string>>();
for (const f of [...check.findings, ...compare.findings]) {
  if (f.severity === 'info') continue;
  if (!flagged.has(f.ssiId)) flagged.set(f.ssiId, new Set());
  flagged.get(f.ssiId)!.add(f.code);
}
const per: Record<string, { injected: number; detected: number }> = Object.fromEntries(INJECTED.map((c) => [c, { injected: 0, detected: 0 }]));
let clean = 0;
let falseFlags = 0;
for (const r of g.rows) {
  const lab = g.labels.get(r.ssi_id);
  const got = flagged.get(r.ssi_id);
  if (!lab) {
    clean++;
    if (got) falseFlags++;
  } else {
    per[lab].injected++;
    if (got?.has(lab)) per[lab].detected++;
  }
}
const injected = Object.values(per).reduce((a, b) => a + b.injected, 0);
const detected = Object.values(per).reduce((a, b) => a + b.detected, 0);
const recall = detected / Math.max(1, injected);
const falseRate = falseFlags / Math.max(1, clean);
const summary = { solution: 'ssi-checker', rows: g.rows.length, clean, injected, detected, recall, falseFlags, falseRate, perDefect: per, data: 'synthetic, labelled' };
const md = [
  `### SSI Checker benchmark (synthetic data)`,
  ``,
  `${g.rows.length} SSIs, ${injected} with one injected defect, ${clean} clean (including cosmetic variations that must not be flagged).`,
  ``,
  `| Defect | Injected | Detected |`,
  `|---|---|---|`,
  ...Object.entries(per).map(([c, v]) => `| ${label(c)} | ${v.injected} | ${v.detected} |`),
  ``,
  `**Detection rate:** ${(100 * recall).toFixed(1)}% · **False flags on clean SSIs:** ${falseFlags} of ${clean} (${(100 * falseRate).toFixed(2)}%)`,
  ``,
  `Synthetic data measures rule coverage, not real-world accuracy; a Health Check on real SSIs is the real test.`,
].join('\n');
const out = flag('out', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-ssi-checker.json'), JSON.stringify(summary, null, 2));
writeFileSync(join(out, 'benchmark-ssi-checker.md'), md + '\n');
console.log(md);
const minRecall = Number(flag('min-recall', '0'));
const maxFalse = Number(flag('max-false', '1'));
if (recall < minRecall || falseRate > maxFalse) {
  console.error(`Quality gate failed: recall ${recall.toFixed(4)} (min ${minRecall}), false rate ${falseRate.toFixed(4)} (max ${maxFalse})`);
  process.exit(1);
}
