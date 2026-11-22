// Checks that every injected defect is counted exactly: blanks, invalid values, style changes,
// repeated identifiers, repeated rows and IBAN/country mismatches.
// Usage: node solutions/data-quality-scorecard/bench.ts [--out out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { scorecard } from './src/profile.ts';
import { generateTable } from './src/sample.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const dims = { blank: [0, 0], invalid: [0, 0], inconsistent: [0, 0], repeated: [0, 0], 'repeated rows': [0, 0], 'IBAN country mismatch': [0, 0] } as Record<string, [number, number]>;
let exactColumns = 0, columns = 0, kindsRight = 0, rows = 0;
const KIND: Record<string, string> = { trade_id: 'id', trade_date: 'date', isin: 'isin', lei: 'lei', currency: 'currency', amount: 'amount', country: 'country', iban: 'iban', bic: 'bic', email: 'email' };
for (const seed of [61, 62, 63, 64, 65, 66]) {
  const g = generateTable({ seed, rows: 500 });
  const s = scorecard(g.rows);
  rows += s.rows;
  for (const c of s.columns) {
    columns++;
    if (c.kind === KIND[c.name]) kindsRight++;
    const t = [g.truth.blank[c.name], g.truth.invalid[c.name], g.truth.inconsistent[c.name], g.truth.duplicates[c.name] ?? 0];
    const m = [c.blank, c.invalid, c.inconsistent, c.duplicates];
    (['blank', 'invalid', 'inconsistent', 'repeated'] as const).forEach((k, i) => { dims[k][0] += t[i]; dims[k][1] += m[i] === t[i] ? t[i] : 0; });
    if (t.every((x, i) => x === m[i])) exactColumns++;
  }
  dims['repeated rows'][0] += g.truth.duplicateRows;
  dims['repeated rows'][1] += s.duplicateRows === g.truth.duplicateRows ? s.duplicateRows : 0;
  const ic = s.cross.find((c) => c.rule.startsWith('IBAN'))?.failed ?? -1;
  dims['IBAN country mismatch'][0] += g.truth.ibanCountry;
  dims['IBAN country mismatch'][1] += ic === g.truth.ibanCountry ? ic : 0;
}
const ok = exactColumns === columns && kindsRight === columns && Object.values(dims).every(([a, b]) => a === b);
const md = [
  `### Data Quality Scorecard benchmark (generated trade tables)`,
  ``,
  `${rows} rows across 6 tables with a known number of defects in each column.`,
  ``,
  `| Defect | Injected | Counted exactly |`,
  `|---|---|---|`,
  ...Object.entries(dims).map(([k, [a, b]]) => `| ${k} | ${a} | ${b} |`),
  ``,
  `**Column types recognised:** ${kindsRight} of ${columns} · **Columns with every count exact:** ${exactColumns} of ${columns}`,
].join('\n');
const out = oi >= 0 ? args[oi + 1] : 'out';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-data-quality.json'), JSON.stringify({ solution: 'data-quality-scorecard', rows, columns, kindsRight, exactColumns, defects: dims, data: 'generated, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-data-quality.md'), md + '\n');
console.log(md);
if (!ok) {
  console.error('Quality gate failed.');
  process.exit(1);
}
