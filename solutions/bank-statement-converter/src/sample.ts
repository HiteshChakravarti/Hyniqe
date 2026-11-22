// Generated bank statements (camt.053 version 8 and MT940) with the same transactions, for the
// tests and the website samples. All names and accounts are fictional.

import { makeIban } from '../../../engine/src/address/iban.ts';
import { el, writeXml } from '../../shared/xml.ts';
import { rng } from '../../ssi-checker/src/sample.ts';

export interface SampleTx {
  date: string;
  amount: number;
  credit: boolean;
  name: string;
  iban: string;
  reference: string;
  e2e: string;
  family: string;
  sub: string;
  swift: string;
}

export interface SampleStatement {
  account: string;
  currency: string;
  opening: number;
  closing: number;
  from: string;
  to: string;
  txs: SampleTx[];
}

const PARTIES = ['Kestrel Textiles S.L.', 'Borealis Logistics GmbH', 'Cobalt Facilities BV', 'Northwind Retail SAS', 'Jasper Catering Ltd', 'Unity Telecom GmbH', 'Harbor Freight Partners'];

export function sampleStatement(seed = 4, count = 18): SampleStatement {
  const r = rng(seed);
  const int = (n: number): number => Math.floor(r() * n);
  const txs: SampleTx[] = [];
  for (let i = 0; i < count; i++) {
    const credit = r() < 0.45;
    const kind = credit ? (r() < 0.8 ? ['RCDT', 'ESCT', 'TRF'] : ['RCDT', 'SALA', 'SAL']) : [['ICDT', 'ESCT', 'TRF'], ['IDDT', 'ESDD', 'DDT'], ['CCRD', 'POSD', 'MSC'], ['ACMT', 'CHRG', 'CHG']][int(4)];
    const charge = kind[1] === 'CHRG';
    txs.push({
      date: `2026-11-${String(2 + Math.floor((i * 26) / count)).padStart(2, '0')}`,
      amount: charge ? 12.5 : Math.round((50 + r() * 9000) * 100) / 100,
      credit,
      name: charge ? '' : PARTIES[int(PARTIES.length)],
      iban: charge ? '' : makeIban('DE', String(370400440532000000n + BigInt(int(9999))).padStart(18, '0')),
      reference: charge ? 'Account maintenance fee November' : credit ? `Payment invoice INV-${10400 + i}` : `Invoice ${77000 + i} thank you`,
      e2e: charge ? '' : `E2E${String(560000 + i)}`,
      family: kind[0],
      sub: kind[1],
      swift: kind[2],
    });
  }
  const opening = 25000;
  const net = txs.reduce((s, t) => s + (t.credit ? t.amount : -t.amount), 0);
  return { account: 'DE89370400440532013000', currency: 'EUR', opening, closing: Math.round((opening + net) * 100) / 100, from: '2026-11-01', to: '2026-11-30', txs };
}

export function toCamt053(s: SampleStatement): string {
  const amt = (n: number): ReturnType<typeof el> => el('Amt', { Ccy: s.currency }, Math.abs(n).toFixed(2));
  const bal = (code: string, n: number, d: string): ReturnType<typeof el> =>
    el('Bal', {}, [el('Tp', {}, [el('CdOrPrtry', {}, [el('Cd', {}, code)])]), amt(n), el('CdtDbtInd', {}, n < 0 ? 'DBIT' : 'CRDT'), el('Dt', {}, [el('Dt', {}, d)])]);
  const doc = el('Document', { xmlns: 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.08' }, [
    el('BkToCstmrStmt', {}, [
      el('GrpHdr', {}, [el('MsgId', {}, 'STMT-20261130-001'), el('CreDtTm', {}, '2026-11-30T23:00:00')]),
      el('Stmt', {}, [
        el('Id', {}, 'STMT-2026-11'),
        el('ElctrncSeqNb', {}, '11'),
        el('CreDtTm', {}, '2026-11-30T23:00:00'),
        el('FrToDt', {}, [el('FrDtTm', {}, `${s.from}T00:00:00`), el('ToDtTm', {}, `${s.to}T23:59:59`)]),
        el('Acct', {}, [el('Id', {}, [el('IBAN', {}, s.account)]), el('Ccy', {}, s.currency)]),
        bal('OPBD', s.opening, s.from),
        bal('CLBD', s.closing, s.to),
        ...s.txs.map((t, i) =>
          el('Ntry', {}, [
            el('NtryRef', {}, String(i + 1)),
            amt(t.amount),
            el('CdtDbtInd', {}, t.credit ? 'CRDT' : 'DBIT'),
            el('Sts', {}, [el('Cd', {}, 'BOOK')]),
            el('BookgDt', {}, [el('Dt', {}, t.date)]),
            el('ValDt', {}, [el('Dt', {}, t.date)]),
            el('AcctSvcrRef', {}, `BANKREF${String(900100 + i)}`),
            el('BkTxCd', {}, [el('Domn', {}, [el('Cd', {}, 'PMNT'), el('Fmly', {}, [el('Cd', {}, t.family), el('SubFmlyCd', {}, t.sub)])])]),
            el('NtryDtls', {}, [
              el('TxDtls', {}, [
                el('Refs', {}, [el('EndToEndId', {}, t.e2e || 'NOTPROVIDED')]),
                t.name
                  ? el('RltdPties', {}, t.credit
                      ? [el('Dbtr', {}, [el('Pty', {}, [el('Nm', {}, t.name)])]), el('DbtrAcct', {}, [el('Id', {}, [el('IBAN', {}, t.iban)])])]
                      : [el('Cdtr', {}, [el('Pty', {}, [el('Nm', {}, t.name)])]), el('CdtrAcct', {}, [el('Id', {}, [el('IBAN', {}, t.iban)])])])
                  : null,
                el('RmtInf', {}, [el('Ustrd', {}, t.reference)]),
              ]),
            ]),
          ]),
        ),
      ]),
    ]),
  ]);
  return writeXml(doc);
}

export function toMt940(s: SampleStatement): string {
  const d = (iso: string): string => iso.slice(2).replace(/-/g, '');
  const a = (n: number): string => Math.abs(n).toFixed(2).replace('.', ',');
  const lines = [':20:STMT-2026-11', `:25:COBADEFFXXX/${s.account}`, ':28C:11/1', `:60F:${s.opening < 0 ? 'D' : 'C'}${d(s.from)}${s.currency}${a(s.opening)}`];
  s.txs.forEach((t, i) => {
    lines.push(`:61:${d(t.date)}${t.date.slice(5).replace('-', '')}${t.credit ? 'C' : 'D'}${a(t.amount)}N${t.swift}${t.e2e || 'NONREF'}//BANKREF${900100 + i}`);
    const rem = `${t.e2e ? `EREF+${t.e2e}` : ''}SVWZ+${t.reference}`;
    const chunks = rem.match(/.{1,27}/g) ?? [];
    const sub = chunks.map((c, k) => `?${20 + k}${c}`).join('');
    lines.push(`:86:${t.credit ? '166' : '116'}?00${t.credit ? 'GUTSCHRIFT' : 'UEBERWEISUNG'}${sub}${t.iban ? `?31${t.iban}` : ''}${t.name ? `?32${t.name.slice(0, 27)}` : ''}`);
  });
  lines.push(`:62F:${s.closing < 0 ? 'D' : 'C'}${d(s.to)}${s.currency}${a(s.closing)}`, '-');
  return lines.join('\r\n') + '\r\n';
}
