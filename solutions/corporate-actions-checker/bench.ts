// Benchmark on generated notices from two or three sources with labelled disagreements.
// Usage: node solutions/corporate-actions-checker/bench.ts [--out out] [--min-detect 0.99]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkEvents } from './src/events.ts';
import { EXPECT, generateNotices, INJECTED } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string, d: string): string => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const today = new Date(Date.UTC(2026, 10, 22));
const per: Record<string, { injected: number; detected: number }> = Object.fromEntries(INJECTED.map((k) => [k, { injected: 0, detected: 0 }]));
let clean = 0;
let falseFlags = 0;
let groupingErrors = 0;
let notices = 0;
for (const seed of [11, 12, 13, 14, 15, 16]) {
  const g = generateNotices({ seed, events: 60 });
  notices += g.rows.length;
  const r = checkEvents(g.rows, { today });
  if (r.events.length !== g.events) groupingErrors++;
  for (const ev of r.events) {
    const lab = g.labels.get(`${ev.isin}|${ev.eventType}`);
    const fs = r.findings.filter((f) => f.eventKey === ev.key && f.severity !== 'info');
    if (lab) {
      per[lab].injected++;
      const [code, field] = EXPECT[lab];
      if (fs.some((f) => f.code === code && f.field === field)) per[lab].detected++;
    } else {
      clean++;
      if (fs.length) falseFlags++;
    }
  }
}
const injected = Object.values(per).reduce((a, b) => a + b.injected, 0);
const detected = Object.values(per).reduce((a, b) => a + b.detected, 0);
const detect = detected / Math.max(1, injected);
const md = [
  `### Corporate Actions Checker benchmark (generated notices)`,
  ``,
  `${notices} notices for 360 events from two or three sources each, ${injected} events with an injected problem, ${clean} clean events (some with harmless format differences between sources).`,
  ``,
  `| Problem | Injected | Found |`,
  `|---|---|---|`,
  ...Object.entries(per).map(([k, v]) => `| ${k.toLowerCase().replace(/_/g, ' ')} | ${v.injected} | ${v.detected} |`),
  ``,
  `**Found:** ${(100 * detect).toFixed(1)}% · **False flags on clean events:** ${falseFlags} of ${clean} · **Events grouped correctly:** ${groupingErrors ? 'no' : 'yes'}`,
].join('\n');
const out = flag('out', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-corporate-actions.json'), JSON.stringify({ solution: 'corporate-actions-checker', notices, injected, detected, detect, clean, falseFlags, groupingErrors, perProblem: per, data: 'generated, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-corporate-actions.md'), md + '\n');
console.log(md);
if (detect < Number(flag('min-detect', '0')) || falseFlags > 0 || groupingErrors > 0) {
  console.error('Quality gate failed.');
  process.exit(1);
}
