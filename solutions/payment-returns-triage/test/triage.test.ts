import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CODES, explain } from '../src/codes.ts';
import { renderTriageReport } from '../src/report.ts';
import { FORMATS, generateStatus } from '../src/sample.ts';
import { triage } from '../src/triage.ts';

test('every code has a meaning, a group, who acts and a fix', () => {
  for (const c of CODES) assert.ok(c.meaning && c.group && c.who && c.fix, c.code);
  assert.equal(explain('ac04').group, 'Bank account');
  assert.equal(explain('ZZ99').group, 'Unspecified');
});

test('all formats are read', () => {
  for (const format of FORMATS) {
    const g = generateStatus({ seed: 9, format, count: 30 });
    const r = triage(g.text);
    assert.equal(r.items.length, g.truth.length, format);
    assert.equal(r.total, 30, format);
  }
});

test('a CSV with only codes works', () => {
  const r = triage('reference,reason_code,amount,currency\nA1,AC04,100.00,EUR\nA2,,50,EUR\nA3,RR03,"1,250.50",EUR\n');
  assert.equal(r.items.length, 2);
  assert.equal(r.accepted, 1);
  assert.equal(r.items[1].amount, 1250.5);
  assert.match(renderTriageReport(r), /Returned and rejected payments/);
});

test('a payment instruction is refused with a clear message', () => {
  assert.throws(() => triage('<Document><CstmrCdtTrfInitn/></Document>'), /CstmrCdtTrfInitn/);
});
