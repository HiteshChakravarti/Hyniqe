import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toCamt053, toMt940 } from '../../bank-statement-converter/src/sample.ts';
import { reconcile, refsIn } from '../src/recon.ts';
import { matchRows, renderReconReport } from '../src/report.ts';
import { generatePair, ledgerCsv, statementCsv, statementCsvNoNames } from '../src/sample.ts';

const ids = (r: ReturnType<typeof reconcile>, i: number): string[] => r.matches.find((m) => m.bank.includes(i))?.ledger.map((l) => r.ledger[l].id).sort() ?? [];

test('reference tokens ignore dates, IBANs and amounts, and see through invoice prefixes', () => {
  assert.deepEqual(refsIn('Invoice INV-10412 paid 2026-11-04 1.234,56 DE89370400440532013000').sort(), ['10412']);
  assert.ok(refsIn('Rechnung 10412').includes('10412'));
  assert.ok(refsIn('INV10412').includes('10412'));
  assert.ok(refsIn('E2E560001').includes('E2E560001'));
  assert.deepEqual(refsIn('Payment November 2026'), []);
});

test('every situation is reconciled right in all four statement formats', () => {
  const g = generatePair(11, 40);
  for (const text of [toCamt053(g.statement), toMt940(g.statement), statementCsv(g.statement), statementCsvNoNames(g.statement)]) {
    const r = reconcile(text, ledgerCsv(g));
    g.bankLabels.forEach((lab, i) => assert.deepEqual(ids(r, i), [...lab.ledger].sort(), `bank line ${i} (${lab.kind})`));
    const open = new Set(r.openLedger.map((o) => r.ledger[o.line].id));
    for (const id of g.ledgerOnly) assert.ok(open.has(id), `${id} should stay open`);
    assert.equal(r.totals.unexplained, 0);
  }
});

test('the difference is fully explained by open items and charges', () => {
  const g = generatePair(5, 40);
  const r = reconcile(toCamt053(g.statement), ledgerCsv(g));
  const t = r.totals;
  assert.equal(t.bank - t.ledger, t.openBank - t.openLedger + t.differences);
  assert.ok(r.matches.some((m) => m.kind === 'reference-difference' && m.difference < 0), 'charges deducted show as a negative difference');
});

test('a ledger exported with the opposite sign is detected and flipped', () => {
  const g = generatePair(3, 30);
  const flipped = { ...g, ledger: g.ledger.map((e) => ({ ...e, amount: (-Number(e.amount)).toFixed(2) })) };
  const r = reconcile(toCamt053(g.statement), ledgerCsv(flipped));
  assert.equal(r.ledgerSignFlipped, true);
  assert.equal(r.matchedShare, reconcile(toCamt053(g.statement), ledgerCsv(g)).matchedShare);
});

test('debit and credit columns are read the accountant’s way round', () => {
  const bank = 'date,description,credit,debit\n2026-11-03,Kestrel Textiles INV-5001,1200.00,\n2026-11-04,Unity Telecom monthly,,89.90\n';
  const ledger = 'entry_id,date,counterparty,reference,debit,credit\nJE-1,2026-11-02,Kestrel Textiles S.L.,INV-5001,1200.00,\nJE-2,2026-11-04,Unity Telecom GmbH,INV-77,,89.90\n';
  const r = reconcile(bank, ledger);
  assert.equal(r.matches.length, 2);
  assert.equal(r.matches[0].kind, 'reference');
  assert.equal(r.matches[1].kind, 'amount-date');
});

test('two equally good candidates are not guessed', () => {
  const bank = 'date,description,amount\n2026-11-10,Card settlement,250.00\n';
  const ledger = 'entry_id,date,counterparty,reference,amount\nJE-1,2026-11-09,,A,250.00\nJE-2,2026-11-11,,B,250.00\n';
  const r = reconcile(bank, ledger);
  assert.equal(r.matches.length, 0);
  assert.equal(r.openBank[0].candidates.length, 2);
});

test('report and CSV are produced', () => {
  const g = generatePair(11, 30);
  const r = reconcile(toCamt053(g.statement), ledgerCsv(g));
  const html = renderReconReport(r, { generatedAt: new Date(0) });
  assert.match(html, /Unexplained/);
  assert.match(html, /To post in the ledger/);
  assert.ok(matchRows(r).length >= r.bank.length);
});
