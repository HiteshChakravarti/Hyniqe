// Usage: node solutions/data-quality-scorecard/cli.ts table.csv [--out dir]
//        node solutions/data-quality-scorecard/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseCsv, toCsv } from '../shared/csv.ts';
import { scorecard } from './src/profile.ts';
import { renderScorecard } from './src/report.ts';
import { generateTable } from './src/sample.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const input = args.find((a, i) => !a.startsWith('--') && i !== oi + 1);
if (!input && !args.includes('--sample')) {
  console.error('Usage: node solutions/data-quality-scorecard/cli.ts table.csv [--out dir]');
  process.exit(2);
}
const s = scorecard(input ? parseCsv(readFileSync(input, 'utf8')) : generateTable().rows);
const out = oi >= 0 ? args[oi + 1] : 'out/data-quality-scorecard';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'scorecard.html'), renderScorecard(s, { fileName: input ? basename(input) : 'sample trades' }));
writeFileSync(join(out, 'scorecard-columns.csv'), toCsv(s.columns.map((c) => ({ column: c.name, holds: c.kind, blank: c.blank, invalid: c.invalid, repeated: c.duplicates, inconsistent: c.inconsistent, score: Math.round(100 * c.score) }))));
console.log(`Score ${s.score}/100 (grade ${s.grade}) for ${s.rows} rows. Report in ${out}`);
