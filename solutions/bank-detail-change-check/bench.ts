// Benchmark on generated payment runs with labelled redirection patterns and harmless format differences.
// Usage: node solutions/bank-detail-change-check/bench.ts [--out out] [--min-detect 0.99]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkRun } from './src/check.ts';
import { generateRun, INJECTED } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string, d: string): string => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const per: Record<string, { injected: number; detected: number }> = Object.fromEntries(INJECTED.map((k) => [k, { injected: 0, detected: 0 }]));
let payments = 0, clean = 0, falseFlags = 0;
for (const seed of [71, 72, 73, 74, 75, 76, 77, 78]) {
  const g = generateRun({ seed });
  const r = checkRun(g.run, g.history, { today: g.today });
  payments += r.payments.length;
  r.payments.forEach((p, i) => {
    const l = g.labels.get(i);
    if (l) {
      per[l].injected++;
      if (p.risk !== 'ok' && p.findings.some((f) => f.code === l)) per[l].detected++;
    } else {
      clean++;
      if (p.risk !== 'ok') falseFlags++;
    }
  });
}
const injected = Object.values(per).reduce((a, b) => a + b.injected, 0);
const detected = Object.values(per).reduce((a, b) => a + b.detected, 0);
const detect = detected / Math.max(1, injected);
const md = [
  `### Bank Detail Change Check benchmark (generated payment runs)`,
  ``,
  `${payments} payments checked against earlier payment history, ${injected} with an injected redirection pattern, ${clean} normal payments (some with spaced IBANs and upper-case names).`,
  ``,
  `| Pattern | Injected | Found |`,
  `|---|---|---|`,
  ...Object.entries(per).map(([k, v]) => `| ${k.toLowerCase().replace(/_/g, ' ')} | ${v.injected} | ${v.detected} |`),
  ``,
  `**Found:** ${(100 * detect).toFixed(1)}% · **Normal payments flagged:** ${falseFlags} of ${clean}`,
].join('\n');
const out = flag('out', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-bank-detail-change.json'), JSON.stringify({ solution: 'bank-detail-change-check', payments, injected, detected, detect, clean, falseFlags, perPattern: per, data: 'generated, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-bank-detail-change.md'), md + '\n');
console.log(md);
if (detect < Number(flag('min-detect', '0')) || falseFlags > 0) {
  console.error('Quality gate failed.');
  process.exit(1);
}
