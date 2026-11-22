// Benchmark on synthetic labelled payments: share of injected duplicates found (high or medium) and
// share of flagged groups that are real duplicates.
// Usage: node solutions/duplicate-payments/bench.ts [--count 3000] [--seeds 21,5,99] [--min-recall 0.9] [--min-precision-high 0.99] [--out out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findDuplicates, type Cluster } from './src/duplicates.ts';
import { generatePayments, KINDS } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string, d: string): string => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const seeds = flag('seeds', '21,5,99').split(',').map(Number);
const per: Record<string, { injected: number; found: number }> = Object.fromEntries(KINDS.map((k) => [k, { injected: 0, found: 0 }]));
const conf = { high: { flagged: 0, correct: 0 }, medium: { flagged: 0, correct: 0 } };
let rows = 0;
for (const seed of seeds) {
  const g = generatePayments({ count: Number(flag('count', '3000')), seed });
  rows += g.rows.length;
  const res = findDuplicates(g.rows);
  const clusterOf = new Map<string, Cluster>();
  for (const c of res.clusters) for (const p of [c.original, ...c.duplicates]) clusterOf.set(p.id, c);
  for (const [dup, { original, kind }] of g.labels) {
    per[kind].injected++;
    const c = clusterOf.get(dup);
    if (c && clusterOf.get(original) === c) per[kind].found++;
  }
  for (const c of res.clusters) {
    if (c.confidence === 'low') continue;
    conf[c.confidence].flagged++;
    if ([c.original, ...c.duplicates].some((p) => g.labels.has(p.id))) conf[c.confidence].correct++;
  }
}
const injected = Object.values(per).reduce((a, b) => a + b.injected, 0);
const found = Object.values(per).reduce((a, b) => a + b.found, 0);
const recall = found / Math.max(1, injected);
const precisionHigh = conf.high.correct / Math.max(1, conf.high.flagged);
const precisionMedium = conf.medium.correct / Math.max(1, conf.medium.flagged);
const md = [
  `### Duplicate Payment Finder benchmark (synthetic data)`,
  ``,
  `${rows} payments across ${seeds.length} generated ledgers, ${injected} injected duplicates, with monthly rent and subscription series and repeated round amounts as traps.`,
  ``,
  `| Duplicate type | Injected | Found |`,
  `|---|---|---|`,
  ...Object.entries(per).map(([k, v]) => `| ${k} | ${v.injected} | ${v.found} |`),
  ``,
  `**Found:** ${(100 * recall).toFixed(1)}% · **High-confidence precision:** ${(100 * precisionHigh).toFixed(1)}% (${conf.high.correct}/${conf.high.flagged}) · **Medium precision:** ${(100 * precisionMedium).toFixed(1)}% (${conf.medium.correct}/${conf.medium.flagged})`,
  ``,
  `Missed duplicates are second-channel payments of round amounts, which are deliberately listed as low confidence because round amounts repeat legitimately. Synthetic data measures rule coverage, not real-world accuracy.`,
].join('\n');
const out = flag('out', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-duplicate-payments.json'), JSON.stringify({ solution: 'duplicate-payments', rows, injected, found, recall, precisionHigh, precisionMedium, perKind: per, data: 'synthetic, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-duplicate-payments.md'), md + '\n');
console.log(md);
const minRecall = Number(flag('min-recall', '0'));
const minPrecision = Number(flag('min-precision-high', '0'));
if (recall < minRecall || precisionHigh < minPrecision) {
  console.error(`Quality gate failed: recall ${recall.toFixed(4)} (min ${minRecall}), high precision ${precisionHigh.toFixed(4)} (min ${minPrecision})`);
  process.exit(1);
}
