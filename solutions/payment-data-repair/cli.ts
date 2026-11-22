// Usage: node solutions/payment-data-repair/cli.ts vendors.csv [--client "Name"] [--out out/payment-data-repair]
// For the full agent team with approvals and an audit trail, see engine/ (npm run healthcheck).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from '../shared/csv.ts';
import { renderRepairReport } from './src/report.ts';
import { addressLine, repairRecords } from './src/repair.ts';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!input) {
  console.error('Usage: node solutions/payment-data-repair/cli.ts vendors.csv [--client "Name"] [--out dir]');
  process.exit(2);
}
const summary = repairRecords(parseCsv(readFileSync(input, 'utf8')));
const out = flag('out') ?? 'out/payment-data-repair';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'payment-data-repair.html'), renderRepairReport({ summary, client: flag('client') }));
writeFileSync(
  join(out, 'structured_addresses.csv'),
  toCsv(summary.records.map((r) => ({ id: r.id, name: r.name, decision: r.decision, confidence: r.confidence.toFixed(2), ...r.address, AdrLine: r.address.AdrLine?.join(' | '), structured: addressLine(r.address), issues: [...r.issues, ...r.controls].join('; ') }))),
);
console.log(`Records: ${summary.total}  already structured: ${summary.compliantBefore}  repaired: ${summary.autoRepaired}  review: ${summary.review}  missing data: ${summary.needsData}`);
console.log(`Report: ${join(out, 'payment-data-repair.html')}`);
