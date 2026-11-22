import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkFile, checkXml } from '../src/check.ts';
import { renderInvoiceReport } from '../src/report.ts';
import { facturxPdf, generateInvoice } from '../src/sample.ts';

test('a correct Peppol UBL invoice passes and is read fully', () => {
  const r = checkXml(generateInvoice(11, null, 'UBL'));
  assert.equal(r.findings.length, 0, JSON.stringify(r.findings));
  assert.match(r.standard, /Peppol/);
  assert.ok(r.invoice.lines.length >= 1);
  assert.ok((r.invoice.totals.payable ?? 0) > 0);
});

test('a correct CII invoice passes', () => {
  assert.equal(checkXml(generateInvoice(12, null, 'CII')).findings.length, 0);
});

test('a wrong VAT amount and a bad IBAN are explained', () => {
  const vat = checkXml(generateInvoice(13, 'BR-S-09', 'UBL'));
  assert.ok(vat.findings.some((f) => f.rule === 'BR-S-09' && /should be/.test(f.message)));
  const iban = checkXml(generateInvoice(14, 'HY-IBAN', 'CII'));
  assert.ok(iban.findings.some((f) => f.rule === 'HY-IBAN'));
  assert.match(renderInvoiceReport(vat), /E-invoice check/);
});

test('XML inside a Factur-X PDF is found', async () => {
  const r = await checkFile(await facturxPdf(generateInvoice(15, null, 'CII')));
  assert.ok(r.fromPdf);
  assert.equal(r.findings.length, 0);
});

test('other files are refused clearly', async () => {
  assert.throws(() => checkXml('<Document><CstmrCdtTrfInitn/></Document>'), /not an e-invoice/);
  await assert.rejects(checkFile(new TextEncoder().encode('%PDF-1.4\n1 0 obj << >> endobj\n%%EOF')), /plain PDF/);
});
