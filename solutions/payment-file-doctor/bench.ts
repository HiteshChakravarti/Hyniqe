// Benchmark on generated payment files with labelled defects:
// detection (every injected defect is reported), repair (a second pass over the fixed file finds
// only the defects that cannot be fixed automatically) and false alarms on clean version 9 files.
// Usage: node solutions/payment-file-doctor/bench.ts [--files 60] [--out out] [--min-detect 0.99] [--min-repair 0.95]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { diagnose } from './src/doctor.ts';
import { DEFECTS, EXPECTED, FIXABLE, generatePaymentFile } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string, d: string): string => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const today = new Date(Date.UTC(2026, 10, 22));
const files = Number(flag('files', '60'));
const per: Record<string, { injected: number; detected: number; fixable: number; repaired: number }> = Object.fromEntries(DEFECTS.map((d) => [d, { injected: 0, detected: 0, fixable: 0, repaired: 0 }]));
let fileLevel = 0;
let fileLevelOk = 0;
let cleanFiles = 0;
let falseAlarms = 0;
for (let k = 0; k < files; k++) {
  const f = generatePaymentFile({ seed: 1000 + k, count: 30 });
  const r = diagnose(f.xml, { today });
  const second = diagnose(r.fixedXml!, { today });
  // File-level defects: version 3 and wrong header totals.
  fileLevel++;
  if (r.findings.some((x) => x.code === 'VERSION') && r.findings.some((x) => x.code === 'CONTROL_SUM') && !second.findings.some((x) => ['VERSION', 'COUNT', 'CONTROL_SUM'].includes(x.code))) fileLevelOk++;
  for (const [e2e, d] of f.labels) {
    const where = (x: { where: string }): boolean => x.where.includes(`(${e2e})`);
    per[d].injected++;
    if (r.findings.some((x) => where(x) && x.code === EXPECTED[d])) per[d].detected++;
    if (FIXABLE[d]) {
      per[d].fixable++;
      if (!second.findings.some((x) => where(x) && x.code === EXPECTED[d] && !x.fixed)) per[d].repaired++;
    }
  }
  // Clean file in the target version: nothing should be reported.
  const clean = generatePaymentFile({ seed: 5000 + k, count: 30, version: '09', defectRate: 0, headerWrong: false });
  cleanFiles++;
  if (diagnose(clean.xml, { today }).findings.length) falseAlarms++;
}
const injected = Object.values(per).reduce((a, b) => a + b.injected, 0);
const detected = Object.values(per).reduce((a, b) => a + b.detected, 0);
const fixable = Object.values(per).reduce((a, b) => a + b.fixable, 0);
const repaired = Object.values(per).reduce((a, b) => a + b.repaired, 0);
const detect = detected / Math.max(1, injected);
const repair = repaired / Math.max(1, fixable);
const md = [
  `### Payment File Doctor benchmark (generated files)`,
  ``,
  `${files} version 3 files with wrong header totals and ${injected} injected payment defects, plus ${cleanFiles} clean version 9 files.`,
  ``,
  `| Defect | Injected | Reported | Fixed automatically |`,
  `|---|---|---|---|`,
  ...Object.entries(per).map(([d, v]) => `| ${d.toLowerCase().replace(/_/g, ' ')} | ${v.injected} | ${v.detected} | ${v.fixable ? `${v.repaired} of ${v.fixable}` : 'not fixable (reported)'} |`),
  ``,
  `**Reported:** ${(100 * detect).toFixed(1)}% · **Repaired:** ${(100 * repair).toFixed(1)}% of fixable defects · **Version and totals fixed:** ${fileLevelOk} of ${fileLevel} files · **False alarms on clean files:** ${falseAlarms} of ${cleanFiles}`,
  ``,
  `Generated files test the rules, not every bank's own extra requirements.`,
].join('\n');
const out = flag('out', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-payment-file-doctor.json'), JSON.stringify({ solution: 'payment-file-doctor', files, injected, detected, detect, fixable, repaired, repair, fileLevel, fileLevelOk, cleanFiles, falseAlarms, perDefect: per, data: 'generated, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-payment-file-doctor.md'), md + '\n');
console.log(md);
if (detect < Number(flag('min-detect', '0')) || repair < Number(flag('min-repair', '0')) || falseAlarms > 0 || fileLevelOk < fileLevel) {
  console.error('Quality gate failed.');
  process.exit(1);
}
