import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkRun } from '../src/check.ts';
import { renderCheckReport } from '../src/report.ts';
import { generateRun } from '../src/sample.ts';

const trusted = [
  { vendor_id: 'V1', name: 'Redwood Textiles GmbH', iban: 'DE89370400440532013000', amount: '1200.00' },
  { vendor_id: 'V2', name: 'Kestrel Logistics SAS', iban: 'FR1420041010050500013M02606', amount: '800.00' },
];
const today = new Date(Date.UTC(2026, 10, 20));

test('a normal run passes, with harmless format differences', () => {
  const r = checkRun([{ vendor_id: 'V1', name: 'REDWOOD TEXTILES', iban: 'de89 3704 0044 0532 0130 00', amount: '1,150.00' }], trusted, { today });
  assert.equal(r.payments[0].risk, 'ok');
});

test('a changed account to a foreign bank is stopped', () => {
  const r = checkRun([{ vendor_id: 'V1', name: 'Redwood Textiles GmbH', iban: 'GB29NWBK60161331926819', amount: '1200' }], trusted, { today });
  const codes = r.payments[0].findings.map((f) => f.code);
  assert.equal(r.payments[0].risk, 'stop');
  assert.ok(codes.includes('ACCOUNT_CHANGED') && codes.includes('FOREIGN_ACCOUNT'));
  assert.match(renderCheckReport(r), /Bank detail change check/);
});

test('paying into another supplier’s account is stopped', () => {
  const r = checkRun([{ vendor_id: 'V1', name: 'Redwood Textiles GmbH', iban: 'FR1420041010050500013M02606', amount: '1200' }], trusted, { today });
  assert.ok(r.payments[0].findings.some((f) => f.code === 'OTHER_PAYEES_ACCOUNT'));
});

test('matching by name when the run has no payee ID', () => {
  const r = checkRun([{ name: 'Kestrel Logistics', iban: 'FR14 2004 1010 0505 0001 3M02 606', amount: '500' }], trusted, { today });
  assert.equal(r.payments[0].risk, 'ok');
  assert.equal(r.payments[0].matchedAs, 'name');
});

test('new payees, large new payees and spikes', () => {
  const r = checkRun([
    { name: 'Unknown Trading Ltd', iban: 'GB29NWBK60161331926819', amount: '500' },
    { name: 'Other Unknown Ltd', iban: 'GB82WEST12345698765432', amount: '25000' },
    { vendor_id: 'V2', name: 'Kestrel Logistics SAS', iban: 'FR1420041010050500013M02606', amount: '9000' },
  ], trusted, { today });
  assert.deepEqual(r.payments.map((p) => p.findings[0].code), ['NEW_PAYEE', 'NEW_PAYEE_LARGE', 'AMOUNT_SPIKE']);
});

test('every injected pattern is found and normal payments pass', () => {
  const g = generateRun({ seed: 81 });
  const r = checkRun(g.run, g.history, { today: g.today });
  r.payments.forEach((p, i) => {
    const l = g.labels.get(i);
    if (l) assert.ok(p.findings.some((f) => f.code === l), `${i} ${l}`);
    else assert.equal(p.risk, 'ok', `${i} ${p.findings.map((f) => f.code)}`);
  });
});
