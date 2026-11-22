// Returns and Rejects Triage: reads a status report (pain.002, pacs.002), a return (pacs.004)
// or a CSV of reason codes, explains every rejected or returned payment and groups them by root cause.

import { parseCsv, pick } from '../../shared/csv.ts';
import { child, findAll, parseXml, val, type XmlNode } from '../../shared/xml.ts';
import { explain, GROUP_FIX, type Group, type Who } from './codes.ts';

export interface Item {
  ref: string;
  name: string;
  iban: string;
  amount: number | null;
  currency: string;
  status: string;
  code: string;
  info: string;
  meaning: string;
  group: Group;
  who: Who;
  fix: string;
}

export interface GroupSummary {
  group: Group;
  count: number;
  amounts: Record<string, number>;
  codes: string[];
  who: Who[];
  fix: string;
}

export interface Repeat {
  key: string;
  name: string;
  count: number;
  codes: string[];
}

export interface TriageResult {
  format: string;
  total: number;
  accepted: number;
  pending: number;
  items: Item[];
  groups: GroupSummary[];
  repeats: Repeat[];
  fileLevel: Item[];
}

const REJECT = new Set(['RJCT', 'RETN', 'CANC', 'RTRN', 'RETURNED', 'REJECTED']);
const PENDING = new Set(['PDNG', 'ACTC', 'RCVD', 'PART']);

function reason(n: XmlNode | undefined): { code: string; info: string } {
  const r = child(n, 'Rsn');
  const code = val(r, 'Cd') || val(r, 'Prtry');
  const info = n ? n.children.filter((c) => c.name === 'AddtlInf').map((c) => c.text.trim()).join(' ') : '';
  return { code, info };
}

function amountOf(ref: XmlNode | undefined, ...paths: string[]): { amount: number | null; currency: string } {
  for (const p of paths) {
    const a = child(ref, p);
    if (a && a.text.trim()) return { amount: Number(a.text.trim()), currency: a.attrs.Ccy ?? '' };
  }
  return { amount: null, currency: '' };
}

function party(ref: XmlNode | undefined, role: 'Cdtr' | 'Dbtr'): { name: string; iban: string } {
  const p = child(ref, role);
  return {
    name: val(p, 'Nm') || val(p, 'Pty/Nm'),
    iban: val(ref, `${role}Acct/Id/IBAN`) || val(ref, `${role}Acct/Id/Othr/Id`),
  };
}

function makeItem(ref: string, name: string, iban: string, amount: number | null, currency: string, status: string, code: string, info: string): Item {
  const e = explain(code);
  return { ref, name, iban: iban.replace(/\s+/g, '').toUpperCase(), amount, currency, status, code: e.code, info, meaning: e.meaning, group: e.group, who: e.who, fix: e.fix };
}

function fromXml(text: string): { format: string; total: number; accepted: number; pending: number; items: Item[]; fileLevel: Item[] } {
  const root = parseXml(text);
  const doc = root.name === 'Document' ? root.children[0] : root;
  if (!doc) throw new Error('The XML file is empty.');
  const items: Item[] = [];
  const fileLevel: Item[] = [];
  let total = 0, accepted = 0, pending = 0;
  if (doc.name === 'PmtRtr') {
    for (const tx of findAll(doc, 'TxInf')) {
      total++;
      const ref = child(tx, 'OrgnlTxRef');
      const { amount, currency } = amountOf(tx, 'RtrdIntrBkSttlmAmt', 'RtrdInstdAmt');
      const p = party(ref, 'Cdtr');
      const r = reason(child(tx, 'RtrRsnInf'));
      items.push(makeItem(val(tx, 'OrgnlEndToEndId') || val(tx, 'OrgnlInstrId') || val(tx, 'RtrId'), p.name, p.iban, amount, currency, 'RETN', r.code, r.info));
    }
    return { format: 'pacs.004 payment return', total, accepted, pending, items, fileLevel };
  }
  if (doc.name !== 'CstmrPmtStsRpt' && doc.name !== 'FIToFIPmtStsRpt') throw new Error(`This is a ${doc.name} file. Use a payment status report (pain.002 or pacs.002), a return (pacs.004) or a CSV.`);
  const format = doc.name === 'CstmrPmtStsRpt' ? 'pain.002 payment status report' : 'pacs.002 payment status report';
  for (const g of findAll(doc, 'OrgnlGrpInfAndSts')) {
    const st = val(g, 'GrpSts');
    if (REJECT.has(st)) {
      const r = reason(child(g, 'StsRsnInf'));
      fileLevel.push(makeItem(val(g, 'OrgnlMsgId'), 'Whole file', '', Number(val(g, 'OrgnlCtrlSum')) || null, '', st, r.code, r.info));
    }
  }
  for (const pi of findAll(doc, 'OrgnlPmtInfAndSts')) {
    const st = val(pi, 'PmtInfSts');
    if (REJECT.has(st) && !children(pi).some((c) => c.name === 'TxInfAndSts')) {
      const r = reason(child(pi, 'StsRsnInf'));
      fileLevel.push(makeItem(val(pi, 'OrgnlPmtInfId'), 'Whole batch', '', null, '', st, r.code, r.info));
    }
  }
  for (const tx of findAll(doc, 'TxInfAndSts')) {
    total++;
    const st = val(tx, 'TxSts');
    if (!REJECT.has(st)) {
      if (PENDING.has(st)) pending++;
      else accepted++;
      continue;
    }
    const ref = child(tx, 'OrgnlTxRef');
    const { amount, currency } = amountOf(ref, 'Amt/InstdAmt', 'IntrBkSttlmAmt', 'Amt/EqvtAmt/Amt');
    const p = party(ref, 'Cdtr');
    const r = reason(child(tx, 'StsRsnInf'));
    items.push(makeItem(val(tx, 'OrgnlEndToEndId') || val(tx, 'OrgnlInstrId'), p.name, p.iban, amount, currency, st, r.code, r.info));
  }
  return { format, total, accepted, pending, items, fileLevel };
}

const children = (n: XmlNode): XmlNode[] => n.children;

export const CSV_COLUMNS = {
  code: ['reason_code', 'return_code', 'reject_code', 'status_reason', 'reason', 'code', 'rsn_cd'],
  ref: ['end_to_end_id', 'endtoendid', 'e2e', 'reference', 'payment_reference', 'instruction_id', 'id'],
  name: ['beneficiary', 'beneficiary_name', 'creditor', 'creditor_name', 'vendor', 'vendor_name', 'name', 'payee'],
  iban: ['iban', 'beneficiary_iban', 'creditor_iban', 'account', 'account_number'],
  amount: ['amount', 'instructed_amount', 'value'],
  currency: ['currency', 'ccy'],
  status: ['status', 'tx_status', 'txsts'],
  info: ['additional_info', 'info', 'description', 'narrative'],
};

function fromCsv(text: string): { format: string; total: number; accepted: number; pending: number; items: Item[]; fileLevel: Item[] } {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('The file has no rows.');
  if (!rows.some((r) => pick(r, ...CSV_COLUMNS.code))) throw new Error('No reason code column was found. Name it reason_code, return_code or status_reason.');
  const items: Item[] = [];
  let accepted = 0, pending = 0;
  for (const r of rows) {
    const code = pick(r, ...CSV_COLUMNS.code).trim();
    const st = pick(r, ...CSV_COLUMNS.status).trim().toUpperCase();
    if (!code && (!st || !REJECT.has(st))) {
      if (PENDING.has(st)) pending++;
      else accepted++;
      continue;
    }
    const amt = pick(r, ...CSV_COLUMNS.amount).replace(/[^\d.,-]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
    items.push(makeItem(pick(r, ...CSV_COLUMNS.ref), pick(r, ...CSV_COLUMNS.name), pick(r, ...CSV_COLUMNS.iban), amt ? Number(amt) : null, pick(r, ...CSV_COLUMNS.currency).toUpperCase(), st || 'RJCT', code, pick(r, ...CSV_COLUMNS.info)));
  }
  return { format: 'CSV list of returns', total: rows.length, accepted, pending, items, fileLevel: [] };
}

export function triage(text: string): TriageResult {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const base = clean.trimStart().startsWith('<') ? fromXml(clean) : fromCsv(clean);
  const byGroup = new Map<Group, GroupSummary>();
  for (const it of [...base.fileLevel, ...base.items]) {
    let g = byGroup.get(it.group);
    if (!g) byGroup.set(it.group, (g = { group: it.group, count: 0, amounts: {}, codes: [], who: [], fix: GROUP_FIX[it.group] }));
    g.count++;
    if (it.amount !== null && it.currency) g.amounts[it.currency] = Math.round(((g.amounts[it.currency] ?? 0) + it.amount) * 100) / 100;
    if (!g.codes.includes(it.code)) g.codes.push(it.code);
    if (!g.who.includes(it.who)) g.who.push(it.who);
  }
  const groups = [...byGroup.values()].sort((a, b) => b.count - a.count);
  const rep = new Map<string, Repeat>();
  for (const it of base.items) {
    const key = it.iban || it.name.toLowerCase();
    if (!key) continue;
    const r = rep.get(key) ?? { key, name: it.name, count: 0, codes: [] };
    r.count++;
    if (!r.codes.includes(it.code)) r.codes.push(it.code);
    rep.set(key, r);
  }
  const repeats = [...rep.values()].filter((r) => r.count > 1).sort((a, b) => b.count - a.count);
  return { ...base, groups, repeats };
}
