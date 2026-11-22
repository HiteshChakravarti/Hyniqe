// Reads and writes pacs.008 (FI to FI customer credit transfer), CBPR+ style.
import { child, el, findAll, parseXml, val, writeXml, type XmlNode } from '../../shared/xml.ts';
import { CHARGES_MT_TO_MX, CHARGES_MX_TO_MT, emptyParty, emptyPayment, type Party, type Payment } from './model.ts';

const bic = (n: XmlNode | undefined): string => val(n, 'FinInstnId/BICFI') || val(n, 'FinInstnId/BIC');

function party(p: XmlNode | undefined, acct: XmlNode | undefined): Party {
  const out = emptyParty();
  if (!p) return out;
  const pty = child(p, 'Pty') ?? p;
  out.name = val(pty, 'Nm');
  out.bic = val(pty, 'Id/OrgId/AnyBIC');
  const a = child(pty, 'PstlAdr');
  if (a) {
    out.street = val(a, 'StrtNm');
    out.building = val(a, 'BldgNb');
    out.postcode = val(a, 'PstCd');
    out.town = val(a, 'TwnNm');
    out.country = val(a, 'Ctry');
    out.lines = a.children.filter((c) => c.name === 'AdrLine').map((c) => c.text.trim());
  }
  out.account = val(acct, 'Id/IBAN') || val(acct, 'Id/Othr/Id');
  return out;
}

export function parsePacs008(text: string): Payment {
  const root = parseXml(text);
  const msg = root.name === 'FIToFICstmrCdtTrf' ? root : findAll(root, 'FIToFICstmrCdtTrf')[0];
  if (!msg) throw new Error(`This XML is not a pacs.008 customer credit transfer (it starts with <${root.name}>).`);
  const tx = child(msg, 'CdtTrfTxInf');
  const p = emptyPayment('pacs.008');
  const hdr = findAll(root, 'AppHdr')[0];
  p.sender = val(hdr, 'Fr/FIId/FinInstnId/BICFI') || bic(child(tx, 'InstgAgt')) || bic(child(msg, 'GrpHdr/InstgAgt'));
  p.receiver = val(hdr, 'To/FIId/FinInstnId/BICFI') || bic(child(tx, 'InstdAgt')) || bic(child(msg, 'GrpHdr/InstdAgt'));
  p.ref = val(tx, 'PmtId/InstrId') || val(msg, 'GrpHdr/MsgId');
  p.endToEnd = val(tx, 'PmtId/EndToEndId');
  p.uetr = val(tx, 'PmtId/UETR').toLowerCase();
  const sa = child(tx, 'IntrBkSttlmAmt');
  p.currency = sa?.attrs.Ccy ?? '';
  p.amount = sa ? Number(sa.text.trim()) : null;
  p.valueDate = val(tx, 'IntrBkSttlmDt') || val(msg, 'GrpHdr/IntrBkSttlmDt');
  const ia = child(tx, 'InstdAmt');
  if (ia) {
    p.instructedCurrency = ia.attrs.Ccy ?? '';
    p.instructedAmount = Number(ia.text.trim());
  }
  p.rate = val(tx, 'XchgRate');
  p.charges = CHARGES_MX_TO_MT[val(tx, 'ChrgBr')] ?? val(tx, 'ChrgBr');
  p.senderCharges = tx ? tx.children.filter((c) => c.name === 'ChrgsInf').map((c) => `${child(c, 'Amt')?.attrs.Ccy ?? ''}${val(c, 'Amt')}`) : [];
  p.bankOperation = 'CRED';
  p.debtor = party(child(tx, 'Dbtr'), child(tx, 'DbtrAcct'));
  p.creditor = party(child(tx, 'Cdtr'), child(tx, 'CdtrAcct'));
  p.debtorAgent = bic(child(tx, 'DbtrAgt'));
  p.creditorAgent = bic(child(tx, 'CdtrAgt'));
  p.intermediary = bic(child(tx, 'IntrmyAgt1'));
  p.remittance = tx ? findAll(tx, 'Ustrd').map((n) => n.text.trim()).join(' ') : '';
  p.bankInfo = tx ? [...findAll(tx, 'InstrForNxtAgt'), ...findAll(tx, 'InstrForCdtrAgt')].map((n) => val(n, 'InstrInf')).filter(Boolean).join(' ') : '';
  p.regulatory = tx ? findAll(tx, 'RgltryRptg').map((n) => findAll(n, 'Inf').map((i) => i.text.trim()).join(' ')).join(' ') : '';
  return p;
}

const fin = (b: string) => el('FinInstnId', {}, [el('BICFI', {}, b)]);
const amt = (n: number) => n.toFixed(2);

/** Postal address for the converted message: structured fields where known, hybrid otherwise. */
function pstlAdr(p: Party, structured?: { street?: string; building?: string; postcode?: string; town?: string; country?: string; lines?: string[] }): XmlNode | null {
  const s = structured ?? p;
  const lines = structured ? structured.lines ?? [] : p.lines;
  if (!s.town && !s.country && !lines.length) return null;
  return el('PstlAdr', {}, [
    s.street ? el('StrtNm', {}, s.street) : null,
    s.building ? el('BldgNb', {}, s.building) : null,
    s.postcode ? el('PstCd', {}, s.postcode) : null,
    s.town ? el('TwnNm', {}, s.town) : null,
    s.country ? el('Ctry', {}, s.country) : null,
    ...lines.slice(0, s.town && s.country ? 2 : 7).map((l) => el('AdrLine', {}, l.slice(0, 70))),
  ]);
}

function acct(a: string): XmlNode | null {
  if (!a) return null;
  const isIban = /^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(a.replace(/\s/g, ''));
  return el('Id', {}, [isIban ? el('IBAN', {}, a.replace(/\s/g, '')) : el('Othr', {}, [el('Id', {}, a)])]);
}

export interface Structured {
  debtor?: Parameters<typeof pstlAdr>[1];
  creditor?: Parameters<typeof pstlAdr>[1];
}

export function toPacs008(p: Payment, opts: { createdAt?: string; structured?: Structured } = {}): string {
  const created = opts.createdAt ?? new Date().toISOString().slice(0, 19) + '+00:00';
  const tx = el('CdtTrfTxInf', {}, [
    el('PmtId', {}, [el('InstrId', {}, p.ref.slice(0, 35)), el('EndToEndId', {}, (p.endToEnd || 'NOTPROVIDED').slice(0, 35)), p.uetr ? el('UETR', {}, p.uetr) : null]),
    el('IntrBkSttlmAmt', { Ccy: p.currency }, amt(p.amount ?? 0)),
    el('IntrBkSttlmDt', {}, p.valueDate),
    p.instructedAmount !== null ? el('InstdAmt', { Ccy: p.instructedCurrency }, amt(p.instructedAmount)) : null,
    p.rate ? el('XchgRate', {}, p.rate) : null,
    el('ChrgBr', {}, CHARGES_MT_TO_MX[p.charges] ?? 'SHAR'),
    ...p.senderCharges.map((c) => {
      const m = /^([A-Z]{3})([\d.]+)$/.exec(c);
      return m ? el('ChrgsInf', {}, [el('Amt', { Ccy: m[1] }, amt(Number(m[2]))), el('Agt', {}, [fin(p.sender)])]) : null;
    }),
    el('InstgAgt', {}, [fin(p.sender)]),
    el('InstdAgt', {}, [fin(p.receiver)]),
    p.intermediary && /^[A-Z]{6}/.test(p.intermediary) ? el('IntrmyAgt1', {}, [fin(p.intermediary)]) : null,
    el('Dbtr', {}, [el('Nm', {}, p.debtor.name.slice(0, 140)), pstlAdr(p.debtor, opts.structured?.debtor), p.debtor.bic ? el('Id', {}, [el('OrgId', {}, [el('AnyBIC', {}, p.debtor.bic)])]) : null]),
    p.debtor.account ? el('DbtrAcct', {}, [acct(p.debtor.account)]) : null,
    el('DbtrAgt', {}, [fin(p.debtorAgent || p.sender)]),
    el('CdtrAgt', {}, [fin(p.creditorAgent || p.receiver)]),
    el('Cdtr', {}, [el('Nm', {}, p.creditor.name.slice(0, 140)), pstlAdr(p.creditor, opts.structured?.creditor), p.creditor.bic ? el('Id', {}, [el('OrgId', {}, [el('AnyBIC', {}, p.creditor.bic)])]) : null]),
    p.creditor.account ? el('CdtrAcct', {}, [acct(p.creditor.account)]) : null,
    p.bankInfo ? el('InstrForNxtAgt', {}, [el('InstrInf', {}, p.bankInfo.slice(0, 140))]) : null,
    p.regulatory ? el('RgltryRptg', {}, [el('Dtls', {}, [el('Inf', {}, p.regulatory.slice(0, 35))])]) : null,
    p.remittance ? el('RmtInf', {}, [el('Ustrd', {}, p.remittance.slice(0, 140))]) : null,
  ]);
  const doc = el('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08' }, [
    el('FIToFICstmrCdtTrf', {}, [
      el('GrpHdr', {}, [el('MsgId', {}, p.ref.slice(0, 35)), el('CreDtTm', {}, created), el('NbOfTxs', {}, '1'), el('SttlmInf', {}, [el('SttlmMtd', {}, 'INDA')])]),
      tx,
    ]),
  ]);
  return writeXml(doc);
}
