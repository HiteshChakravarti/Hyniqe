// Usage:
//   node solutions/ssi-checker/cli.ts ssis.csv [--golden golden.csv] [--client "Name"] [--out out/ssi] [--max-age 365]
//   node solutions/ssi-checker/cli.ts --sample [--out out/ssi]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, toCsv } from '../shared/csv.ts';
import { renderSsiReport } from './src/report.ts';
import { generateSsis } from './src/sample.ts';
import { checkSsis, compareSsis } from './src/ssi.ts';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const out = flag('out') ?? 'out/ssi-checker';
const sample = args.includes('--sample');
if (!input && !sample) {
  console.error('Usage: node solutions/ssi-checker/cli.ts ssis.csv [--golden golden.csv] [--client "Name"] [--out dir] [--max-age days]\n       node solutions/ssi-checker/cli.ts --sample');
  process.exit(2);
}

let rows, golden;
let asOf = new Date();
if (sample) {
  const g = generateSsis({ count: 400 });
  rows = g.rows;
  golden = g.golden;
  asOf = new Date(Date.UTC(2026, 10, 1));
} else {
  rows = parseCsv(readFileSync(input!, 'utf8'));
  const gp = flag('golden');
  golden = gp ? parseCsv(readFileSync(gp, 'utf8')) : null;
}

const check = checkSsis(rows, { asOf, maxAgeDays: Number(flag('max-age') ?? 365) });
const compare = golden ? compareSsis(rows, golden) : null;
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'ssi-readiness.html'), renderSsiReport({ check, compare, client: flag('client') ?? (sample ? 'Sample data' : undefined), asOf }));
const findings = [...check.findings, ...(compare?.findings ?? [])];
writeFileSync(join(out, 'ssi-issues.csv'), toCsv(findings as unknown as Record<string, unknown>[], ['ssiId', 'counterparty', 'market', 'field', 'severity', 'code', 'message', 'fix']));
const blocking = new Set(findings.filter((f) => f.severity !== 'info').map((f) => f.ssiId));
const ready = check.ssis.filter((s) => !blocking.has(s.id)).length;
console.log(`SSIs checked: ${check.ssis.length}`);
console.log(`T+1 ready:    ${ready} (${((100 * ready) / Math.max(1, check.ssis.length)).toFixed(1)}%)`);
console.log(`Would fail:   ${new Set(findings.filter((f) => f.severity === 'error').map((f) => f.ssiId)).size}`);
if (compare) console.log(`Compared with golden source: ${compare.compared}, fully matching: ${compare.matched}`);
console.log(`Report:       ${join(out, 'ssi-readiness.html')}`);
console.log(`Issues CSV:   ${join(out, 'ssi-issues.csv')}`);
