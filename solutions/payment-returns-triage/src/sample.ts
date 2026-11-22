// Labelled status reports and returns in several formats, for tests and the benchmark.
import { makeIban } from '../../../engine/src/address/iban.ts';
import { toCsv } from '../../shared/csv.ts';
import { rng } from '../../ssi-checker/src/sample.ts';
import { CODES } from './codes.ts';

export type Format = 'pain.002.001.03' | 'pain.002.001.10' | 'pacs.002.001.10' | 'pacs.004.001.09' | 'csv';
export const FORMATS: Format[] = ['pain.002.001.03', 'pain.002.001.10', 'pacs.002.001.10', 'pacs.004.001.09', 'csv'];

export interface Truth {
  ref: string;
  code: string;
  amount: number;
  currency: string;
  name: string;
}

const NAMES = ['Redwood Textiles GmbH', 'Kestrel Logistics SAS', 'Harbor Packaging B.V.', 'Summit Foods Ltd', 'Bluebell Print S.L.', 'Granite Metals AG', 'Northwind Freight NV', 'Meridian Software S.r.l.', 'Falcon Tooling Oy', 'Lumen Catering Ltd'];
const COMMON = ['AC04', 'AC01', 'BE04', 'RR03', 'AM04', 'AC06', 'BE01', 'MS03', 'AM05', 'RC01', 'MD01', 'FF01'];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function generateStatus(opts: { seed?: number; count?: number; rejectRate?: number; format?: Format } = {}): { text: string; truth: Truth[]; total: number; format: Format } {
  const r = rng(opts.seed ?? 5);
  const format = opts.format ?? 'pain.002.001.10';
  const count = opts.count ?? 40;
  const ibans = NAMES.map((_, i) => makeIban(['DE', 'FR', 'NL', 'GB', 'ES', 'AT', 'BE', 'IT', 'FI', 'IE'][i], String(100000000000000000 + Math.floor(r() * 1e15)).slice(0, 18)));
  const home = NAMES.map(() => COMMON[Math.floor(r() * COMMON.length)]);
  const txs: { ref: string; name: string; iban: string; amount: number; status: string; code: string; info: string }[] = [];
  for (let i = 0; i < count; i++) {
    const v = Math.floor(r() * NAMES.length);
    const rejected = format === 'pacs.004.001.09' || r() < (opts.rejectRate ?? 0.35);
    const x = r();
    const code = rejected ? (x < 0.6 ? home[v] : x < 0.85 ? COMMON[Math.floor(r() * COMMON.length)] : CODES[Math.floor(r() * CODES.length)].code) : '';
    txs.push({ ref: `E2E-${String(1000 + i)}`, name: NAMES[v], iban: ibans[v], amount: Math.round(r() * 2500000) / 100 + 10, status: rejected ? 'RJCT' : r() < 0.85 ? 'ACSC' : 'PDNG', code, info: code === 'NARR' ? 'Beneficiary bank reports account frozen' : '' });
  }
  const truth = txs.filter((t) => t.code).map((t) => ({ ref: t.ref, code: t.code, amount: t.amount, currency: 'EUR', name: t.name }));
  if (format === 'csv') {
    return { text: toCsv(txs.map((t) => ({ end_to_end_id: t.ref, beneficiary_name: t.name, iban: t.iban.replace(/(.{4})/g, '$1 ').trim(), amount: t.amount.toFixed(2), currency: 'EUR', status: t.status, reason_code: t.code, additional_info: t.info }))), truth, total: count, format };
  }
  const v = format.split('.').slice(-1)[0];
  const cdtr = (t: (typeof txs)[number]) => (format === 'pain.002.001.03' ? `<Cdtr><Nm>${esc(t.name)}</Nm></Cdtr>` : `<Cdtr><Pty><Nm>${esc(t.name)}</Nm></Pty></Cdtr>`);
  const rsn = (t: (typeof txs)[number], tag: string) => `<${tag}><Rsn><Cd>${t.code}</Cd></Rsn>${t.info ? `<AddtlInf>${esc(t.info)}</AddtlInf>` : ''}</${tag}>`;
  let body: string;
  const ns = `urn:iso:std:iso:20022:tech:xsd:${format}`;
  if (format === 'pacs.004.001.09') {
    body = `<PmtRtr><GrpHdr><MsgId>RTR-${opts.seed ?? 5}</MsgId><CreDtTm>2026-11-20T09:00:00</CreDtTm><NbOfTxs>${count}</NbOfTxs></GrpHdr>${txs
      .map((t) => `<TxInf><RtrId>R${t.ref}</RtrId><OrgnlEndToEndId>${t.ref}</OrgnlEndToEndId><RtrdIntrBkSttlmAmt Ccy="EUR">${t.amount.toFixed(2)}</RtrdIntrBkSttlmAmt>${rsn(t, 'RtrRsnInf')}<OrgnlTxRef>${cdtr(t)}<CdtrAcct><Id><IBAN>${t.iban}</IBAN></Id></CdtrAcct></OrgnlTxRef></TxInf>`)
      .join('')}</PmtRtr>`;
  } else {
    const root = format.startsWith('pain') ? 'CstmrPmtStsRpt' : 'FIToFIPmtStsRpt';
    const amt = (t: (typeof txs)[number]) => (format.startsWith('pain') ? `<Amt><InstdAmt Ccy="EUR">${t.amount.toFixed(2)}</InstdAmt></Amt>` : `<IntrBkSttlmAmt Ccy="EUR">${t.amount.toFixed(2)}</IntrBkSttlmAmt>`);
    const tx = txs.map((t) => `<TxInfAndSts><OrgnlEndToEndId>${t.ref}</OrgnlEndToEndId><TxSts>${t.status}</TxSts>${t.code ? rsn(t, 'StsRsnInf') : ''}<OrgnlTxRef>${amt(t)}${cdtr(t)}<CdtrAcct><Id><IBAN>${t.iban}</IBAN></Id></CdtrAcct></OrgnlTxRef></TxInfAndSts>`).join('');
    const grp = `<OrgnlGrpInfAndSts><OrgnlMsgId>PAY-RUN-${v}</OrgnlMsgId><OrgnlMsgNmId>pain.001.001.09</OrgnlMsgNmId><GrpSts>PART</GrpSts></OrgnlGrpInfAndSts>`;
    body = format.startsWith('pain')
      ? `<${root}><GrpHdr><MsgId>STS-${v}</MsgId><CreDtTm>2026-11-20T09:00:00</CreDtTm></GrpHdr>${grp}<OrgnlPmtInfAndSts><OrgnlPmtInfId>BATCH-1</OrgnlPmtInfId>${tx}</OrgnlPmtInfAndSts></${root}>`
      : `<${root}><GrpHdr><MsgId>STS-${v}</MsgId><CreDtTm>2026-11-20T09:00:00</CreDtTm></GrpHdr>${grp}${tx}</${root}>`;
  }
  const text = `<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="${ns}">${body}</Document>\n`;
  return { text, truth, total: count, format };
}
