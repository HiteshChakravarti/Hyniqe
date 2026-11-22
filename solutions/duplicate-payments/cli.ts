// Usage:
//   node solutions/duplicate-payments/cli.ts payments.csv [--client "Name"] [--out out/duplicates] [--window 30]
//   node solutions/duplicate-payments/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from '../shared/csv.ts';
import { findDuplicates } from './src/duplicates.ts';
import { clustersToRows, renderDuplicateReport } from './src/report.ts';
import { generatePayments } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const sample = args.includes('--sample');
if (!input && !sample) {
  console.error('Usage: node solutions/duplicate-payments/cli.ts payments.csv [--client "Name"] [--out dir] [--window days]\n       node solutions/duplicate-payments/cli.ts --sample');
  process.exit(2);
}
const rows = sample ? generatePayments().rows : parseCsv(readFileSync(input!, 'utf8'));
const result = findDuplicates(rows, { windowDays: Number(flag('window') ?? 30) });
const out = flag('out') ?? 'out/duplicate-payments';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'duplicate-payments.html'), renderDuplicateReport({ result, client: flag('client') ?? (sample ? 'Sample data' : undefined) }));
writeFileSync(join(out, 'duplicate-payments.csv'), toCsv(clustersToRows(result), ['group', 'confidence', 'role', 'payment_id', 'vendor', 'invoice', 'payment_date', 'amount', 'currency', 'reasons']));
const high = result.clusters.filter((c) => c.confidence === 'high');
console.log(`Payments checked:       ${result.payments.length}`);
console.log(`High-confidence groups: ${high.length}  at risk: ${Object.entries(result.exposure).map(([c, v]) => `${c} ${(v / 100).toFixed(2)}`).join(', ') || '0'}`);
console.log(`To review (medium):     ${result.clusters.length - high.length}`);
console.log(`Report: ${join(out, 'duplicate-payments.html')}`);
