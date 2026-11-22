import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv } from '../../shared/csv.ts';
import { renderRepairReport } from '../src/report.ts';
import { repairRecords } from '../src/repair.ts';

test('structures free text, keeps split fields and flags bank mismatches', () => {
  const csv = `vendor_id,name,address_text,street,building,postcode,town,country,iban
V1,Kestrel SL,,Calle de Alcala,36,28014,Madrid,ES,ES9121000418450200051332
V2,Lindqvist AB,"Drottninggatan 12, 111 51 Stockholm, Sweden",,,,,,
V3,No Address Co,"Unit 4",,,,,,
V4,Mismatch GmbH,"Friedrichstrasse 10, 10117 Berlin, Germany",,,,,,FR1420041010050500013M02606`;
  const s = repairRecords(parseCsv(csv));
  const by = Object.fromEntries(s.records.map((r) => [r.id, r]));
  assert.equal(by.V1.decision, 'compliant');
  assert.equal(by.V2.decision, 'auto');
  assert.equal(by.V2.address.TwnNm, 'Stockholm');
  assert.equal(by.V3.decision, 'needs_data');
  assert.equal(by.V4.decision, 'review');
  assert.match(by.V4.controls.join(' '), /differs from address country/);
  assert.match(renderRepairReport({ summary: s }), /Payment Data Repair Report/);
});
