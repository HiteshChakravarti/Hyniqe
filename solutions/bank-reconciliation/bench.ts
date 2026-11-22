// Benchmark on generated statement + ledger pairs with labelled answers, in all three statement formats.
// Usage: node solutions/bank-reconciliation/bench.ts [--out out] [--min-correct 0.99]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toCamt053, toMt940 } from '../bank-statement-converter/src/sample.ts';
import { reconcile } from './src/recon.ts';
import { generatePair, KINDS, ledgerCsv, statementCsv, statementCsvNoNames, type Kind } from './src/sample.ts';

const args = process.argv.slice(2);
const flag = (n: string, d: string): string => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const per: Record<Kind, { total: number; correct: number }> = Object.fromEntries(KINDS.map((k) => [k, { total: 0, correct: 0 }])) as never;
let bankLines = 0, correct = 0, wrong = 0, decoysTaken = 0, decoys = 0, unexplained = 0, runs = 0;
const formats = { camt: toCamt053, mt940: toMt940, csv: statementCsv, csvNoNames: statementCsvNoNames };
for (const seed of [31, 32, 33, 34, 35, 36, 37, 38]) {
  const g = generatePair(seed, 60);
  for (const [fmt, write] of Object.entries(formats)) {
    runs++;
    const r = reconcile(write(g.statement), ledgerCsv(g));
    if (r.totals.unexplained !== 0) unexplained++;
    const got = new Map<number, string[]>();
    for (const m of r.matches) for (const b of m.bank) got.set(b, m.ledger.map((i) => r.ledger[i].id).sort());
    g.bankLabels.forEach((lab, i) => {
      bankLines++;
      const want = [...lab.ledger].sort().join('|');
      const have = (got.get(i) ?? []).join('|');
      per[lab.kind].total++;
      if (want === have) {
        correct++;
        per[lab.kind].correct++;
      } else if (have) wrong++;
    });
    const open = new Set(r.openLedger.map((o) => r.ledger[o.line].id));
    for (const id of g.ledgerOnly) {
      per['ledger-only'].total++;
      if (open.has(id)) per['ledger-only'].correct++;
      if (g.decoys.has(id)) {
        decoys++;
        if (!open.has(id)) decoysTaken++;
      }
    }
    if (fmt === 'camt' && seed === 31) console.log(`sample run: ${r.matches.length} matches, ${r.openBank.length} open bank, ${r.openLedger.length} open ledger`);
  }
}
const share = correct / bankLines;
const ledgerOnlyShare = per['ledger-only'].correct / per['ledger-only'].total;
const result = {
  tool: 'bank-reconciliation',
  runs,
  bankLines,
  correct: share,
  wrongMatches: wrong,
  ledgerOnlyLeftOpen: ledgerOnlyShare,
  decoys,
  decoysTaken,
  runsNotAddingUp: unexplained,
  byKind: Object.fromEntries(Object.entries(per).map(([k, v]) => [k, { ...v, share: v.total ? v.correct / v.total : 1 }])),
};
const out = flag('out', 'out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-bank-reconciliation.json'), JSON.stringify(result, null, 2));
const md = [
  '# Bank Reconciliation benchmark',
  '',
  `${runs} reconciliations (8 generated months × camt.053, MT940, CSV and CSV-without-names statements), ${bankLines} bank lines.`,
  '',
  `- Bank lines reconciled exactly right: **${(share * 100).toFixed(1)}%**`,
  `- Wrong matches: **${wrong}**`,
  `- Ledger items correctly left open: ${(ledgerOnlyShare * 100).toFixed(1)}% (same-amount decoys taken: ${decoysTaken} of ${decoys})`,
  `- Reconciliations where the difference did not fully add up: ${unexplained}`,
  '',
  '| Situation | Lines | Right |',
  '|---|---:|---:|',
  ...Object.entries(per).map(([k, v]) => `| ${k} | ${v.total} | ${v.total ? ((v.correct / v.total) * 100).toFixed(1) : '—'}% |`),
].join('\n');
writeFileSync(join(out, 'benchmark-bank-reconciliation.md'), md + '\n');
console.log(md);
const min = Number(flag('min-correct', '0.99'));
if (share < min || wrong > 0 || decoysTaken > 0 || unexplained > 0 || ledgerOnlyShare < 1) {
  console.error(`FAIL: needs ≥${min * 100}% correct, 0 wrong matches, 0 decoys taken, every ledger-only item left open, and every run adding up.`);
  process.exit(1);
}
