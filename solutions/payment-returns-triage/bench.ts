// Checks that every rejected or returned payment is read correctly from five formats.
// Usage: node solutions/payment-returns-triage/bench.ts [--out out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FORMATS, generateStatus } from './src/sample.ts';
import { triage } from './src/triage.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const per: Record<string, { returns: number; read: number; extra: number }> = {};
for (const f of FORMATS) {
  per[f] = { returns: 0, read: 0, extra: 0 };
  for (const seed of [51, 52, 53, 54]) {
    const g = generateStatus({ seed, format: f, count: 80 });
    const r = triage(g.text);
    per[f].returns += g.truth.length;
    per[f].extra += Math.max(0, r.items.length - g.truth.length);
    for (const t of g.truth) if (r.items.some((i) => i.ref === t.ref && i.code === t.code && i.name === t.name && i.currency === t.currency && Math.abs((i.amount ?? -1) - t.amount) < 0.005)) per[f].read++;
  }
}
const returns = Object.values(per).reduce((a, b) => a + b.returns, 0);
const read = Object.values(per).reduce((a, b) => a + b.read, 0);
const extra = Object.values(per).reduce((a, b) => a + b.extra, 0);
const md = [
  `### Returns and Rejects Triage benchmark (generated status reports)`,
  ``,
  `| Format | Returns | Read correctly |`,
  `|---|---|---|`,
  ...Object.entries(per).map(([k, v]) => `| ${k} | ${v.returns} | ${v.read} |`),
  ``,
  `**Read correctly (reference, reason code, beneficiary, amount, currency):** ${((100 * read) / returns).toFixed(1)}% · **Accepted payments reported as returns:** ${extra}`,
].join('\n');
const out = oi >= 0 ? args[oi + 1] : 'out';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-returns.json'), JSON.stringify({ solution: 'payment-returns-triage', returns, read, accuracy: read / returns, extra, perFormat: per, data: 'generated, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-returns.md'), md + '\n');
console.log(md);
if (read !== returns || extra > 0) {
  console.error('Quality gate failed.');
  process.exit(1);
}
