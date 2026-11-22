import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv } from '../../shared/csv.ts';
import { child, children, parseXml, val } from '../../shared/xml.ts';
import { buildFromRows, TEMPLATE } from '../src/convert.ts';

const payer = { name: 'Example Trading Ltd', iban: 'DE89370400440532013000', date: '2026-11-27' };
const today = new Date(Date.UTC(2026, 10, 22));

test('the template becomes a valid version 9 file; the bad IBAN row is left out', () => {
  const r = buildFromRows(parseCsv(TEMPLATE), payer, { today });
  assert.deepEqual(r.problems, []);
  assert.equal(r.included, 4);
  assert.equal(r.rows[4].status, 'left out');
  assert.match(r.rows[4].notes[0], /check digits/);
  const doc = parseXml(r.xml!);
  assert.match(doc.attrs.xmlns, /pain\.001\.001\.09/);
  const txs = children(child(doc, 'CstmrCdtTrfInitn/PmtInf'), 'CdtTrfTxInf');
  assert.equal(txs.length, 4);
  assert.equal(val(txs[1], 'Amt/InstdAmt'), '3480.50');
  assert.equal(val(txs[2], 'Cdtr/Nm'), 'Mueller + Soehne KG');
  assert.equal(val(txs[0], 'Cdtr/PstlAdr/TwnNm'), 'Madrid');
  assert.equal(val(child(doc, 'CstmrCdtTrfInitn/GrpHdr'), 'CtrlSum'), r.total);
});

test('payer problems stop the build with a clear message', () => {
  const r = buildFromRows(parseCsv(TEMPLATE), { ...payer, iban: 'DE00 1234' }, { today });
  assert.equal(r.xml, null);
  assert.match(r.problems[0], /IBAN/);
});
