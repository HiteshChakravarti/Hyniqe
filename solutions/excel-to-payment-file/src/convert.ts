// Excel to Payment File: turns a spreadsheet of payments into a SEPA credit transfer file
// (pain.001 version 9). Every row is checked first; rows with problems are left out and listed,
// and the finished file is run back through the Payment File Doctor before it is offered.

import { bicCountry, ibanValid } from '../../../engine/src/address/iban.ts';
import { decide, structureRecord } from '../../../engine/src/address/repair.ts';
import { pick, type Row } from '../../shared/csv.ts';
import { buildPain001, type Party, type Transfer } from '../../payment-file-doctor/src/build.ts';
import { diagnose, toSepaChars } from '../../payment-file-doctor/src/doctor.ts';

export interface PayerDetails {
  name: string;
  iban: string;
  bic?: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface RowResult {
  row: number;
  payee: string;
  amount: string;
  status: 'included' | 'left out';
  notes: string[];
}

export interface BuildResult {
  xml: string | null;
  rows: RowResult[];
  included: number;
  total: string;
  problems: string[];
}

export const COLUMNS = {
  name: ['name', 'payee', 'payee_name', 'beneficiary', 'beneficiary_name', 'creditor', 'supplier', 'vendor'],
  iban: ['iban', 'payee_iban', 'account', 'beneficiary_iban'],
  bic: ['bic', 'swift', 'bic_code', 'payee_bic'],
  amount: ['amount', 'value', 'sum'],
  currency: ['currency', 'ccy'],
  reference: ['reference', 'description', 'remittance', 'remittance_info', 'invoice', 'invoice_number', 'payment_reference'],
  id: ['end_to_end_id', 'endtoendid', 'id', 'payment_id'],
  address: ['address', 'payee_address', 'full_address'],
  street: ['street'],
  building: ['building', 'house_number', 'number'],
  postcode: ['postcode', 'postal_code', 'zip'],
  town: ['town', 'city'],
  country: ['country', 'country_code'],
};

function amountCents(s: string): number | null {
  const t = s.replace(/[\s€$£]/g, '');
  let n: number;
  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(t) || /^\d+,\d{1,2}$/.test(t)) n = Number(t.replace(/\./g, '').replace(',', '.'));
  else if (/^\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(t) || /^\d+(\.\d{1,2})?$/.test(t)) n = Number(t.replace(/,/g, ''));
  else return null;
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function buildFromRows(rows: Row[], payer: PayerDetails, opts: { today?: Date } = {}): BuildResult {
  const problems: string[] = [];
  const cleanPayerIban = payer.iban.replace(/\s+/g, '').toUpperCase();
  if (!payer.name.trim()) problems.push('Enter your company name.');
  if (!ibanValid(cleanPayerIban)) problems.push(`Your IBAN "${payer.iban}" fails its check digits.`);
  if (payer.bic && !bicCountry(payer.bic.replace(/\s+/g, '').toUpperCase())) problems.push(`Your BIC "${payer.bic}" is not a valid BIC.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payer.date)) problems.push('Choose a payment date.');
  const results: RowResult[] = [];
  const transfers: Transfer[] = [];
  const seen = new Set<string>();
  rows.forEach((r, i) => {
    const g = (k: keyof typeof COLUMNS): string => pick(r, ...COLUMNS[k]).trim();
    const notes: string[] = [];
    let ok = true;
    const rawName = g('name');
    const name = toSepaChars(rawName).slice(0, 70);
    if (!name) {
      notes.push('No payee name.');
      ok = false;
    } else if (name !== rawName) notes.push(`Name written as "${name}" (bank character set and 70-character limit).`);
    const iban = g('iban').replace(/\s+/g, '').toUpperCase();
    if (!iban) {
      notes.push('No IBAN.');
      ok = false;
    } else if (!ibanValid(iban)) {
      notes.push(`IBAN "${g('iban')}" fails its check digits; get the correct one from the payee.`);
      ok = false;
    }
    const bic = g('bic').replace(/\s+/g, '').toUpperCase();
    if (bic && !bicCountry(bic)) {
      notes.push(`BIC "${bic}" is not valid; left out of the payment (it is optional for SEPA).`);
    }
    const c = amountCents(g('amount'));
    if (c === null || c <= 0) {
      notes.push(`Amount "${g('amount')}" is not a valid positive amount.`);
      ok = false;
    }
    const ccy = (g('currency') || 'EUR').toUpperCase();
    if (ccy !== 'EUR') {
      notes.push(`Currency ${ccy}: SEPA files are euro only.`);
      ok = false;
    }
    const rawRef = g('reference');
    const reference = toSepaChars(rawRef).slice(0, 140);
    if (!reference) notes.push('No reference; the payee will not know what this is for.');
    // Address: split fields win; otherwise a one-line address is structured.
    let address: Party['address'];
    if (g('town') && g('country')) address = { street: g('street') || undefined, building: g('building') || undefined, postcode: g('postcode') || undefined, town: toSepaChars(g('town')), country: g('country').toUpperCase().slice(0, 2) };
    else if (g('address')) {
      const { result } = structureRecord({ address_text: g('address'), country: g('country') || undefined });
      if (decide(result) === 'auto' && result.address.TwnNm && result.address.Ctry) {
        const a = result.address;
        address = { street: a.StrtNm && toSepaChars(a.StrtNm), building: a.BldgNb, postcode: a.PstCd, town: toSepaChars(a.TwnNm!), country: a.Ctry };
        notes.push(`Address split into ${[a.StrtNm, a.BldgNb, a.PstCd, a.TwnNm, a.Ctry].filter(Boolean).join(', ')}.`);
      } else notes.push('Address could not be split safely, so it was left out. The payment can still be made without it.');
    }
    let id = g('id') || `ROW-${String(i + 2).padStart(5, '0')}`;
    if (seen.has(id)) id = `${id}-${i + 2}`;
    seen.add(id);
    if (ok) transfers.push({ endToEndId: toSepaChars(id).slice(0, 35), amount: (c! / 100).toFixed(2), payee: { name, iban, bic: bic && bicCountry(bic) ? bic : undefined, address }, reference: reference || 'Payment' });
    results.push({ row: i + 2, payee: rawName, amount: g('amount'), status: ok ? 'included' : 'left out', notes });
  });
  if (!transfers.length) problems.push('No row could be included. Check the columns and the notes for each row.');
  const total = (transfers.reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0) / 100).toFixed(2);
  if (problems.length) return { xml: null, rows: results, included: transfers.length, total, problems };
  const stamp = (opts.today ?? new Date()).toISOString().slice(0, 19);
  const xml = buildPain001({
    version: '09',
    messageId: `HYN-${stamp.replace(/\D/g, '').slice(0, 14)}`,
    createdAt: stamp,
    executionDate: payer.date,
    batchId: `BATCH-${payer.date.replace(/-/g, '')}`,
    payer: { name: toSepaChars(payer.name).slice(0, 70), iban: cleanPayerIban, bic: payer.bic?.replace(/\s+/g, '').toUpperCase() || undefined },
    transfers,
  });
  // Self-check: the file must pass the Payment File Doctor with no errors.
  const check = diagnose(xml, { today: opts.today });
  const errs = check.findings.filter((f) => f.level === 'error');
  if (errs.length) return { xml: null, rows: results, included: transfers.length, total, problems: errs.map((e) => `${e.where}: ${e.message}`) };
  return { xml, rows: results, included: transfers.length, total, problems: [] };
}

/** The template offered for download. */
export const TEMPLATE = `payee,iban,amount,reference,bic,address
Kestrel Textiles S.L.,ES9121000418450200051332,1250.00,Invoice 2026-0412,,"Calle de Alcala 36, 28014 Madrid, Spain"
Borealis Logistics GmbH,DE89370400440532013000,"3.480,50",Invoice 88213,COBADEFFXXX,"Friedrichstrasse 112, 10117 Berlin, Germany"
Müller & Söhne KG,DE02120300000000202051,299.99,Order 5512 / November,,
Cobalt Facilities BV,NL91ABNA0417164300,812.40,Cleaning November,ABNANL2A,"Damrak 70, 1012 LM Amsterdam, Netherlands"
Wrong Account Ltd,DE89370400440532013001,100.00,Invoice 1,,
`;
