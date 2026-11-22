// Builds credit transfer files (pain.001, version 3 or 9). Used by Excel to Payment File and to
// generate test files for the Payment File Doctor.

import { el, writeXml, type XmlNode } from '../../shared/xml.ts';

export interface Party {
  name: string;
  iban: string;
  bic?: string;
  /** Structured address. */
  address?: { street?: string; building?: string; postcode?: string; town?: string; country?: string };
  /** One-line address, written as AdrLine (the old style banks now reject on its own). */
  addressLines?: string[];
}

export interface Transfer {
  endToEndId: string;
  amount: string;
  currency?: string;
  payee: Party;
  reference: string;
}

export interface FileSpec {
  version: '03' | '09';
  messageId: string;
  createdAt: string;
  executionDate: string;
  payer: Party;
  batchId: string;
  transfers: Transfer[];
  /** Override header totals (to build deliberately broken test files). */
  headerCount?: string;
  headerSum?: string;
  chargeBearer?: string;
}

const sumOf = (ts: Transfer[]): string => (ts.reduce((s, t) => s + Math.round(Number(t.amount) * 100), 0) / 100).toFixed(2);

function address(p: Party): XmlNode | null {
  if (p.address) {
    const a = p.address;
    return el('PstlAdr', {}, [
      a.street ? el('StrtNm', {}, a.street) : null,
      a.building ? el('BldgNb', {}, a.building) : null,
      a.postcode ? el('PstCd', {}, a.postcode) : null,
      a.town ? el('TwnNm', {}, a.town) : null,
      a.country ? el('Ctry', {}, a.country) : null,
    ]);
  }
  if (p.addressLines?.length) return el('PstlAdr', {}, p.addressLines.map((l) => el('AdrLine', {}, l)));
  return null;
}

export function buildPain001(spec: FileSpec): string {
  const v9 = spec.version === '09';
  const bicTag = v9 ? 'BICFI' : 'BIC';
  const count = String(spec.transfers.length);
  const sum = sumOf(spec.transfers);
  const agent = (bic?: string): XmlNode => el('FinInstnId', {}, bic ? [el(bicTag, {}, bic)] : [el('Othr', {}, [el('Id', {}, 'NOTPROVIDED')])]);
  const doc = el('Document', { xmlns: `urn:iso:std:iso:20022:tech:xsd:pain.001.001.${spec.version}` }, [
    el('CstmrCdtTrfInitn', {}, [
      el('GrpHdr', {}, [
        el('MsgId', {}, spec.messageId),
        el('CreDtTm', {}, spec.createdAt),
        el('NbOfTxs', {}, spec.headerCount ?? count),
        el('CtrlSum', {}, spec.headerSum ?? sum),
        el('InitgPty', {}, [el('Nm', {}, spec.payer.name)]),
      ]),
      el('PmtInf', {}, [
        el('PmtInfId', {}, spec.batchId),
        el('PmtMtd', {}, 'TRF'),
        el('NbOfTxs', {}, spec.headerCount ?? count),
        el('CtrlSum', {}, spec.headerSum ?? sum),
        el('PmtTpInf', {}, [el('SvcLvl', {}, [el('Cd', {}, 'SEPA')])]),
        v9 ? el('ReqdExctnDt', {}, [el('Dt', {}, spec.executionDate)]) : el('ReqdExctnDt', {}, spec.executionDate),
        el('Dbtr', {}, [el('Nm', {}, spec.payer.name), address(spec.payer)]),
        el('DbtrAcct', {}, [el('Id', {}, [el('IBAN', {}, spec.payer.iban)])]),
        el('DbtrAgt', {}, [agent(spec.payer.bic)]),
        el('ChrgBr', {}, spec.chargeBearer ?? 'SLEV'),
        ...spec.transfers.map((t) =>
          el('CdtTrfTxInf', {}, [
            el('PmtId', {}, [el('EndToEndId', {}, t.endToEndId)]),
            el('Amt', {}, [el('InstdAmt', { Ccy: t.currency ?? 'EUR' }, t.amount)]),
            t.payee.bic ? el('CdtrAgt', {}, [el('FinInstnId', {}, [el(bicTag, {}, t.payee.bic)])]) : null,
            el('Cdtr', {}, [el('Nm', {}, t.payee.name), address(t.payee)]),
            el('CdtrAcct', {}, [el('Id', {}, [el('IBAN', {}, t.payee.iban)])]),
            el('RmtInf', {}, [el('Ustrd', {}, t.reference)]),
          ]),
        ),
      ]),
    ]),
  ]);
  return writeXml(doc);
}
