// Benchmark on generated vendor masters with labelled defects and harmless format differences.
// Usage: node solutions/vendor-master-cleanup/bench.ts [--out out] [--min-detect 0.99]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateVendors, INJECTED } from './src/sample.ts';
import { cleanupVendors } from './src/vendors.ts';

const args = process.argv.slice(2);
const flag = (n: string, d: string): string => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const per: Record<string, { injected: number; detected: number }> = Object.fromEntries(INJECTED.map((k) => [k, { injected: 0, detected: 0 }]));
let records = 0, clean = 0, falseFlags = 0;
for (const seed of [31, 32, 33, 34, 35, 36]) {
  const g = generateVendors({ seed, count: 300 });
  const r = cleanupVendors(g.rows);
  records += r.vendors.length;
  const involved = new Set<string>();
  for (const [id, l] of g.labels) {
    involved.add(id);
    if (l.other) involved.add(l.other);
    per[l.kind].injected++;
    if (r.findings.some((f) => f.code === l.kind && f.ids.includes(id) && (!l.other || f.ids.includes(l.other)))) per[l.kind].detected++;
  }
  for (const v of r.vendors) {
    if (involved.has(v.id)) continue;
    clean++;
    if (r.findings.some((f) => f.severity !== 'info' && f.ids.includes(v.id))) falseFlags++;
  }
}
const injected = Object.values(per).reduce((a, b) => a + b.injected, 0);
const detected = Object.values(per).reduce((a, b) => a + b.detected, 0);
const detect = detected / Math.max(1, injected);
const md = [
  `### Vendor Master Cleanup benchmark (generated vendor masters)`,
  ``,
  `${records} supplier records, ${injected} with an injected problem, ${clean} clean records (some with spaced or lower-case IBANs and VAT numbers, and similar-sounding names).`,
  ``,
  `| Problem | Injected | Found |`,
  `|---|---|---|`,
  ...Object.entries(per).map(([k, v]) => `| ${k.toLowerCase().replace(/_/g, ' ')} | ${v.injected} | ${v.detected} |`),
  ``,
  `**Found:** ${(100 * detect).toFixed(1)}% · **False flags on clean records:** ${falseFlags} of ${clean}`,
].join('\n');
const out = flag('out', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-vendor-master.json'), JSON.stringify({ solution: 'vendor-master-cleanup', records, injected, detected, detect, clean, falseFlags, perProblem: per, data: 'generated, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-vendor-master.md'), md + '\n');
console.log(md);
if (detect < Number(flag('min-detect', '0')) || falseFlags > 0) {
  console.error('Quality gate failed.');
  process.exit(1);
}
