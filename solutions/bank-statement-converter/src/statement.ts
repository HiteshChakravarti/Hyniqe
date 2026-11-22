// Bank Statement Converter: reads camt.053 / camt.052 / camt.054 XML and MT940 / MT942 statements
// and turns them into one clean transaction table, with a balance check per statement.

import { child, children, findAll, parseXml, val, XmlError, type XmlNode } from '../../shared/xml.ts';

export interface Transaction {
  statement: string;
  account: string;
  currency: string;
  bookingDate: string;
  valueDate: string;
  /** Signed: money in is positive, money out negative. */
  amount: number;
  direction: 'In' | 'Out';
  counterparty: string;
  counterpartyAccount: string;
  reference: string;
  endToEndId: string;
  bankReference: string;
  type: string;
  status: string;
}

export interface Statement {
  id: string;
  account: string;
  currency: string;
  from: string;
  to: string;
  opening: number | null;
  closing: number | null;
  credits: number;
  debits: number;
  count: number;
  /** opening + credits - debits - closing, or null when a balance is missing. */
  difference: number | null;
}

export interface ConvertResult {
  format: string;
  statements: Statement[];
  transactions: Transaction[];
  warnings: string[];
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

// Bank transaction codes (ISO 20022 domain / family / sub-family, and MT940 type codes) in plain words.
const FAMILY: Record<string, string> = {
  RCDT: 'Incoming transfer', ICDT: 'Outgoing transfer', RDDT: 'Direct debit collected from you', IDDT: 'Direct debit you collected',
  CCRD: 'Card payment', MCRD: 'Card payment', CNTR: 'Cash at counter', DRFT: 'Cheque or draft', RCHQ: 'Cheque received', ICHQ: 'Cheque issued',
  MCOP: 'Miscellaneous credit', MDOP: 'Miscellaneous debit', LBOX: 'Lockbox', NTAV: 'Not available',
};
const SUBFAMILY: Record<string, string> = {
  ESCT: 'SEPA transfer', SDVA: 'same-day transfer', DMCT: 'domestic transfer', XBCT: 'cross-border transfer', BOOK: 'internal transfer',
  STDO: 'standing order', ESDD: 'SEPA direct debit', BBDD: 'SEPA business direct debit', CHRG: 'bank charges', INTR: 'interest',
  POSD: 'card payment', CWDL: 'cash withdrawal', SALA: 'salary', RRTN: 'return', PMDD: 'direct debit', CDPT: 'cash deposit', FEES: 'fees',
};
const SWIFT_TYPE: Record<string, string> = {
  TRF: 'Transfer', CHG: 'Charges', CHK: 'Cheque', DDT: 'Direct debit', INT: 'Interest', MSC: 'Miscellaneous', STO: 'Standing order',
  RTI: 'Returned item', CMI: 'Cash management', FEX: 'Foreign exchange', SAL: 'Salary', COM: 'Commission', DIV: 'Dividend', SEC: 'Securities',
  BOE: 'Bill of exchange', BRF: 'Brokerage fee', CLR: 'Cash letter', COL: 'Collection', DCR: 'Documentary credit', ECK: 'Eurocheque', EQA: 'Equivalent amount', LDP: 'Loan deposit', TCK: 'Travellers cheque', VDA: 'Value date adjustment', FCHG: 'Charges',
};

export function describeCode(domain: string, family: string, sub: string, proprietary = ''): string {
  if (family || sub) {
    const f = FAMILY[family] ?? '';
    const s = SUBFAMILY[sub] ?? '';
    if (f && s && !f.toLowerCase().includes(s)) return `${f} (${s})`;
    if (f || s) return f || s.charAt(0).toUpperCase() + s.slice(1);
  }
  return proprietary || [domain, family, sub].filter(Boolean).join('/') || '';
}

export function convertStatement(text: string): ConvertResult {
  const t = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).trimStart();
  if (t.startsWith('<')) return convertCamt(t);
  if (/:20:|:25:|:60[FM]:/.test(t)) return convertMt940(t);
  throw new Error('This does not look like a bank statement. Upload a camt.053 or camt.052 XML file, or an MT940 or MT942 file.');
}

// ---------- camt.052 / camt.053 / camt.054 ----------

function amountOf(n: XmlNode | undefined): number {
  return n ? Number(n.text.trim()) || 0 : 0;
}
const dateOf = (n: XmlNode | undefined): string => (val(n, 'Dt') || val(n, 'DtTm')).slice(0, 10);
const partyName = (p: XmlNode | undefined): string => val(p, 'Nm') || val(p, 'Pty/Nm');
const accountOf = (a: XmlNode | undefined): string => val(a, 'Id/IBAN') || val(a, 'Id/Othr/Id');

function convertCamt(text: string): ConvertResult {
  let doc: XmlNode;
  try {
    doc = parseXml(text);
  } catch (e) {
    throw new Error(e instanceof XmlError ? `The XML could not be read: ${e.message}` : 'The XML could not be read.');
  }
  const ns = Object.values(doc.attrs).find((v) => /camt\.\d{3}/.test(v)) ?? '';
  const msg = doc.children[0];
  const blocks = [...children(msg, 'Stmt'), ...children(msg, 'Rpt'), ...children(msg, 'Ntfctn')];
  if (!msg || !blocks.length) throw new Error('No statements were found. Upload a camt.053 (statement), camt.052 (intraday report) or camt.054 (notification) file.');
  const format = (/camt\.(\d{3})\.001\.(\d{2})/.exec(ns)?.slice(1).join('.001.') ?? msg.name).replace(/^/, 'camt.');
  const statements: Statement[] = [];
  const transactions: Transaction[] = [];
  const warnings: string[] = [];
  for (const s of blocks) {
    const id = val(s, 'Id') || val(s, 'ElctrncSeqNb') || `statement ${statements.length + 1}`;
    const acct = child(s, 'Acct');
    const account = accountOf(acct);
    const ccy = val(acct, 'Ccy') || child(s, 'Ntry/Amt')?.attrs.Ccy || '';
    const bal = (codes: string[]): number | null => {
      for (const b of children(s, 'Bal')) {
        const code = val(b, 'Tp/CdOrPrtry/Cd') || val(b, 'Tp/CdOrPrtry/Prtry');
        if (codes.includes(code)) {
          const amt = amountOf(child(b, 'Amt'));
          return val(b, 'CdtDbtInd') === 'DBIT' ? -amt : amt;
        }
      }
      return null;
    };
    const opening = bal(['OPBD', 'PRCD', 'OPAV', 'ITBD']);
    const closing = bal(['CLBD', 'ITBD', 'CLAV']);
    let credits = 0;
    let debits = 0;
    let count = 0;
    const dates: string[] = [];
    for (const e of children(s, 'Ntry')) {
      const status = val(e, 'Sts/Cd') || val(e, 'Sts') || 'BOOK';
      const sign = val(e, 'CdtDbtInd') === 'DBIT' ? -1 : 1;
      const entryAmt = amountOf(child(e, 'Amt'));
      const booking = dateOf(child(e, 'BookgDt'));
      const valueDate = dateOf(child(e, 'ValDt'));
      if (booking) dates.push(booking);
      const code = child(e, 'BkTxCd');
      const type = describeCode(val(code, 'Domn/Cd'), val(code, 'Domn/Fmly/Cd'), val(code, 'Domn/Fmly/SubFmlyCd'), val(code, 'Prtry/Cd'));
      if (status === 'BOOK') {
        if (sign > 0) credits += entryAmt;
        else debits += entryAmt;
      }
      const txs = findAll(e, 'TxDtls');
      const items = txs.length ? txs : [null];
      for (const tx of items) {
        const txAmt = tx ? amountOf(child(tx, 'AmtDtls/TxAmt/Amt') ?? child(tx, 'Amt')) : 0;
        const amount = items.length > 1 && txAmt ? txAmt : entryAmt;
        const parties = child(tx, 'RltdPties');
        const cpty = sign > 0 ? child(parties, 'Dbtr') : child(parties, 'Cdtr');
        const cptyAcct = sign > 0 ? child(parties, 'DbtrAcct') : child(parties, 'CdtrAcct');
        const ustrd = tx ? children(child(tx, 'RmtInf'), 'Ustrd').map((u) => u.text.trim()).join(' ') : '';
        const strd = tx ? val(tx, 'RmtInf/Strd/CdtrRefInf/Ref') : '';
        count++;
        transactions.push({
          statement: id,
          account,
          currency: child(e, 'Amt')?.attrs.Ccy ?? ccy,
          bookingDate: booking,
          valueDate,
          amount: round2(sign * amount),
          direction: sign > 0 ? 'In' : 'Out',
          counterparty: partyName(cpty) || partyName(child(parties, sign > 0 ? 'UltmtDbtr' : 'UltmtCdtr')),
          counterpartyAccount: accountOf(cptyAcct),
          reference: ustrd || strd || val(e, 'AddtlNtryInf') || val(tx, 'AddtlTxInf'),
          endToEndId: val(tx, 'Refs/EndToEndId').replace(/^NOTPROVIDED$/, ''),
          bankReference: val(e, 'AcctSvcrRef') || val(tx, 'Refs/AcctSvcrRef'),
          type,
          status: status === 'BOOK' ? 'Booked' : status === 'PDNG' ? 'Pending' : status,
        });
      }
    }
    dates.sort();
    const from = val(s, 'FrToDt/FrDtTm').slice(0, 10) || dates[0] || '';
    const to = val(s, 'FrToDt/ToDtTm').slice(0, 10) || dates[dates.length - 1] || '';
    const difference = opening !== null && closing !== null ? round2(opening + credits - debits - closing) + 0 : null;
    if (difference !== null && Math.abs(difference) >= 0.005) warnings.push(`Statement ${id}: opening balance plus transactions differs from the closing balance by ${difference.toFixed(2)} ${ccy}. Entries may be missing from the file.`);
    statements.push({ id, account, currency: ccy, from, to, opening, closing, credits: round2(credits), debits: round2(debits), count, difference });
  }
  return { format, statements, transactions, warnings };
}

// ---------- MT940 / MT942 ----------

function mtAmount(s: string): number {
  return Number(s.replace(',', '.')) || 0;
}
function mtDate(yymmdd: string): string {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = Number(yymmdd.slice(0, 2));
  return `${yy > 79 ? 19 : 20}${yymmdd.slice(0, 2)}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`;
}

/** Field 86 comes in several national layouts; pull out name, account and remittance where we can. */
export function parse86(info: string): { name: string; account: string; reference: string; e2e: string } {
  const flat = info.replace(/\r?\n/g, '');
  if (/\?\d{2}/.test(flat)) {
    // German structured layout: ?20-?29 remittance, ?30 bank code, ?31 account, ?32-?33 name.
    const parts: Record<string, string> = {};
    for (const m of flat.matchAll(/\?(\d{2})([^?]*)/g)) parts[m[1]] = (parts[m[1]] ?? '') + m[2];
    const rem = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '60', '61', '62', '63'].map((k) => parts[k] ?? '').join('');
    const e2e = /EREF\+([^+]*?)(?=[A-Z]{4}\+|$)/.exec(rem)?.[1]?.trim() ?? '';
    const svwz = /SVWZ\+(.*?)(?=[A-Z]{4}\+|$)/.exec(rem)?.[1]?.trim();
    return { name: `${parts['32'] ?? ''}${parts['33'] ?? ''}`.trim(), account: (parts['31'] ?? '').trim(), reference: (svwz ?? rem).trim(), e2e };
  }
  if (/\/(NAME|REMI|IBAN|EREF)\//.test(flat)) {
    // Dutch / SWIFT keyword layout: /NAME/.../REMI/.../IBAN/...
    const get = (k: string): string => (new RegExp(`/${k}/(.*?)(?=/[A-Z]{3,4}/|$)`).exec(flat)?.[1] ?? '').replace(/\/+$/, '').trim();
    const remi = get('REMI').replace(/^USTD\/\//, '').replace(/^STRD\/CUR\//, '');
    return { name: get('NAME'), account: get('IBAN') || get('ACCW'), reference: remi, e2e: get('EREF') };
  }
  return { name: '', account: '', reference: flat.trim(), e2e: '' };
}

function convertMt940(text: string): ConvertResult {
  const body = text.replace(/\{[1-3]:[^}]*\}/g, '').replace(/\{4:\s*/g, '').replace(/-\}/g, '\n:END:\n');
  // Split into tagged fields; a field runs until the next line that starts with :NN[A]:.
  const fields: { tag: string; value: string }[] = [];
  for (const line of body.split(/\r?\n/)) {
    const m = /^:(\d{2}[A-Z]?|END):(.*)$/.exec(line);
    if (m) fields.push({ tag: m[1], value: m[2] });
    else if (fields.length && line.trim()) fields[fields.length - 1].value += '\n' + line;
  }
  const statements: Statement[] = [];
  const transactions: Transaction[] = [];
  const warnings: string[] = [];
  let cur: Statement | null = null;
  let last: Transaction | null = null;
  const close = (): void => {
    if (!cur) return;
    cur.credits = round2(cur.credits);
    cur.debits = round2(cur.debits);
    cur.difference = cur.opening !== null && cur.closing !== null ? round2(cur.opening + cur.credits - cur.debits - cur.closing) + 0 : null;
    if (cur.difference !== null && Math.abs(cur.difference) >= 0.005) warnings.push(`Statement ${cur.id}: opening balance plus transactions differs from the closing balance by ${cur.difference.toFixed(2)} ${cur.currency}. Lines may be missing.`);
    statements.push(cur);
    cur = null;
  };
  const balance = (v: string): { amount: number; ccy: string; date: string } | null => {
    const m = /^([CD])(\d{6})([A-Z]{3})([\d,]+)/.exec(v.trim());
    return m ? { amount: (m[1] === 'D' ? -1 : 1) * mtAmount(m[4]), ccy: m[3], date: mtDate(m[2]) } : null;
  };
  for (const { tag, value } of fields) {
    if (tag === '20') {
      close();
      cur = { id: value.trim(), account: '', currency: '', from: '', to: '', opening: null, closing: null, credits: 0, debits: 0, count: 0, difference: null };
    } else if (!cur) continue;
    else if (tag === '25') cur.account = value.trim().replace(/^[A-Z]{6}[A-Z0-9]{2,5}\//, '');
    else if (tag === '28C') cur.id = `${cur.id} ${value.trim()}`.trim();
    else if (tag === '60F' || tag === '60M') {
      const b = balance(value);
      if (b) Object.assign(cur, { opening: b.amount, currency: b.ccy, from: b.date });
    } else if (tag === '62F' || tag === '62M') {
      const b = balance(value);
      if (b) Object.assign(cur, { closing: b.amount, to: b.date });
    } else if (tag === '61') {
      const [first, ...rest] = value.split('\n');
      const m = /^(\d{6})(\d{4})?(R?[CD])([A-Z])?([\d,]+)([A-Z][A-Z0-9]{3})([^/]*)(?:\/\/(.*))?$/.exec(first.trim());
      if (!m) {
        warnings.push(`A transaction line could not be read: "${first.trim()}".`);
        last = null;
        continue;
      }
      const credit = m[3] === 'C' || m[3] === 'RD';
      const amt = mtAmount(m[5]);
      const valueDate = mtDate(m[1]);
      const booking = m[2] ? `${valueDate.slice(0, 4)}-${m[2].slice(0, 2)}-${m[2].slice(2, 4)}` : valueDate;
      if (credit) cur.credits += amt;
      else cur.debits += amt;
      cur.count++;
      last = {
        statement: cur.id, account: cur.account, currency: cur.currency, bookingDate: booking, valueDate,
        amount: round2(credit ? amt : -amt), direction: credit ? 'In' : 'Out', counterparty: '', counterpartyAccount: '',
        reference: rest.join(' ').trim(), endToEndId: m[7].trim() === 'NONREF' ? '' : m[7].trim(), bankReference: (m[8] ?? '').trim(),
        type: (m[3].startsWith('R') ? 'Reversal: ' : '') + (SWIFT_TYPE[m[6].slice(1)] ?? SWIFT_TYPE[m[6]] ?? m[6]), status: 'Booked',
      };
      transactions.push(last);
    } else if (tag === '86' && last) {
      const p = parse86(value);
      last.counterparty = p.name;
      last.counterpartyAccount = p.account;
      last.reference = p.reference || last.reference;
      if (p.e2e) last.endToEndId = p.e2e;
    } else if (tag === 'END') close();
  }
  close();
  if (!statements.length) throw new Error('No statements were found. An MT940 file starts each statement with a :20: line.');
  return { format: fields.some((f) => f.tag === '34F') ? 'MT942' : 'MT940', statements, transactions, warnings };
}
