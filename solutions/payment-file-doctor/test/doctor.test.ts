import assert from 'node:assert/strict';
import { test } from 'node:test';
import { child, children, parseXml, val } from '../../shared/xml.ts';
import { buildPain001 } from '../src/build.ts';
import { diagnose, toSepaChars } from '../src/doctor.ts';
import { renderDoctorReport } from '../src/report.ts';
import { generatePaymentFile } from '../src/sample.ts';

const today = new Date(Date.UTC(2026, 10, 22));

test('a clean version 9 file passes untouched', () => {
  const f = generatePaymentFile({ version: '09', defectRate: 0, headerWrong: false, seed: 9 });
  const r = diagnose(f.xml, { today });
  assert.deepEqual(r.findings, []);
  assert.equal(r.errorsLeft, 0);
});

test('version 3 is upgraded: namespace, date wrapper, BICFI', () => {
  const f = generatePaymentFile({ defectRate: 0, headerWrong: false, seed: 2 });
  const r = diagnose(f.xml, { today });
  assert.equal(r.findings[0].code, 'VERSION');
  const doc = parseXml(r.fixedXml!);
  assert.match(doc.attrs.xmlns, /pain\.001\.001\.09$/);
  const b = child(doc, 'CstmrCdtTrfInitn/PmtInf');
  assert.equal(val(b, 'ReqdExctnDt/Dt'), '2026-11-27');
  assert.equal(val(b, 'DbtrAgt/FinInstnId/BICFI'), 'AIBKIE2D');
});

test('one-line addresses are split into structured fields', () => {
  const xml = buildPain001({
    version: '09', messageId: 'M1', createdAt: '2026-11-20T09:00:00', executionDate: '2026-11-27', batchId: 'B1',
    payer: { name: 'Payer Ltd', iban: 'IE29AIBK93115212345678' },
    transfers: [{ endToEndId: 'E1', amount: '10.00', reference: 'Inv 1', payee: { name: 'Kestrel Textiles S.L.', iban: 'ES9121000418450200051332', addressLines: ['Calle de Alcala 36, 28014 Madrid, Spain'] } }],
  });
  const r = diagnose(xml, { today });
  const a = r.findings.find((f) => f.code === 'ADDRESS');
  assert.ok(a?.fixed);
  const adr = child(parseXml(r.fixedXml!), 'CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/Cdtr/PstlAdr');
  assert.equal(val(adr, 'TwnNm'), 'Madrid');
  assert.equal(val(adr, 'Ctry'), 'ES');
  assert.equal(val(adr, 'PstCd'), '28014');
  assert.equal(children(adr, 'AdrLine').length, 0);
});

test('unfixable problems are reported, not guessed', () => {
  const xml = buildPain001({
    version: '09', messageId: 'M1', createdAt: '2026-11-20T09:00:00', executionDate: '2026-11-01', batchId: 'B1',
    payer: { name: 'Payer Ltd', iban: 'IE29AIBK93115212345678' },
    transfers: [
      { endToEndId: 'E1', amount: '10.00', reference: 'Inv 1', payee: { name: 'A', iban: 'ES9121000418450200051333' } },
      { endToEndId: 'E1', amount: '20.00', currency: 'USD', reference: 'Inv 2', payee: { name: 'B', iban: 'DE89370400440532013000', addressLines: ['Unit 4'] } },
    ],
  });
  const r = diagnose(xml, { today });
  const codes = r.findings.map((f) => `${f.code}${f.fixed ? '*' : ''}`);
  for (const c of ['IBAN', 'CURRENCY', 'DUPLICATE_REF', 'PAST_DATE', 'ADDRESS']) assert.ok(codes.includes(c), c);
  assert.equal(r.errorsLeft, 3);
});

test('header totals are corrected and characters replaced', () => {
  const f = generatePaymentFile({ seed: 3 });
  const r = diagnose(f.xml, { today });
  assert.ok(r.findings.some((x) => x.code === 'CONTROL_SUM' && x.fixed));
  const second = diagnose(r.fixedXml!, { today });
  assert.ok(second.findings.every((x) => x.code === 'IBAN'));
  assert.equal(toSepaChars('Müller & Söhne – Café'), 'Mueller + Soehne - Cafe');
});

test('unreadable and wrong files get a clear message', () => {
  assert.equal(diagnose('<Document><a></Document>').findings[0].code, 'NOT_XML');
  assert.equal(diagnose('<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02"><CstmrDrctDbtInitn/></Document>').findings[0].code, 'NOT_CREDIT_TRANSFER');
  assert.match(renderDoctorReport(diagnose(generatePaymentFile({ seed: 1 }).xml, { today })), /Payment File Doctor report/);
});
