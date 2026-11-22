// Generates matching MT103 / pacs.008 pairs with known content, for tests and the benchmark.
import { makeIban } from '../../../engine/src/address/iban.ts';
import { rng } from '../../ssi-checker/src/sample.ts';
import { toMt103 } from './explain.ts';
import { emptyParty, emptyPayment, type Payment } from './model.ts';
import { toPacs008 } from './pacs008.ts';

const NAMES = ['REDWOOD TEXTILES GMBH', 'KESTREL LOGISTICS SAS', 'HARBOR PACKAGING BV', 'SUMMIT FOODS LTD', 'GRANITE METALS AG', 'PETER MAIER', 'ANNA SCHMIDT', 'NORTHWIND FREIGHT NV'];
/** Addresses whose town and country are known, for the structuring check. */
export const ADDRESSES: { lines: string[]; town: string; country: string }[] = [
  { lines: ['HAUPTSTRASSE 12', '10115 BERLIN'], town: 'BERLIN', country: 'DE' },
  { lines: ['12 RUE DE RIVOLI', '75001 PARIS', 'FRANCE'], town: 'PARIS', country: 'FR' },
  { lines: ['KEIZERSGRACHT 100', '1015 CJ AMSTERDAM'], town: 'AMSTERDAM', country: 'NL' },
  { lines: ['221B BAKER STREET', 'LONDON NW1 6XE', 'UNITED KINGDOM'], town: 'LONDON', country: 'GB' },
  { lines: ['CALLE MAYOR 5', '28013 MADRID', 'SPAIN'], town: 'MADRID', country: 'ES' },
  { lines: ['VIA ROMA 20', '20121 MILANO', 'ITALY'], town: 'MILANO', country: 'IT' },
  { lines: ['BAHNHOFSTRASSE 45', '8001 ZURICH', 'SWITZERLAND'], town: 'ZURICH', country: 'CH' },
  { lines: ['RUE ROYALE 10', '1000 BRUXELLES', 'BELGIUM'], town: 'BRUXELLES', country: 'BE' },
];
const BICS = ['BANKBEBB', 'BANKDEFF', 'DEUTDEFF', 'BNPAFRPP', 'INGBNL2A', 'BARCGB22', 'CHASUS33', 'UBSWCHZH80A', 'COBADEFFXXX'];
const CTRY = ['DE', 'FR', 'NL', 'BE', 'IT', 'ES', 'GB'];

export interface Pair {
  truth: Payment;
  mt: string;
  mx: string;
  /** Index into ADDRESSES used for each free-text party, or -1. */
  debtorAddress: number;
  creditorAddress: number;
}

export function generatePair(seed: number): Pair {
  const r = rng(seed);
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const d = (k: number) => Array.from({ length: k }, () => Math.floor(r() * 10)).join('');
  const hex = (k: number) => Array.from({ length: k }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('');
  const p = emptyPayment('MT103');
  p.ref = `REF${d(8)}`;
  p.uetr = `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
  p.valueDate = `2026-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`;
  p.currency = pick(['EUR', 'USD', 'GBP', 'CHF']);
  p.amount = Math.round(r() * 5000000 + 100) / 100;
  if (r() < 0.4) {
    p.instructedCurrency = r() < 0.5 ? p.currency : pick(['EUR', 'USD']);
    p.instructedAmount = p.amount;
    if (p.instructedCurrency !== p.currency) p.rate = (0.8 + r() * 0.4).toFixed(4);
  }
  p.charges = pick(['OUR', 'SHA', 'BEN']);
  if (p.charges === 'BEN') p.senderCharges = [`${p.currency}${(5 + Math.floor(r() * 30)).toFixed(2)}`];
  p.bankOperation = 'CRED';
  p.sender = pick(BICS);
  p.receiver = pick(BICS.filter((b) => b !== p.sender));
  if (r() < 0.3) p.intermediary = pick(BICS);
  if (r() < 0.4) p.creditorAgent = pick(BICS);
  const mkParty = () => {
    const x = emptyParty();
    x.name = pick(NAMES);
    x.account = makeIban(pick(CTRY), d(18));
    return x;
  };
  p.debtor = mkParty();
  p.creditor = mkParty();
  let debtorAddress = -1, creditorAddress = -1;
  for (const role of ['debtor', 'creditor'] as const) {
    const x = r();
    const a = Math.floor(r() * ADDRESSES.length);
    if (x < 0.4) {
      // free text only
      p[role].lines = [...ADDRESSES[a].lines];
      if (role === 'debtor') debtorAddress = a;
      else creditorAddress = a;
    } else if (x < 0.8) {
      // hybrid / structured
      p[role].town = ADDRESSES[a].town;
      p[role].country = ADDRESSES[a].country;
      p[role].lines = [ADDRESSES[a].lines[0]];
    }
  }
  p.remittance = r() < 0.8 ? `INVOICE ${d(6)}` : '';
  const mt = toMt103(p);
  const mx = toPacs008(p, { createdAt: '2026-11-22T10:00:00+00:00' });
  return { truth: p, mt, mx, debtorAddress, creditorAddress };
}

/** The fields both formats must carry identically. */
export function sameCore(a: Payment, b: Payment): string[] {
  const diffs: string[] = [];
  const cmp = (k: string, x: unknown, y: unknown) => {
    if (JSON.stringify(x) !== JSON.stringify(y)) diffs.push(`${k}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`);
  };
  cmp('ref', a.ref, b.ref);
  cmp('uetr', a.uetr, b.uetr);
  cmp('valueDate', a.valueDate, b.valueDate);
  cmp('currency', a.currency, b.currency);
  cmp('amount', a.amount, b.amount);
  cmp('instructedAmount', a.instructedAmount, b.instructedAmount);
  cmp('rate', a.rate, b.rate);
  cmp('charges', a.charges, b.charges);
  const bic = (x: string) => x.replace(/XXX$/, '');
  cmp('sender', bic(a.sender), bic(b.sender));
  cmp('receiver', bic(a.receiver), bic(b.receiver));
  cmp('intermediary', bic(a.intermediary), bic(b.intermediary));
  cmp('debtor.name', a.debtor.name, b.debtor.name);
  cmp('debtor.account', a.debtor.account, b.debtor.account);
  cmp('creditor.name', a.creditor.name, b.creditor.name);
  cmp('creditor.account', a.creditor.account, b.creditor.account);
  cmp('creditor.town', a.creditor.town.toUpperCase(), b.creditor.town.toUpperCase());
  cmp('creditor.country', a.creditor.country, b.creditor.country);
  cmp('remittance', a.remittance, b.remittance);
  return diffs;
}
