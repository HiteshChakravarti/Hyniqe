// Usage: node solutions/corporate-actions-checker/cli.ts notices.csv [--days 3] [--out dir]
//        node solutions/corporate-actions-checker/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from '../shared/csv.ts';
import { checkEvents } from './src/events.ts';
import { renderEventsReport } from './src/report.ts';
import { generateNotices } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string): string | undefined => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const sample = args.includes('--sample');
if (!input && !sample) {
  console.error('Usage: node solutions/corporate-actions-checker/cli.ts notices.csv [--days 3] [--out dir]');
  process.exit(2);
}
const rows = sample ? generateNotices().rows : parseCsv(readFileSync(input!, 'utf8'));
const r = checkEvents(rows, { today: sample ? new Date(Date.UTC(2026, 10, 22)) : undefined, minBusinessDays: Number(flag('days') ?? 3) });
const out = flag('out') ?? 'out/corporate-actions-checker';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'corporate-actions.html'), renderEventsReport(r));
writeFileSync(join(out, 'corporate-actions-findings.csv'), toCsv(r.findings as unknown as Record<string, unknown>[]));
console.log(`${r.events.length} events, ${r.events.filter((e) => e.status === 'disagree').length} with disagreements, ${r.findings.length} findings. Report in ${out}`);
