// Usage: node solutions/e-invoice-checker/cli.ts invoice.xml|invoice.pdf [--out dir]
//        node solutions/e-invoice-checker/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { toCsv } from '../shared/csv.ts';
import { checkFile } from './src/check.ts';
import { renderInvoiceReport } from './src/report.ts';
import { generateInvoice } from './src/sample.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const input = args.find((a, i) => !a.startsWith('--') && i !== oi + 1);
if (!input && !args.includes('--sample')) {
  console.error('Usage: node solutions/e-invoice-checker/cli.ts invoice.xml|invoice.pdf [--out dir]');
  process.exit(2);
}
const r = await checkFile(input ? new Uint8Array(readFileSync(input)) : generateInvoice(3, 'BR-S-09'));
const out = oi >= 0 ? args[oi + 1] : 'out/e-invoice-checker';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'e-invoice-check.html'), renderInvoiceReport(r, { fileName: input ? basename(input) : 'sample invoice' }));
writeFileSync(join(out, 'e-invoice-lines.csv'), toCsv(r.invoice.lines.map((l) => ({ line: l.id, item: l.name, quantity: l.quantity ?? '', unit: l.unit, price: l.price ?? '', vat_category: l.category, vat_rate: l.rate ?? '', net: l.net ?? '' }))));
console.log(`${r.standard}: ${r.errors} errors, ${r.warnings} warnings. Report in ${out}`);
for (const f of r.findings) console.log(`${f.level.toUpperCase()} ${f.rule}: ${f.message}`);
if (r.errors) process.exitCode = 1;
