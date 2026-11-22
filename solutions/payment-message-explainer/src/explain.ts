// Payment Message Explainer: plain English, field by field, plus readiness checks and conversion.
import { decide, structureRecord } from '../../../engine/src/address/repair.ts';
import { lookupCountry } from '../../../engine/src/address/countries.ts';
import { ibanValid } from '../../../engine/src/address/iban.ts';
import { CHARGES_WORDS, FIELDS, type Party, type Payment } from './model.ts';
import { parseMt103 } from './mt103.ts';
import { parsePacs008, toPacs008, type Structured } from './pacs008.ts';

export type Level = 'error' | 'warning' | 'info';
export interface Finding {
  level: Level;
  code: string;
  where: string;
  message: string;
  action: string;
}

export interface FieldRow {
  name: string;
  mt: string;
  mx: string;
  value: string;
  meaning: string;
}

export interface Explanation {
  format: Payment['format'];
  payment: Payment;
  summary: string;
  rows: FieldRow[];
  findings: Finding[];
  /** The same payment in the other format. */
  converted: { format: 'pacs.008' | 'MT103'; text: string; filename: string };
  addressReady: boolean;
}

const BIC = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const X_CHARS = /^[A-Za-z0-9/\-?:().,'+ \n]*$/;

const money = (n: number | null, c: string): string => (n === null ? '' : `${c} ${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

function partyText(p: Party): string {
  const addr = p.town || p.country ? [...p.lines, [p.street, p.building].filter(Boolean).join(' '), [p.postcode, p.town].filter(Boolean).join(' '), p.country].filter(Boolean).join(', ') : p.lines.join(', ');
  return [p.name, p.account && `account ${p.account}`, p.bic && `BIC ${p.bic}`, addr && `address: ${addr}`].filter(Boolean).join('; ');
}

function valueOf(p: Payment, key: string): string {
  switch (key) {
    case 'amount': return money(p.amount, p.currency);
    case 'instructedAmount': return money(p.instructedAmount, p.instructedCurrency);
    case 'debtor': return partyText(p.debtor);
    case 'creditor': return partyText(p.creditor);
    case 'charges': return p.charges ? `${p.charges}: ${CHARGES_WORDS[p.charges] ?? 'unknown code'}` : '';
    case 'senderCharges': return p.senderCharges.join(', ');
    default: return String((p as unknown as Record<string, unknown>)[key] ?? '');
  }
}

/** Keep the town as the customer wrote it (Milano, not Milan), taken from the line with the postcode. */
function townAsWritten(lines: string[], postcode: string | undefined, town: string): string {
  const norm = (x: string) => x.normalize('NFKD').replace(/\p{M}/gu, '').toUpperCase();
  if (postcode) {
    for (const l of lines) {
      const i = l.indexOf(postcode);
      if (i < 0) continue;
      let rest = (l.slice(0, i) + ' ' + l.slice(i + postcode.length)).replace(/[,]/g, ' ').trim().replace(/\s+/g, ' ');
      // Drop a trailing country name written on the same line ("20121 MILANO ITALY").
      const w = rest.split(' ');
      for (const k of [2, 1]) {
        if (w.length > k && lookupCountry(w.slice(-k).join(' '))) {
          rest = w.slice(0, -k).join(' ');
          break;
        }
      }
      if (/^[\p{L}' .-]{2,35}$/u.test(rest)) return rest.replace(/\s+/g, ' ');
    }
  }
  const re = new RegExp(`(^|[^\\p{L}])(${norm(town).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\p{L}])`, 'u');
  for (const l of lines) {
    const m = re.exec(norm(l));
    if (m) {
      const i = m.index + m[1].length;
      return l.slice(i, i + town.length);
    }
  }
  return town;
}

/** Is this party's address acceptable after the November 2026 CBPR+ change, and can we structure it? */
function addressCheck(p: Party, role: string, add: (f: Finding) => void): Structured['debtor'] | undefined {
  if (!p.lines.length && !p.town && !p.country) return undefined; // no address given: allowed
  if (p.town && p.country) return undefined; // structured or hybrid already
  const text = p.lines.join(', ');
  const res = structureRecord({ address_text: text });
  const a = res.result.address;
  const d = decide(res.result);
  if (d === 'needs_data' || !a.TwnNm || !a.Ctry) {
    add({ level: 'error', code: 'ADDRESS_UNSTRUCTURED', where: role, message: `The ${role} address is free text only ("${text}") and no town and country could be found in it. From November 2026 CBPR+ rejects addresses without town and country in their own fields.`, action: `Ask for the ${role}'s town and country and send them as separate fields.` });
    return undefined;
  }
  add({ level: d === 'auto' ? 'warning' : 'error', code: 'ADDRESS_UNSTRUCTURED', where: role, message: `The ${role} address is free text only. From November 2026 CBPR+ rejects it. Suggested structured address: ${[a.StrtNm, a.BldgNb, a.PstCd, townAsWritten(p.lines, a.PstCd, a.TwnNm), a.Ctry].filter(Boolean).join(', ')}${d === 'review' ? ' (check before use)' : ''}.`, action: d === 'auto' ? 'Use the structured address shown, which is already in the converted pacs.008.' : 'Confirm the suggested town and country before sending.' });
  return { street: a.StrtNm, building: a.BldgNb, postcode: a.PstCd, town: townAsWritten(p.lines, a.PstCd, a.TwnNm), country: a.Ctry, lines: [] };
}

function checks(p: Payment, originalText: string): { findings: Finding[]; structured: Structured } {
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);
  const need = (cond: boolean, where: string, what: string) => cond || add({ level: 'error', code: 'MISSING', where, message: `${what} is missing.`, action: `Add the ${what.toLowerCase()}.` });
  need(!!p.ref, 'reference', 'The sender’s reference');
  need(!!p.valueDate && p.amount !== null, 'amount', 'The value date, currency and amount');
  need(!!(p.debtor.name || p.debtor.bic), 'payer', 'The ordering customer');
  need(!!(p.creditor.name || p.creditor.bic), 'beneficiary', 'The beneficiary');
  need(!!p.charges, 'charges', 'The charges code');
  if (p.format === 'MT103' && p.charges === 'BEN' && !p.senderCharges.length) add({ level: 'error', code: 'CHARGES_RULE', where: 'charges', message: 'Charges are BEN but no sender’s charges (field 71F) are given. The network rejects this combination.', action: 'Add 71F with the charges deducted, even if zero.' });
  if (!p.uetr) add({ level: 'warning', code: 'NO_UETR', where: 'tracking', message: 'No UETR (tracking number). Cross-border payments over Swift need one for gpi tracking.', action: 'Add a UETR (a random UUID version 4).' });
  for (const [role, b] of [['sender', p.sender], ['receiver', p.receiver], ['payer’s bank', p.debtorAgent], ['beneficiary’s bank', p.creditorAgent], ['intermediary', p.intermediary]] as const) {
    if (b && /^[A-Z0-9]{6,}$/.test(b) && !BIC.test(b)) add({ level: 'error', code: 'BIC', where: role, message: `The ${role} BIC ${b} is not 8 or 11 characters in the right pattern.`, action: 'Correct the BIC.' });
  }
  for (const [role, a] of [['payer', p.debtor.account], ['beneficiary', p.creditor.account]] as const) {
    const s = a.replace(/\s/g, '').toUpperCase();
    if (/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(s) && !ibanValid(s)) add({ level: 'error', code: 'IBAN', where: role, message: `The ${role} IBAN ${a} fails its check digits.`, action: 'Ask for the IBAN again; a digit is wrong.' });
  }
  if (p.instructedAmount !== null && p.instructedCurrency !== p.currency && !p.rate) add({ level: 'warning', code: 'NO_RATE', where: 'amount', message: 'The instructed and settlement currencies differ but no exchange rate is given.', action: 'Add the exchange rate (MT field 36, MX XchgRate).' });
  if (p.remittance.length > 140) add({ level: 'warning', code: 'REMITTANCE_LONG', where: 'remittance', message: `The remittance information is ${p.remittance.length} characters; MT103 carries only 140.`, action: 'Shorten it, or send structured remittance information separately.' });
  if (p.format === 'pacs.008') {
    for (const [role, party] of [['payer', p.debtor], ['beneficiary', p.creditor]] as const) {
      if (party.name.length > 33) add({ level: 'info', code: 'TRUNCATION', where: role, message: `The ${role} name has ${party.name.length} characters. If a bank on the route converts to MT103, it will be cut.`, action: 'No action needed for ISO 20022 end to end; be aware when a bank still uses MT.' });
    }
    if (!X_CHARS.test(originalText.replace(/<[^>]+>/g, ' ').replace(/[\r\t]/g, ''))) add({ level: 'info', code: 'CHARSET', where: 'text', message: 'The message contains characters (such as accents) that MT messages cannot carry; they will be replaced if converted.', action: 'No action needed unless a bank on the route still uses MT.' });
  }
  const structured: Structured = { debtor: addressCheck(p.debtor, 'payer', add), creditor: addressCheck(p.creditor, 'beneficiary', add) };
  return { findings, structured };
}

/** MT103 text from the model, for converting a pacs.008 back. */
export function toMt103(p: Payment): string {
  const yymmdd = p.valueDate.replace(/^20/, '').replace(/-/g, '');
  const mtAmt = (n: number | null) => (n === null ? '0,' : n.toFixed(2).replace('.', ','));
  const clean = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9/\-?:().,'+ ]/g, ' ');
  const cut = (s: string, n: number) => clean(s).slice(0, n);
  const partyLines = (pp: Party): string[] => {
    const out: string[] = [];
    if (pp.account) out.push(`/${pp.account}`);
    if (pp.town && pp.country) {
      out.push(`1/${cut(pp.name, 33)}`);
      const street = [pp.street, pp.building].filter(Boolean).join(' ') || pp.lines[0] || '';
      if (street) out.push(`2/${cut(street, 33)}`);
      out.push(`3/${pp.country}/${cut([pp.postcode, pp.town].filter(Boolean).join(' '), 30)}`);
    } else {
      out.push(cut(pp.name, 35), ...pp.lines.slice(0, 3).map((l) => cut(l, 35)));
    }
    return out;
  };
  const f = (tag: string, v: string | string[]) => `:${tag}:${Array.isArray(v) ? v.join('\n') : v}`;
  const lt = (b: string) => `${b.slice(0, 8).padEnd(8, 'X')}A${(b.slice(8) || 'XXX').padEnd(3, 'X')}`;
  const body = [
    f('20', cut(p.ref, 16)),
    f('23B', 'CRED'),
    f('32A', `${yymmdd}${p.currency}${mtAmt(p.amount)}`),
    p.instructedAmount !== null ? f('33B', `${p.instructedCurrency}${mtAmt(p.instructedAmount)}`) : '',
    p.rate ? f('36', p.rate.replace('.', ',')) : '',
    f(p.debtor.town && p.debtor.country ? '50F' : '50K', partyLines(p.debtor)),
    p.debtorAgent && p.debtorAgent !== p.sender ? f('52A', p.debtorAgent) : '',
    p.intermediary ? f('56A', p.intermediary) : '',
    p.creditorAgent && p.creditorAgent !== p.receiver ? f('57A', p.creditorAgent) : '',
    f(p.creditor.town && p.creditor.country ? '59F' : '59', partyLines(p.creditor)),
    p.remittance ? f('70', (cut(p.remittance, 140).match(/.{1,35}/g) ?? []).slice(0, 4)) : '',
    f('71A', p.charges || 'SHA'),
    ...p.senderCharges.map((c) => f('71F', c.replace('.', ','))),
  ].filter(Boolean);
  return `{1:F01${lt(p.sender)}0000000000}{2:I103${lt(p.receiver)}N}{3:{121:${p.uetr}}}{4:\n${body.join('\n')}\n-}`;
}

export function detectFormat(text: string): 'MT103' | 'pacs.008' | null {
  const t = text.trimStart();
  if (t.startsWith('<')) return 'pacs.008';
  if (/\{2:[IO]103/.test(t) || /^:20:/m.test(t)) return 'MT103';
  return null;
}

export function explain(text: string, opts: { createdAt?: string } = {}): Explanation {
  const fmt = detectFormat(text);
  if (!fmt) throw new Error('This does not look like an MT103 or a pacs.008. Paste the whole message, including the :20: line or the XML.');
  let payment: Payment;
  if (fmt === 'MT103') {
    const r = parseMt103(text);
    if (r.type !== '103') throw new Error(`This is an MT${r.type}. The explainer reads MT103 customer credit transfers.`);
    payment = r.payment;
  } else payment = parsePacs008(text);
  const { findings, structured } = checks(payment, text);
  const p = payment;
  const via = [p.intermediary && `via ${p.intermediary}`].filter(Boolean).join(' ');
  const summary = `${p.debtor.name || p.debtor.bic || 'The payer'} pays ${money(p.amount, p.currency)}${p.instructedAmount !== null && p.instructedCurrency !== p.currency ? ` (instructed as ${money(p.instructedAmount, p.instructedCurrency)})` : ''} to ${p.creditor.name || p.creditor.bic || 'the beneficiary'}${p.creditor.account ? ` (account ${p.creditor.account})` : ''}, value date ${p.valueDate || 'not given'}. The money goes from ${p.sender || 'the sending bank'} to ${p.receiver || 'the receiving bank'}${via ? ` ${via}` : ''}${p.creditorAgent && p.creditorAgent !== p.receiver ? ` for credit at ${p.creditorAgent}` : ''}. ${p.charges ? `Charges: ${CHARGES_WORDS[p.charges] ?? p.charges}.` : ''}${p.remittance ? ` Reference for the beneficiary: "${p.remittance}".` : ''}`;
  const rows = FIELDS.map((f) => ({ name: f.name, mt: f.mt, mx: f.mx, value: valueOf(p, f.key), meaning: f.meaning })).filter((r) => r.value);
  const converted = fmt === 'MT103'
    ? { format: 'pacs.008' as const, text: toPacs008(p, { createdAt: opts.createdAt, structured }), filename: `${p.ref || 'payment'}-pacs008.xml` }
    : { format: 'MT103' as const, text: toMt103(p), filename: `${p.ref || 'payment'}-mt103.txt` };
  const addressReady = !findings.some((f) => f.code === 'ADDRESS_UNSTRUCTURED');
  return { format: fmt, payment: p, summary: summary.trim(), rows, findings, converted, addressReady };
}
