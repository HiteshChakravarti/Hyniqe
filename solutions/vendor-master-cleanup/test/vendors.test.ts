import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderVendorReport } from '../src/report.ts';
import { generateVendors } from '../src/sample.ts';
import { cleanupVendors, supplierKey, vatProblem } from '../src/vendors.ts';

test('legal forms are removed from names', () => {
  assert.equal(supplierKey('Harbor Plastics Sp. z o.o.'), 'harbor plastics');
  assert.equal(supplierKey('SILVERLINE PRINT B.V.'), 'silverline print');
  assert.equal(supplierKey('Müller & Söhne GmbH'), 'muller sohne');
});

test('VAT formats', () => {
  assert.equal(vatProblem('DE 123 456 789', 'DE'), null);
  assert.equal(vatProblem('NL123456789B01', 'NL'), null);
  assert.equal(vatProblem('EL123456789', 'GR'), null);
  assert.equal(vatProblem('DE12345678', 'DE')?.code, 'VAT_FORMAT');
  assert.equal(vatProblem('FR12345678901', 'DE')?.code, 'VAT_COUNTRY');
});

test('duplicates, shared accounts and different suppliers', () => {
  const rows = [
    { vendor_id: 'A', name: 'Redwood Textiles GmbH', country: 'DE', iban: 'DE89370400440532013000', vat: 'DE123456789' },
    { vendor_id: 'B', name: 'REDWOD TEXTILES', country: 'DE', iban: 'DE89 3704 0044 0532 0130 00', vat: '' },
    { vendor_id: 'C', name: 'Falcon Textiles GmbH', country: 'DE', iban: 'DE89370400440532013000', vat: 'DE987654321' },
    { vendor_id: 'D', name: 'Redwood Textiles SARL', country: 'FR', iban: 'FR1420041010050500013M02606', vat: 'FR12345678901' },
  ];
  const r = cleanupVendors(rows);
  assert.deepEqual(r.clusters.map((c) => c.ids.sort()), [['A', 'B']]);
  const shared = r.findings.find((f) => f.code === 'SHARED_IBAN');
  assert.ok(shared && shared.ids.includes('C'));
  assert.ok(!r.findings.some((f) => f.ids.includes('D') && f.severity !== 'info'));
  assert.match(renderVendorReport(r), /Vendor master cleanup/);
});

test('every injected problem is found and clean records are not flagged', () => {
  const g = generateVendors({ seed: 41, count: 150 });
  const r = cleanupVendors(g.rows);
  const involved = new Set<string>();
  for (const [id, l] of g.labels) {
    involved.add(id);
    if (l.other) involved.add(l.other);
    assert.ok(r.findings.some((f) => f.code === l.kind && f.ids.includes(id)), `${id} ${l.kind}`);
  }
  for (const v of r.vendors) if (!involved.has(v.id)) assert.ok(!r.findings.some((f) => f.severity !== 'info' && f.ids.includes(v.id)), v.id);
});
