// Payment File Doctor: explains why a bank rejected a credit transfer file (pain.001) in plain
// English and produces a corrected file. It upgrades version 3 files to version 9, splits
// one-line addresses into structured fields, fixes control totals and replaces characters banks
// refuse. Anything it cannot fix safely is reported, never guessed.

import { bicCountry, ibanValid } from '../../../engine/src/address/iban.ts';
import { decide, structureRecord } from '../../../engine/src/address/repair.ts';
import { isCountryCode } from '../../../engine/src/address/countries.ts';
import { child, children, el, findAll, parseXml, val, writeXml, XmlError, type XmlNode } from '../../shared/xml.ts';

export type Level = 'error' | 'warning';

export interface Finding {
  level: Level;
  code: string;
  /** Where in the file: "File", "Batch PMT-1" or "Payment 3 (E2E-0003) to Kestrel Textiles". */
  where: string;
  message: string;
  /** What the doctor did, or what you need to do. */
  action: string;
  fixed: boolean;
}

export interface PaymentRow {
  batch: string;
  endToEndId: string;
  payee: string;
  iban: string;
  amount: string;
  currency: string;
  executionDate: string;
  status: 'ok' | 'fixed' | 'error';
}

export interface DoctorResult {
  fileType: string;
  versionFound: string;
  versionOut: string;
  payments: PaymentRow[];
  findings: Finding[];
  /** Corrected file, or null when the input could not be read at all. */
  fixedXml: string | null;
  errorsLeft: number;
  fixedCount: number;
  totals: { count: number; sum: string; currency: string };
}

export interface DoctorOptions {
  /** Version to produce. Default 9 (pain.001.001.09), what most European banks now ask for. */
  target?: '03' | '09';
  /** Reference date for "execution date in the past" (defaults to today). */
  today?: Date;
}

const NS = (v: string): string => `urn:iso:std:iso:20022:tech:xsd:pain.001.001.${v}`;

/** The SEPA character set: anything else is commonly rejected. */
const SEPA_CHARS = /[^A-Za-z0-9/\-?:().,'+ ]/g;
const TRANSLIT: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss', æ: 'ae', Æ: 'AE', ø: 'o', Ø: 'O', å: 'a', Å: 'A',
  œ: 'oe', Œ: 'OE', ł: 'l', Ł: 'L', đ: 'd', Đ: 'D', '&': '+', '@': '(at)', _: '-', ';': ',', '"': "'", '`': "'", '!': '.', '*': '.', '#': '', '%': '', '=': '-', '[': '(', ']': ')', '{': '(', '}': ')', '<': '(', '>': ')', '|': '/', '\\': '/', '~': '-', '–': '-', '—': '-', '’': "'", '‘': "'", '“': "'", '”': "'",
};

export function toSepaChars(s: string): string {
  return s
    .replace(/[^\x00-\x7f]|[&@_;"`!*#%=[\]{}<>|\\~]/g, (c) => TRANSLIT[c] ?? c.normalize('NFKD').replace(/\p{M}/gu, ''))
    .replace(SEPA_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const TEXT_FIELDS = ['Nm', 'Ustrd', 'AdrLine', 'StrtNm', 'TwnNm', 'BldgNm', 'CtrySubDvsn', 'Dept', 'SubDept'];
const MAXLEN: Record<string, number> = { Nm: 70, Ustrd: 140, AdrLine: 70, StrtNm: 70, TwnNm: 35, BldgNb: 16, BldgNm: 35, PstCd: 16, CtrySubDvsn: 35, MsgId: 35, PmtInfId: 35, EndToEndId: 35, InstrId: 35 };
const ADDRESS_ORDER = ['AdrTp', 'Dept', 'SubDept', 'StrtNm', 'BldgNb', 'BldgNm', 'Flr', 'PstBx', 'Room', 'PstCd', 'TwnNm', 'TwnLctnNm', 'DstrctNm', 'CtrySubDvsn', 'Ctry', 'AdrLine'];

function cents(s: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(s.trim())) return null;
  return Math.round(Number(s) * 100);
}
const fmt = (c: number): string => (c / 100).toFixed(2);

export function diagnose(xml: string, opts: DoctorOptions = {}): DoctorResult {
  const target = opts.target ?? '09';
  const today = opts.today ?? new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const findings: Finding[] = [];
  const add = (level: Level, code: string, where: string, message: string, action: string, fixed: boolean): void => {
    findings.push({ level, code, where, message, action, fixed });
  };
  const empty = (fileType: string): DoctorResult => ({ fileType, versionFound: '', versionOut: '', payments: [], findings, fixedXml: null, errorsLeft: findings.filter((f) => f.level === 'error').length, fixedCount: 0, totals: { count: 0, sum: '0.00', currency: '' } });

  let doc: XmlNode;
  try {
    doc = parseXml(xml);
  } catch (e) {
    add('error', 'NOT_XML', 'File', e instanceof XmlError ? e.message : 'The file could not be read as XML.', 'Export the payment file again from your system; it looks damaged or is not an XML payment file.', false);
    return empty('Unreadable');
  }
  const ns = doc.attrs.xmlns ?? Object.entries(doc.attrs).find(([k]) => k.startsWith('xmlns'))?.[1] ?? '';
  const ver = /pain\.(\d{3})\.001\.(\d{2})/.exec(ns);
  const init = child(doc, 'CstmrCdtTrfInitn');
  if (doc.name !== 'Document' || !init) {
    const kind = child(doc, 'CstmrDrctDbtInitn') ? 'a direct debit file (pain.008)' : ver ? `a pain.${ver[1]} file` : `an XML file with root <${doc.name}>`;
    add('error', 'NOT_CREDIT_TRANSFER', 'File', `This is ${kind}, not a credit transfer payment file (pain.001).`, 'Upload the credit transfer file your bank rejected. Direct debit files are not supported yet.', false);
    return empty(kind);
  }
  const versionFound = ver ? ver[2] : 'unknown';
  if (!ver) add('warning', 'NO_NAMESPACE', 'File', 'The file does not declare which pain.001 version it is.', `Set to version ${target}.`, true);
  else if (versionFound !== target) {
    add('error', 'VERSION', 'File', `The file is version ${Number(versionFound)} (pain.001.001.${versionFound}). Most European banks now only accept version ${Number(target)} (pain.001.001.${target}).`, `Converted to version ${Number(target)}: new namespace, execution date wrapped in a date element, BIC fields renamed.`, true);
  }
  doc.attrs = { xmlns: NS(target), ...Object.fromEntries(Object.entries(doc.attrs).filter(([k]) => k !== 'xmlns' && !/^xmlns:(?!xsi)/.test(k))) };

  // Version-specific structure.
  if (target === '09') {
    for (const n of findAll(doc, 'BIC')) n.name = 'BICFI';
    for (const d of findAll(doc, 'ReqdExctnDt')) {
      if (!d.children.length) {
        const v = d.text.trim();
        d.text = '';
        d.children = [el('Dt', {}, v)];
      }
    }
  } else {
    for (const n of findAll(doc, 'BICFI')) n.name = 'BIC';
    for (const d of findAll(doc, 'ReqdExctnDt')) {
      const inner = child(d, 'Dt') ?? child(d, 'DtTm');
      if (inner) {
        d.text = inner.text.trim().slice(0, 10);
        d.children = [];
      }
    }
  }

  const grp = child(init, 'GrpHdr');
  const msgId = val(grp, 'MsgId');
  if (!msgId) add('error', 'MISSING', 'File', 'The file has no message ID (MsgId).', 'Export the file again; your system should fill this in.', false);
  else if (msgId.length > 35) add('error', 'TOO_LONG', 'File', `The message ID is ${msgId.length} characters; the limit is 35.`, 'Shorten the message ID in your payment system.', false);

  const payments: PaymentRow[] = [];
  const seenE2E = new Map<string, string>();
  let fileCount = 0;
  let fileSum = 0;
  let currency = '';
  const batches = children(init, 'PmtInf');
  if (!batches.length) add('error', 'NO_PAYMENTS', 'File', 'The file contains no payment batches (PmtInf).', 'Export the file again with at least one payment.', false);

  const fixText = (node: XmlNode, where: string): void => {
    for (const n of [node, ...findAllNodes(node)]) {
      if (!TEXT_FIELDS.includes(n.name) || n.children.length) continue;
      const before = n.text.trim();
      if (!before) continue;
      let after = toSepaChars(before);
      if (after !== before) {
        add('warning', 'CHARACTERS', where, `"${before}" contains characters banks often refuse in ${label(n.name)}.`, `Replaced with "${after}".`, true);
      }
      const max = MAXLEN[n.name];
      if (max && after.length > max) {
        add('warning', 'TOO_LONG', where, `${label(n.name)} is ${after.length} characters; the limit is ${max}.`, `Shortened to ${max} characters.`, true);
        after = after.slice(0, max).trim();
      }
      n.text = after;
    }
  };

  const fixAddress = (party: XmlNode | undefined, where: string, who: string): boolean => {
    const adr = child(party, 'PstlAdr');
    if (!party || !adr) return true;
    const get = (k: string): string => val(adr, k);
    const lines = children(adr, 'AdrLine').map((l) => l.text.trim()).filter(Boolean);
    const ctry = get('Ctry').toUpperCase();
    if (ctry && !isCountryCode(ctry)) {
      add('error', 'COUNTRY', where, `The ${who}'s country "${ctry}" is not a valid ISO country code.`, 'Correct the country code (two letters, e.g. DE).', false);
      return false;
    }
    const structured = !!get('TwnNm') && !!ctry;
    if (structured && lines.length <= 2) return true;
    if (!lines.length && !get('TwnNm')) {
      if (!ctry) return true;
      add('error', 'ADDRESS', where, `The ${who}'s address has a country but no town.`, 'Add the town to this address in your system.', false);
      return false;
    }
    // One-line or hybrid address without a town: structure it with the address rules.
    const text = [get('StrtNm') && `${get('StrtNm')} ${get('BldgNb')}`.trim(), get('PstCd'), ...lines].filter(Boolean).join(', ');
    const { result } = structureRecord({ address_text: text, country: ctry || undefined });
    const a = result.address;
    if (decide(result) === 'auto' && a.TwnNm && a.Ctry) {
      const fields: Record<string, string | undefined> = { StrtNm: a.StrtNm, BldgNb: a.BldgNb, BldgNm: a.BldgNm, Flr: a.Flr, PstBx: a.PstBx, Room: a.Room, PstCd: a.PstCd, TwnNm: a.TwnNm, CtrySubDvsn: a.CtrySubDvsn, Ctry: a.Ctry };
      adr.children = ADDRESS_ORDER.flatMap((k) => (k === 'AdrLine' ? (a.AdrLine ?? []).slice(0, 2).map((l) => el('AdrLine', {}, l)) : fields[k] ? [el(k, {}, fields[k]!)] : []));
      add('error', 'ADDRESS', where, `The ${who}'s address is one line of text ("${text}"). Banks now require at least the town and country as separate fields.`, `Split into ${[a.StrtNm && `street "${a.StrtNm}"`, a.BldgNb && `number "${a.BldgNb}"`, a.PstCd && `postcode "${a.PstCd}"`, `town "${a.TwnNm}"`, `country ${a.Ctry}`].filter(Boolean).join(', ')}.`, true);
      return true;
    }
    const why = result.issues.map((x) => x.message).join(' ') || 'the town or country could not be identified with confidence';
    add('error', 'ADDRESS', where, `The ${who}'s address is one line of text ("${text}") and could not be split safely: ${why}`, 'Enter the street, postcode, town and country as separate fields in your system and export the file again.', false);
    return false;
  };

  batches.forEach((b, bi) => {
    const bId = val(b, 'PmtInfId') || `batch ${bi + 1}`;
    const bWhere = `Batch ${bId}`;
    const svc = val(b, 'PmtTpInf/SvcLvl/Cd');
    const sepa = svc === 'SEPA';
    const dateNode = child(b, 'ReqdExctnDt');
    const date = (child(dateNode, 'Dt')?.text ?? dateNode?.text ?? '').trim();
    if (!date) add('error', 'MISSING', bWhere, 'The batch has no requested execution date.', 'Set a payment date in your system.', false);
    else if (date < todayStr) add('warning', 'PAST_DATE', bWhere, `The execution date ${date} is in the past.`, 'Most banks reject or move past dates. Set today or a future business day.', false);
    else {
      const wd = new Date(`${date}T00:00:00Z`).getUTCDay();
      if (wd === 0 || wd === 6) add('warning', 'WEEKEND', bWhere, `The execution date ${date} is a weekend.`, 'The bank will usually pay on the next business day.', false);
    }
    const dbtr = child(b, 'Dbtr');
    const dIban = val(b, 'DbtrAcct/Id/IBAN');
    const dIbanNode = child(b, 'DbtrAcct/Id/IBAN');
    if (dIbanNode && /\s|[a-z]/.test(dIbanNode.text.trim())) {
      dIbanNode.text = dIbanNode.text.replace(/\s+/g, '').toUpperCase();
      add('warning', 'IBAN_FORMAT', bWhere, 'Your own IBAN contains spaces or lower-case letters.', 'Removed the spaces and capitalised it.', true);
    }
    if (dIban && !ibanValid(dIban)) add('error', 'IBAN', bWhere, `Your own account IBAN "${dIban}" fails the check digits.`, 'Correct your account IBAN in the payment system.', false);
    fixText(dbtr ?? el('x'), bWhere);
    fixAddress(dbtr, bWhere, 'payer');
    const chrg = child(b, 'ChrgBr');
    if (sepa && chrg && chrg.text.trim() !== 'SLEV') {
      add('warning', 'CHARGES', bWhere, `SEPA payments must use charge bearer SLEV, not ${chrg.text.trim()}.`, 'Changed to SLEV.', true);
      chrg.text = 'SLEV';
    }

    let bCount = 0;
    let bSum = 0;
    children(b, 'CdtTrfTxInf').forEach((tx, ti) => {
      const e2e = val(tx, 'PmtId/EndToEndId') || `#${ti + 1}`;
      const payee = val(tx, 'Cdtr/Nm');
      const where = `Payment ${fileCount + bCount + 1} (${e2e})${payee ? ` to ${payee}` : ''}`;
      const before = findings.filter((f) => f.level === 'error' && !f.fixed).length;
      const beforeFixed = findings.filter((f) => f.fixed).length;
      const amtNode = child(tx, 'Amt/InstdAmt');
      const ccy = amtNode?.attrs.Ccy ?? '';
      const c = amtNode ? cents(amtNode.text) : null;
      if (!amtNode) add('error', 'MISSING', where, 'The payment has no amount.', 'Add the amount in your system.', false);
      else if (c === null) add('error', 'AMOUNT', where, `The amount "${amtNode.text.trim()}" is not a valid amount (digits with up to two decimals, using a dot).`, 'Correct the amount in your system.', false);
      else if (c <= 0) add('error', 'AMOUNT', where, 'The amount is zero or negative.', 'Remove this payment or correct the amount.', false);
      else if (c > 99_999_999_999) add('error', 'AMOUNT', where, 'The amount is above the SEPA maximum of 999,999,999.99.', 'Split the payment.', false);
      if (sepa && ccy && ccy !== 'EUR') add('error', 'CURRENCY', where, `SEPA payments must be in EUR; this one is in ${ccy}.`, 'Send it as a non-SEPA payment, or change the currency.', false);
      if (c !== null && c > 0) {
        bSum += c;
        currency ||= ccy;
      }
      if (e2e.length > 35) add('error', 'TOO_LONG', where, `The end-to-end reference is ${e2e.length} characters; the limit is 35.`, 'Shorten the reference in your system.', false);
      if (seenE2E.has(e2e)) add('warning', 'DUPLICATE_REF', where, `The end-to-end reference ${e2e} is also used by ${seenE2E.get(e2e)}.`, 'Check this is not the same payment twice; references should be unique.', false);
      seenE2E.set(e2e, where);
      if (!payee) add('error', 'MISSING', where, 'The payee has no name.', 'Add the payee name in your system.', false);
      const ibanNode = child(tx, 'CdtrAcct/Id/IBAN');
      if (!ibanNode) add('error', 'MISSING', where, 'The payee has no IBAN.', 'Add the payee IBAN in your system.', false);
      else {
        if (/\s|[a-z]/.test(ibanNode.text.trim())) {
          ibanNode.text = ibanNode.text.replace(/\s+/g, '').toUpperCase();
          add('warning', 'IBAN_FORMAT', where, 'The payee IBAN contains spaces or lower-case letters.', 'Removed the spaces and capitalised it.', true);
        }
        if (!ibanValid(ibanNode.text.trim())) add('error', 'IBAN', where, `The payee IBAN "${ibanNode.text.trim()}" fails the check digits, so it is mistyped.`, 'Get the correct IBAN from the payee; it cannot be fixed automatically.', false);
      }
      const bicNode = child(tx, 'CdtrAgt/FinInstnId/BICFI') ?? child(tx, 'CdtrAgt/FinInstnId/BIC');
      if (bicNode) {
        const bic = bicNode.text.replace(/\s+/g, '').toUpperCase();
        if (bic !== bicNode.text.trim()) bicNode.text = bic;
        const bc = bicCountry(bic);
        if (!bc) add('error', 'BIC', where, `The payee bank code (BIC) "${bic}" is not a valid 8 or 11 character BIC.`, sepa ? 'For SEPA payments the BIC is optional: remove it or correct it.' : 'Correct the BIC.', false);
        else if (ibanNode && bc !== ibanNode.text.trim().slice(0, 2) && !(bc === 'MC' || bc === 'SM')) add('warning', 'BIC_COUNTRY', where, `The BIC is for country ${bc} but the IBAN is for ${ibanNode.text.trim().slice(0, 2)}.`, 'Check the payee bank details.', false);
      }
      fixText(tx, where);
      fixAddress(child(tx, 'Cdtr'), where, 'payee');
      const ok = findings.filter((f) => f.level === 'error' && !f.fixed).length === before;
      payments.push({ batch: bId, endToEndId: e2e, payee: val(tx, 'Cdtr/Nm'), iban: ibanNode?.text.trim() ?? '', amount: c !== null ? fmt(c) : amtNode?.text.trim() ?? '', currency: ccy, executionDate: date, status: !ok ? 'error' : findings.filter((f) => f.fixed).length > beforeFixed ? 'fixed' : 'ok' });
      bCount++;
    });

    const nb = child(b, 'NbOfTxs');
    const cs = child(b, 'CtrlSum');
    if (nb && Number(nb.text.trim()) !== bCount) {
      add('error', 'COUNT', bWhere, `The batch says it has ${nb.text.trim()} payments but contains ${bCount}.`, `Corrected to ${bCount}.`, true);
      nb.text = String(bCount);
    }
    if (cs && cents(cs.text) !== bSum) {
      add('error', 'CONTROL_SUM', bWhere, `The batch control total says ${cs.text.trim()} but the payments add up to ${fmt(bSum)}.`, `Corrected to ${fmt(bSum)}.`, true);
      cs.text = fmt(bSum);
    }
    fileCount += bCount;
    fileSum += bSum;
  });

  const gnb = child(grp, 'NbOfTxs');
  const gcs = child(grp, 'CtrlSum');
  if (gnb && Number(gnb.text.trim()) !== fileCount) {
    add('error', 'COUNT', 'File', `The file header says ${gnb.text.trim()} payments but the file contains ${fileCount}.`, `Corrected to ${fileCount}.`, true);
    gnb.text = String(fileCount);
  }
  if (gcs && cents(gcs.text) !== fileSum) {
    add('error', 'CONTROL_SUM', 'File', `The file control total says ${gcs.text.trim()} but the payments add up to ${fmt(fileSum)}.`, `Corrected to ${fmt(fileSum)}.`, true);
    gcs.text = fmt(fileSum);
  }
  fixText(child(grp, 'InitgPty') ?? el('x'), 'File');

  const errorsLeft = findings.filter((f) => f.level === 'error' && !f.fixed).length;
  return {
    fileType: 'Credit transfer (pain.001)',
    versionFound,
    versionOut: target,
    payments,
    findings,
    fixedXml: writeXml(doc),
    errorsLeft,
    fixedCount: findings.filter((f) => f.fixed).length,
    totals: { count: fileCount, sum: fmt(fileSum), currency },
  };
}

function findAllNodes(n: XmlNode, out: XmlNode[] = []): XmlNode[] {
  for (const c of n.children) {
    out.push(c);
    findAllNodes(c, out);
  }
  return out;
}

function label(tag: string): string {
  return ({ Nm: 'the name', Ustrd: 'the payment reference', AdrLine: 'the address', StrtNm: 'the street', TwnNm: 'the town', BldgNm: 'the building name', CtrySubDvsn: 'the region' } as Record<string, string>)[tag] ?? tag;
}
