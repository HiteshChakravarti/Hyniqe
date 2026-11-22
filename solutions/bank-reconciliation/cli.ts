// Usage: node solutions/bank-reconciliation/cli.ts statement.(xml|sta|mt940|csv) --ledger ledger.csv [--window 5] [--out dir]
//        node solutions/bank-reconciliation/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toCamt053 } from '../bank-statement-converter/src/sample.ts';
import { toCsv } from '../shared/csv.ts';
import { money, reconcile } from './src/recon.ts';
import { matchRows, renderReconReport } from './src/report.ts';
import { generatePair, ledgerCsv } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string): string | undefined => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
let bankText: string, ledgerText: string;
if (args.includes('--sample')) {
  const g = generatePair();
  [bankText, ledgerText] = [toCamt053(g.statement), ledgerCsv(g)];
} else if (input && flag('ledger')) {
  bankText = readFileSync(input, 'utf8');
  ledgerText = readFileSync(flag('ledger')!, 'utf8');
} else {
  console.error('Usage: node solutions/bank-reconciliation/cli.ts statement.(xml|mt940|csv) --ledger ledger.csv [--window 5] [--out dir]');
  process.exit(2);
}
const r = reconcile(bankText, ledgerText, { windowDays: Number(flag('window') ?? 5) });
const out = flag('out') ?? 'out/bank-reconciliation';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'bank-reconciliation.html'), renderReconReport(r));
writeFileSync(join(out, 'bank-reconciliation.csv'), toCsv(matchRows(r)));
for (const w of r.warnings) console.warn(w);
console.log(`${r.bank.length - r.openBank.length} of ${r.bank.length} bank lines matched. ${r.openBank.length} to post (${money(r.totals.openBank)}), ${r.openLedger.length} ledger entries not on the statement (${money(r.totals.openLedger)}). Unexplained: ${money(r.totals.unexplained)}. Report in ${out}`);
