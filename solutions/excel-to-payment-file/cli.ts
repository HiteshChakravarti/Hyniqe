// Usage: node solutions/excel-to-payment-file/cli.ts payments.csv --name "Company" --iban IBAN [--bic BIC] --date YYYY-MM-DD [--out dir]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from '../shared/csv.ts';
import { buildFromRows } from './src/convert.ts';

const args = process.argv.slice(2);
const flag = (n: string): string | undefined => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!input || !flag('name') || !flag('iban') || !flag('date')) {
  console.error('Usage: node solutions/excel-to-payment-file/cli.ts payments.csv --name "Company" --iban IBAN [--bic BIC] --date YYYY-MM-DD [--out dir]');
  process.exit(2);
}
const r = buildFromRows(parseCsv(readFileSync(input, 'utf8')), { name: flag('name')!, iban: flag('iban')!, bic: flag('bic'), date: flag('date')! });
const out = flag('out') ?? 'out/excel-to-payment-file';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'rows.csv'), toCsv(r.rows.map((x) => ({ ...x, notes: x.notes.join(' ') }))));
if (!r.xml) {
  console.error(r.problems.join('\n'));
  process.exit(1);
}
writeFileSync(join(out, 'payments-pain001.xml'), r.xml);
console.log(`${r.included} of ${r.rows.length} payments in the file, total EUR ${r.total}. Written to ${out}`);
