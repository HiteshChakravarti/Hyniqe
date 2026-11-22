import assert from 'node:assert/strict';
import { test } from 'node:test';
import { explain } from '../src/explain.ts';
import { parseMt103 } from '../src/mt103.ts';
import { renderExplanation } from '../src/report.ts';

const MT = `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{3:{121:eb6305c9-1f7f-49de-aed0-16487c27b42d}}{4:
:20:494931/DEV
:23B:CRED
:32A:261123EUR1958,47
:50K:/BE68539007547034
PETER MAIER
HOCHSTRASSE 27
8400 WINTERTHUR SWITZERLAND
:59:/DE89370400440532013000
REDWOOD TEXTILES GMBH
VIA ROMA 20
20121 MILANO ITALY
:70:INVOICE 4711
:71A:BEN
-}`;

test('reads the MT103 headers and fields', () => {
  const p = parseMt103(MT).payment;
  assert.equal(p.sender, 'BANKBEBB');
  assert.equal(p.receiver, 'BANKDEFF');
  assert.equal(p.amount, 1958.47);
  assert.equal(p.valueDate, '2026-11-23');
  assert.equal(p.creditor.account, 'DE89370400440532013000');
});

test('plain English, rule checks and structured addresses', () => {
  const e = explain(MT, { createdAt: '2026-11-22T10:00:00+00:00' });
  assert.match(e.summary, /PETER MAIER pays EUR 1,958\.47 to REDWOOD TEXTILES GMBH/);
  assert.ok(e.findings.some((f) => f.code === 'CHARGES_RULE'));
  assert.ok(e.findings.some((f) => f.code === 'ADDRESS_UNSTRUCTURED' && f.where === 'beneficiary'));
  assert.match(e.converted.text, /<TwnNm>MILANO<\/TwnNm>/);
  assert.match(e.converted.text, /<ChrgBr>CRED<\/ChrgBr>/);
  assert.match(renderExplanation(e), /Payment message explained/);
});

test('pacs.008 back to MT103 with structured 59F', () => {
  const mx = explain(MT, { createdAt: '2026-11-22T10:00:00+00:00' }).converted.text;
  const back = explain(mx);
  assert.equal(back.format, 'pacs.008');
  assert.ok(back.addressReady);
  assert.match(back.converted.text, /:59F:\/DE89370400440532013000\n1\/REDWOOD TEXTILES GMBH/);
  assert.match(back.converted.text, /3\/IT\/20121 MILANO/);
});

test('other inputs are refused clearly', () => {
  assert.throws(() => explain('hello'), /MT103 or a pacs\.008/);
  assert.throws(() => explain('{2:I202BANKDEFFXXXXN}{4:\n:20:X\n-}'), /MT202/);
  assert.throws(() => explain('<Document><CstmrCdtTrfInitn/></Document>'), /not a pacs\.008/);
});
