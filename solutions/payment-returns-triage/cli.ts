// Usage: node solutions/payment-returns-triage/cli.ts status.xml|returns.csv [--out dir]
//        node solutions/payment-returns-triage/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toCsv } from '../shared/csv.ts';
import { renderTriageReport } from './src/report.ts';
import { generateStatus } from './src/sample.ts';
import { triage } from './src/triage.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const input = args.find((a, i) => !a.startsWith('--') && i !== oi + 1);
if (!input && !args.includes('--sample')) {
  console.error('Usage: node solutions/payment-returns-triage/cli.ts status.xml|returns.csv [--out dir]');
  process.exit(2);
}
const r = triage(input ? readFileSync(input, 'utf8') : generateStatus().text);
const out = oi >= 0 ? args[oi + 1] : 'out/payment-returns-triage';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'returns.html'), renderTriageReport(r));
writeFileSync(join(out, 'returns.csv'), toCsv([...r.fileLevel, ...r.items] as unknown as Record<string, unknown>[]));
console.log(`${r.items.length} of ${r.total} payments rejected or returned, ${r.groups.length} root causes. Report in ${out}`);
