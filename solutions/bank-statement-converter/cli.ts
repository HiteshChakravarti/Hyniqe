// Usage: node solutions/bank-statement-converter/cli.ts statement.xml|statement.sta [--out out/statements]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { renderStatementReport, toSpreadsheet } from './src/report.ts';
import { convertStatement } from './src/statement.ts';

const args = process.argv.slice(2);
const i = args.indexOf('--out');
const out = i >= 0 ? args[i + 1] : 'out/bank-statement-converter';
const input = args.find((a, k) => !a.startsWith('--') && args[k - 1] !== '--out');
if (!input) {
  console.error('Usage: node solutions/bank-statement-converter/cli.ts statement.xml [--out dir]');
  process.exit(2);
}
const r = convertStatement(readFileSync(input, 'utf8'));
mkdirSync(out, { recursive: true });
const name = basename(input).replace(/\.[^.]+$/, '');
writeFileSync(join(out, `${name}.csv`), toSpreadsheet(r));
writeFileSync(join(out, `${name}.html`), renderStatementReport(r, { fileName: basename(input) }));
console.log(`${r.format}: ${r.statements.length} statement(s), ${r.transactions.length} transactions. ${r.warnings.length ? r.warnings.join(' ') : 'All balances check out.'}`);
