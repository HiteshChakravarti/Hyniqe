import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findDuplicates, invoiceKey, parseAmount, vendorKey } from '../src/duplicates.ts';
import { renderDuplicateReport } from '../src/report.ts';
import { generatePayments } from '../src/sample.ts';

const p = (id: string, vendor: string, invoice: string, date: string, amount: string, extra: Record<string, string> = {}) => ({ payment_id: id, vendor_name: vendor, invoice_number: invoice, payment_date: date, amount, currency: 'EUR', ...extra });

test('normalisation', () => {
  assert.equal(vendorKey('ACME Industrial Ltd.'), vendorKey('Acme Industrial Limited'));
  assert.equal(invoiceKey('INV-0012345'), invoiceKey('12345'));
  assert.equal(parseAmount('1.234,56'), 123456);
  assert.equal(parseAmount('1,234.56'), 123456);
  assert.equal(parseAmount('(250.00)'), -25000);
});

test('exact and re-keyed duplicates are high confidence', () => {
  const r = findDuplicates([p('1', 'Acme Ltd', 'INV-0012345', '2026-01-05', '1520.40'), p('2', 'Acme Ltd', '12345', '2026-01-19', '1520.40')]);
  assert.equal(r.clusters.length, 1);
  assert.equal(r.clusters[0].confidence, 'high');
  assert.equal(r.clusters[0].exposureCents, 152040);
});

test('a supplier that exists twice in the vendor master is caught', () => {
  const r = findDuplicates([p('1', 'Borealis Logistics GmbH', 'B-778', '2026-02-01', '9800.00', { vendor_id: 'V1' }), p('2', 'BOREALIS LOGISTICS', 'B-778', '2026-02-10', '9800.00', { vendor_id: 'V77' })]);
  assert.equal(r.clusters[0]?.confidence, 'high');
  assert.match(r.clusters[0].reasons.join(' '), /two vendor records/);
});

test('monthly rent is not flagged', () => {
  const rows = Array.from({ length: 6 }, (_, m) => p(`R${m}`, 'Landlord Ltd', `RENT-2026-0${m + 1}`, `2026-0${m + 1}-01`, '4250.00'));
  assert.equal(findDuplicates(rows).clusters.length, 0);
});

test('same vendor and amount under a different reference is medium; round amounts are low', () => {
  const med = findDuplicates([p('1', 'Cobalt Facilities', 'C-100', '2026-03-01', '2310.75'), p('2', 'Cobalt Facilities', 'PO-4500123', '2026-03-12', '2310.75')]);
  assert.equal(med.clusters[0]?.confidence, 'medium');
  const low = findDuplicates([p('1', 'Cobalt Facilities', 'C-100', '2026-03-01', '2500.00'), p('2', 'Cobalt Facilities', 'C-200', '2026-03-12', '2500.00')]);
  assert.equal(low.clusters.length, 0);
  assert.equal(low.pairs[0]?.confidence, 'low');
});

test('benchmark-level behaviour: no false high-confidence groups', () => {
  const g = generatePayments({ count: 1500, seed: 8 });
  const res = findDuplicates(g.rows);
  for (const c of res.clusters.filter((x) => x.confidence === 'high')) assert.ok([c.original, ...c.duplicates].some((x) => g.labels.has(x.id)), c.reasons.join('; '));
  const html = renderDuplicateReport({ result: res, client: 'Test' });
  assert.match(html, /Duplicate Payment Review/);
});
