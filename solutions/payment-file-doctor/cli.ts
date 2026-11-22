// Usage: node solutions/payment-file-doctor/cli.ts payments.xml [--version 09|03] [--out out/payment-file-doctor]
//        node solutions/payment-file-doctor/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { toCsv } from '../shared/csv.ts';
import { diagnose } from './src/doctor.ts';
import { renderDoctorReport } from './src/report.ts';
import { generatePaymentFile } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string): string | undefined => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const sample = args.includes('--sample');
if (!input && !sample) {
  console.error('Usage: node solutions/payment-file-doctor/cli.ts payments.xml [--version 09|03] [--out dir]\n       node solutions/payment-file-doctor/cli.ts --sample');
  process.exit(2);
}
const xml = sample ? generatePaymentFile().xml : readFileSync(input!, 'utf8');
const r = diagnose(xml, { target: flag('version') === '03' ? '03' : '09' });
const out = flag('out') ?? 'out/payment-file-doctor';
mkdirSync(out, { recursive: true });
const name = sample ? 'sample.xml' : basename(input!);
if (r.fixedXml) writeFileSync(join(out, name.replace(/\.xml$/i, '') + '-fixed.xml'), r.fixedXml);
writeFileSync(join(out, 'payment-file-report.html'), renderDoctorReport(r, { fileName: name }));
writeFileSync(join(out, 'payment-file-findings.csv'), toCsv(r.findings as unknown as Record<string, unknown>[], ['level', 'fixed', 'code', 'where', 'message', 'action']));
console.log(`Payments: ${r.totals.count}  version ${r.versionFound} -> ${r.versionOut}  fixed: ${r.fixedCount}  errors left: ${r.errorsLeft}`);
console.log(`Corrected file and report written to ${out}`);
