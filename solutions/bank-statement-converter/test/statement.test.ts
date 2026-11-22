import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convertStatement, parse86 } from '../src/statement.ts';
import { sampleStatement, toCamt053, toMt940 } from '../src/sample.ts';

test('camt.053 and MT940 of the same statement give the same transactions and balance', () => {
  const s = sampleStatement(4);
  const camt = convertStatement(toCamt053(s));
  const mt = convertStatement(toMt940(s));
  assert.equal(camt.format, 'camt.053.001.08');
  assert.equal(mt.format, 'MT940');
  for (const r of [camt, mt]) {
    assert.equal(r.transactions.length, s.txs.length);
    assert.equal(r.statements[0].difference, 0);
    assert.equal(r.warnings.length, 0);
  }
  for (let i = 0; i < s.txs.length; i++) {
    const t = s.txs[i];
    for (const r of [camt, mt]) {
      const x = r.transactions[i];
      assert.equal(x.amount, t.credit ? t.amount : -t.amount);
      assert.equal(x.bookingDate, t.date);
      assert.equal(x.counterparty, t.name.slice(0, 27));
      assert.equal(x.endToEndId, t.e2e);
      assert.ok(x.reference.includes(t.reference.slice(0, 20)), `${x.reference} / ${t.reference}`);
    }
  }
  assert.equal(camt.transactions.find((x) => x.type.includes('SEPA transfer'))?.type.startsWith('In') || camt.transactions.find((x) => x.type.includes('SEPA'))?.type.length! > 0, true);
});

test('a missing entry shows up as a balance difference', () => {
  const s = sampleStatement(7);
  const broken = toCamt053({ ...s, txs: s.txs.slice(1) });
  const r = convertStatement(broken);
  assert.notEqual(r.statements[0].difference, 0);
  assert.equal(r.warnings.length, 1);
});

test('field 86 layouts', () => {
  assert.deepEqual(parse86('/EREF/E1//NAME/ACME BV/REMI/USTD//INV 12/IBAN/NL91ABNA0417164300'), { name: 'ACME BV', account: 'NL91ABNA0417164300', reference: 'INV 12', e2e: 'E1' });
  assert.equal(parse86('166?00GUTSCHRIFT?20EREF+X1SVWZ+Rechnung 4?32Muster GmbH').name, 'Muster GmbH');
  assert.equal(parse86('just free text').reference, 'just free text');
});

test('clear errors for files that are not statements', () => {
  assert.throws(() => convertStatement('hello'), /does not look like a bank statement/);
  assert.throws(() => convertStatement('<Document><X/></Document>'), /No statements were found/);
});
