// Generated bank statement + cash ledger pairs with labelled answers, for tests, the benchmark and
// the website sample. Every way real statements and ledgers disagree is in here. Names are fictional.

import { makeIban } from '../../../engine/src/address/iban.ts';
import { toCsv } from '../../shared/csv.ts';
import { rng } from '../../ssi-checker/src/sample.ts';
import type { SampleStatement, SampleTx } from '../../bank-statement-converter/src/sample.ts';

export type Kind = 'reference' | 'reference-format' | 'amount-date' | 'combined' | 'combined-by-name' | 'part-payments' | 'reference-difference' | 'bank-only' | 'ledger-only';
export const KINDS: Kind[] = ['reference', 'reference-format', 'amount-date', 'combined', 'combined-by-name', 'part-payments', 'reference-difference', 'bank-only', 'ledger-only'];

export interface LedgerEntry {
  entry_id: string;
  date: string;
  counterparty: string;
  reference: string;
  description: string;
  amount: string;
}

export interface Generated {
  statement: SampleStatement;
  ledger: LedgerEntry[];
  /** For each statement line (in order): the ledger entry IDs it should match (empty = bank-only), and why. */
  bankLabels: { kind: Kind; ledger: string[] }[];
  /** Ledger entries that should stay open. */
  ledgerOnly: Set<string>;
  /** Ledger entries with the same amount as another item, put there to tempt a wrong match. */
  decoys: Set<string>;
}

const CUSTOMERS = ['Kestrel Textiles S.L.', 'Borealis Logistics GmbH', 'Cobalt Facilities B.V.', 'Northwind Retail SAS', 'Jasper Catering Ltd', 'Meridian Optics AG', 'Saffron Hotels Group Ltd', 'Pinecrest Clinics Oy', 'Quartz Media S.r.l.', 'Lumen Dental Sp. z o.o.'];
const SUPPLIERS = ['Unity Telecom GmbH', 'Harbor Freight Partners', 'Atlas Office Supplies Ltd', 'Vireo Cloud Services BV', 'Granite Property Management', 'Falcon Energy SE', 'Orchid Cleaning Services', 'Tidewater Insurance plc'];

export function generatePair(seed = 7, items = 40): Generated {
  const r = rng(seed);
  const int = (n: number): number => Math.floor(r() * n);
  const pickOf = <T>(xs: T[]): T => xs[int(xs.length)];
  const cents = (lo: number, hi: number): number => Math.round((lo + r() * (hi - lo)) * 100) / 100;
  const day = (n: number): string => `2026-11-${String(Math.min(30, Math.max(1, n))).padStart(2, '0')}`;
  const ledger: LedgerEntry[] = [];
  const bank: { tx: SampleTx; label: { kind: Kind; ledger: string[] } }[] = [];
  const ledgerOnly = new Set<string>();
  const decoys = new Set<string>();
  let inv = 24100 + seed * 1000;
  let je = 1;
  const fmt = (a: number): string => a.toFixed(2);
  const addLedger = (date: string, cp: string, ref: string, desc: string, amount: number): string => {
    const id = `JE-${String(je++).padStart(5, '0')}`;
    ledger.push({ entry_id: id, date, counterparty: cp, reference: ref, description: desc, amount: fmt(amount) });
    return id;
  };
  const iban = (name: string): string => makeIban('DE', String(370400440000000000n + BigInt([...name].reduce((s, c) => s * 31 + c.charCodeAt(0), 7) % 99999999)).padStart(18, '0'));
  const addBank = (date: string, amount: number, name: string, reference: string, kind: Kind, ids: string[], code: [string, string, string] = amount >= 0 ? ['RCDT', 'ESCT', 'TRF'] : ['ICDT', 'ESCT', 'TRF'], e2e = ''): void => {
    bank.push({ tx: { date, amount: Math.abs(Math.round(amount * 100) / 100), credit: amount >= 0, name, iban: name ? iban(name) : '', reference, e2e, family: code[0], sub: code[1], swift: code[2] }, label: { kind, ledger: ids } });
  };
  // How a payer writes our invoice number in their payment.
  const refStyles = [(n: number): string => `INV-${n}`, (n: number): string => `Invoice INV${n}`, (n: number): string => `Inv ${n} thank you`, (n: number): string => `Rechnung ${n}`, (n: number): string => `Payment ref ${n}`, (n: number): string => `FACTURE N° ${n}`];
  // How the bank shows the payer's name.
  const bankName = (n: string): string => [n, n.toUpperCase(), n.replace(/\s+(S\.L\.|GmbH|B\.V\.|SAS|Ltd|AG|Oy|S\.r\.l\.|Sp\. z o\.o\.|plc|SE|BV)$/i, '').toUpperCase()][int(3)];

  for (let i = 0; i < items; i++) {
    const u = r();
    const receipt = r() < 0.6;
    const cp = receipt ? pickOf(CUSTOMERS) : pickOf(SUPPLIERS);
    const sign = receipt ? 1 : -1;
    const d = 2 + int(24);
    const lag = int(4);
    const n = inv++;
    const ref = `INV-${n}`;
    if (u < 0.28) {
      const a = sign * cents(80, 9500);
      const id = addLedger(day(d), cp, ref, receipt ? `Receipt ${cp}` : `Payment ${cp}`, a);
      addBank(day(d + lag), a, bankName(cp), `Invoice ${ref}`, 'reference', [id], undefined, r() < 0.5 ? `E2E${n}` : '');
    } else if (u < 0.38) {
      const a = sign * cents(80, 9500);
      const id = addLedger(day(d), cp, ref, receipt ? `Receipt ${cp}` : `Payment ${cp}`, a);
      addBank(day(d + lag), a, bankName(cp), pickOf(refStyles)(n), 'reference-format', [id]);
    } else if (u < 0.55) {
      const a = sign * cents(40, 6000);
      const id = addLedger(day(d), cp, ref, receipt ? `Receipt ${cp}` : `Direct debit ${cp}`, a);
      addBank(day(d + lag), a, bankName(cp), receipt ? 'Payment' : pickOf(['Monthly fee', 'Direct debit', 'Subscription November']), 'amount-date', [id], receipt ? undefined : ['IDDT', 'ESDD', 'DDT']);
      if (r() < 0.35) {
        // Same amount, different party, nearby date: must not be taken.
        const other = pickOf((receipt ? CUSTOMERS : SUPPLIERS).filter((x) => x !== cp));
        const dec = addLedger(day(d + 1 - int(3)), other, `INV-${inv++}`, receipt ? `Receipt ${other}` : `Payment ${other}`, a);
        ledgerOnly.add(dec);
        decoys.add(dec);
      }
    } else if (u < 0.63) {
      const k = 2 + int(2);
      const ids: string[] = [];
      const refs: string[] = [];
      let total = 0;
      for (let j = 0; j < k; j++) {
        const a = cents(60, 3000);
        const rn = j === 0 ? n : inv++;
        ids.push(addLedger(day(d - int(10)), cp, `INV-${rn}`, `Receipt ${cp}`, a));
        refs.push(j % 2 ? String(rn) : `INV-${rn}`);
        total += a;
      }
      addBank(day(d + lag), Math.round(total * 100) / 100, bankName(cp), `Invoices ${refs.join(', ')}`, 'combined', ids);
    } else if (u < 0.68) {
      const ids: string[] = [];
      let total = 0;
      for (let j = 0; j < 2; j++) {
        const a = cents(60, 3000);
        ids.push(addLedger(day(d - int(12)), cp, `INV-${j === 0 ? n : inv++}`, `Receipt ${cp}`, a));
        total += a;
      }
      addBank(day(d + lag), Math.round(total * 100) / 100, bankName(cp), 'Settlement of open items', 'combined-by-name', ids);
    } else if (u < 0.73) {
      const a = cents(2000, 12000);
      const first = Math.round(a * (0.3 + r() * 0.4) * 100) / 100;
      const id = addLedger(day(d - 3), cp, ref, `Receipt ${cp}`, a);
      addBank(day(d), first, bankName(cp), `${ref} part 1`, 'part-payments', [id]);
      addBank(day(d + 2 + int(4)), Math.round((a - first) * 100) / 100, bankName(cp), `${ref} balance`, 'part-payments', [id]);
    } else if (u < 0.8) {
      const a = cents(500, 9000);
      const fee = pickOf([7.5, 12, 15, 18.5, 25, 35]);
      const id = addLedger(day(d), cp, ref, `Receipt ${cp} (foreign customer)`, a);
      addBank(day(d + lag), Math.round((a - fee) * 100) / 100, bankName(cp), `${pickOf(refStyles)(n)} less charges`, 'reference-difference', [id]);
    } else if (u < 0.89) {
      if (r() < 0.6) addBank(day(d), -pickOf([4.5, 9.9, 12.5, 25, 31.2]), '', pickOf(['Account maintenance fee', 'Transaction charges November', 'SEPA payment fee']), 'bank-only', [], ['ACMT', 'CHRG', 'CHG']);
      else addBank(day(d), cents(0.5, 40), '', 'Credit interest', 'bank-only', [], ['ACMT', 'INTR', 'INT']);
    } else {
      const a = sign * cents(100, 7000);
      const id = addLedger(day(27 + int(4)), cp, ref, receipt ? `Receipt ${cp}` : `Payment ${cp}`, a);
      ledgerOnly.add(id);
    }
  }

  bank.sort((x, y) => (x.tx.date < y.tx.date ? -1 : x.tx.date > y.tx.date ? 1 : 0));
  ledger.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  const opening = 48000;
  const net = bank.reduce((s, b) => s + (b.tx.credit ? b.tx.amount : -b.tx.amount), 0);
  return {
    statement: { account: 'DE89370400440532013000', currency: 'EUR', opening, closing: Math.round((opening + net) * 100) / 100, from: '2026-11-01', to: '2026-11-30', txs: bank.map((b) => b.tx) },
    ledger,
    bankLabels: bank.map((b) => b.label),
    ledgerOnly,
    decoys,
  };
}

export const ledgerCsv = (g: Generated): string => toCsv(g.ledger as unknown as Record<string, unknown>[], ['entry_id', 'date', 'counterparty', 'reference', 'description', 'amount']);

/** The statement as a plain bank CSV export, the third format people upload. */
export function statementCsv(s: SampleStatement): string {
  return toCsv(s.txs.map((t) => ({ date: t.date, counterparty: t.name, description: [t.reference, t.e2e].filter(Boolean).join(' '), amount: (t.credit ? t.amount : -t.amount).toFixed(2), currency: s.currency })));
}

/** A bank CSV with no name column and separate money in / money out columns: the payer's name is only in the text. */
export function statementCsvNoNames(s: SampleStatement): string {
  return toCsv(s.txs.map((t) => ({ 'Booking date': t.date.split('-').reverse().join('.'), Details: [t.name, t.reference, t.e2e].filter(Boolean).join(' '), 'Money in': t.credit ? t.amount.toFixed(2) : '', 'Money out': t.credit ? '' : t.amount.toFixed(2) })));
}
