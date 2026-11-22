// Usage: node solutions/vendor-master-cleanup/cli.ts vendors.csv [--out dir]
//        node solutions/vendor-master-cleanup/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from '../shared/csv.ts';
import { renderVendorReport } from './src/report.ts';
import { generateVendors } from './src/sample.ts';
import { cleanupVendors } from './src/vendors.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const input = args.find((a, i) => !a.startsWith('--') && i !== oi + 1);
if (!input && !args.includes('--sample')) {
  console.error('Usage: node solutions/vendor-master-cleanup/cli.ts vendors.csv [--out dir]');
  process.exit(2);
}
const rows = input ? parseCsv(readFileSync(input, 'utf8')) : generateVendors({ count: 120 }).rows;
const r = cleanupVendors(rows);
const out = oi >= 0 ? args[oi + 1] : 'out/vendor-master-cleanup';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'vendor-cleanup.html'), renderVendorReport(r));
writeFileSync(join(out, 'vendor-findings.csv'), toCsv(r.findings.map((f) => ({ severity: f.severity, code: f.code, records: f.ids.join(' '), message: f.message, action: f.action }))));
console.log(`${r.vendors.length} records, ${r.clusters.length} duplicate suppliers, ${r.affected} records to fix. Report in ${out}`);
