// Usage: node solutions/bank-detail-change-check/cli.ts run.csv --trusted vendors-or-history.csv [--large 10000] [--out dir]
//        node solutions/bank-detail-change-check/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from '../shared/csv.ts';
import { checkRun } from './src/check.ts';
import { renderCheckReport } from './src/report.ts';
import { generateRun } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string): string | undefined => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
let run, trusted, today;
if (args.includes('--sample')) {
  const g = generateRun();
  [run, trusted, today] = [g.run, g.history, g.today];
} else if (input && flag('trusted')) {
  run = parseCsv(readFileSync(input, 'utf8'));
  trusted = parseCsv(readFileSync(flag('trusted')!, 'utf8'));
} else {
  console.error('Usage: node solutions/bank-detail-change-check/cli.ts run.csv --trusted vendors-or-history.csv [--large 10000] [--out dir]');
  process.exit(2);
}
const r = checkRun(run, trusted, { largeAmount: Number(flag('large') ?? 10000), today });
const out = flag('out') ?? 'out/bank-detail-change-check';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'bank-detail-check.html'), renderCheckReport(r));
writeFileSync(join(out, 'bank-detail-check.csv'), toCsv(r.payments.map((p) => ({ row: p.row, risk: p.risk, payee: p.payee, payee_id: p.payeeId, amount: p.amount ?? '', currency: p.currency, findings: p.findings.map((f) => f.message).join(' | ') }))));
console.log(`${r.stop} to stop, ${r.check} to check, ${r.ok} normal. Report in ${out}`);
if (r.stop) process.exitCode = 1;
