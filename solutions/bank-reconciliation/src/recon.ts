// Bank Reconciliation: match a bank statement (camt.053/052, MT940/942 or CSV) against the cash
// ledger (CSV), the way an accountant does it: by reference first, then combined and part payments,
// then amount, date and name. Everything left over is explained, so the difference always adds up.

import { convertStatement } from '../../bank-statement-converter/src/statement.ts';
import { pick, parseCsv, type Row } from '../../shared/csv.ts';
import { parseAmount } from '../../duplicate-payments/src/duplicates.ts';
import { nameSim, supplierKey, type Vendor } from '../../vendor-master-cleanup/src/vendors.ts';

export interface Line {
  side: 'bank' | 'ledger';
  index: number;
  id: string;
  date: string;
  day: number | null;
  /** Signed, from the bank account's point of view: money in is positive. */
  cents: number;
  currency: string;
  name: string;
  nameKey: string;
  text: string;
  refs: string[];
}

export type MatchKind = 'reference' | 'combined' | 'part-payments' | 'reference-difference' | 'amount-date' | 'combined-by-name';

export interface Match {
  kind: MatchKind;
  bank: number[];
  ledger: number[];
  /** Bank minus ledger, in cents. Zero except for 'reference-difference'. */
  difference: number;
  confidence: 'high' | 'medium';
  why: string;
}

export interface Open {
  line: number;
  side: 'bank' | 'ledger';
  reason: string;
  action: string;
  /** Possible matches we would not pick on our own. */
  candidates: number[];
}

export interface ReconResult {
  bankFormat: string;
  bank: Line[];
  ledger: Line[];
  matches: Match[];
  openBank: Open[];
  openLedger: Open[];
  totals: {
    bank: number;
    ledger: number;
    matchedBank: number;
    openBank: number;
    openLedger: number;
    differences: number;
    /** bank - ledger - (openBank - openLedger + differences). Always 0: the proof that every cent is explained. */
    unexplained: number;
  };
  matchedShare: number;
  ledgerSignFlipped: boolean;
  warnings: string[];
}

export interface ReconOptions {
  /** Days a bank booking may differ from the ledger date. */
  windowDays?: number;
  /** Largest difference accepted on a reference match (bank charges, FX), in cents. */
  maxDifference?: number;
}

// ---------- reading ----------

const DAY = 86_400_000;
export function toDay(s: string): number | null {
  if (!s) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY);
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(s.trim());
  if (m) return Math.floor(Date.UTC(+m[3], +m[2] - 1, +m[1]) / DAY);
  m = /^(\d{4})(\d{2})(\d{2})$/.exec(s.trim());
  if (m) return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY);
  return null;
}
const isoOf = (day: number | null, raw: string): string => (day === null ? raw : new Date(day * DAY).toISOString().slice(0, 10));

const REF_PREFIX = /^(?:INVOICE|RECHNUNG|FACTURE|FACTURA|FATTURA|INVNO|INV|RE|RG|FAC|FA|BILL|NO|NR|NUM|REF|DOC)+(?=\d)/;

/** Reference tokens in free text: invoice numbers, end-to-end IDs, document numbers. Dates, IBANs and amounts are ignored. */
export function refsIn(text: string): string[] {
  const t = ` ${text.toUpperCase()} `
    .replace(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/g, ' ') // IBANs
    .replace(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g, ' ') // dates
    .replace(/\b\d{1,3}(?:[.,']\d{3})*[.,]\d{2}\b/g, ' '); // amounts
  const out = new Set<string>();
  for (const m of t.matchAll(/\b[A-Z]{0,8}[-/ #.:]?[A-Z]{0,4}\d[A-Z0-9\-/]*\b/g)) {
    let k = m[0].replace(/[^A-Z0-9]/g, '').replace(REF_PREFIX, '').replace(/^0+(?=\d)/, '');
    const digits = k.replace(/\D/g, '');
    if (digits.length < 4) continue;
    if (/^(19|20)\d{2}$/.test(digits)) continue;
    out.add(k);
    // 'INV10412' and '10412' are the same reference; keep the bare number too
    const bare = digits.length >= 5 && /^[A-Z]+\d+$/.test(k) && !/^E2E/.test(k) ? k.replace(/^[A-Z]+/, '').replace(/^0+(?=\d)/, '') : '';
    if (bare) out.add(bare);
  }
  return [...out];
}

const BANK_COLS = {
  date: ['booking_date', 'date', 'transaction_date', 'value_date', 'posting_date', 'buchungstag', 'valuta', 'datum'],
  amount: ['amount', 'value', 'betrag', 'transaction_amount', 'amount_eur', 'signed_amount'],
  credit: ['credit', 'money_in', 'paid_in', 'deposit', 'deposits', 'haben', 'in'],
  debit: ['debit', 'money_out', 'paid_out', 'withdrawal', 'withdrawals', 'soll', 'out'],
  name: ['counterparty', 'name', 'payee', 'payer', 'beneficiary', 'party', 'auftraggeber_empfaenger', 'counterparty_name'],
  text: ['reference', 'description', 'details', 'narrative', 'remittance', 'remittance_information', 'memo', 'verwendungszweck', 'purpose', 'text'],
  id: ['id', 'transaction_id', 'bank_reference', 'reference_number'],
  currency: ['currency', 'ccy', 'waehrung'],
};
const LEDGER_COLS = {
  date: ['date', 'posting_date', 'entry_date', 'transaction_date', 'document_date', 'payment_date', 'gl_date'],
  amount: ['amount', 'signed_amount', 'value', 'net', 'amount_eur', 'bank_amount'],
  credit: ['credit', 'cr', 'credit_amount'],
  debit: ['debit', 'dr', 'debit_amount'],
  name: ['counterparty', 'customer_supplier', 'name', 'customer', 'supplier', 'vendor', 'payee', 'party', 'account_name'],
  text: ['reference', 'invoice', 'invoice_number', 'document', 'document_number', 'description', 'memo', 'narrative', 'text', 'details'],
  id: ['entry_id', 'id', 'journal_id', 'document_number', 'voucher', 'line_id'],
  currency: ['currency', 'ccy'],
};

function fromRow(row: Row, i: number, side: 'bank' | 'ledger'): Line {
  const C = side === 'bank' ? BANK_COLS : LEDGER_COLS;
  const amount = pick(row, ...C.amount);
  let cents: number;
  if (amount) cents = parseAmount(amount) ?? 0;
  else {
    const cr = parseAmount(pick(row, ...C.credit)) ?? 0;
    const dr = parseAmount(pick(row, ...C.debit)) ?? 0;
    // Bank: credit = money in. Ledger (the bank's GL account): debit = money in.
    cents = side === 'bank' ? Math.abs(cr) - Math.abs(dr) : Math.abs(dr) - Math.abs(cr);
  }
  const rawDate = pick(row, ...C.date);
  const day = toDay(rawDate);
  const name = pick(row, ...C.name);
  const text = C.text.map((c) => row[c]).filter(Boolean).join(' ');
  const id = pick(row, ...C.id) || `row ${i + 2}`;
  return { side, index: i, id, date: isoOf(day, rawDate), day, cents, currency: pick(row, ...C.currency).toUpperCase(), name, nameKey: supplierKey(name), text, refs: refsIn(`${text} ${side === 'ledger' ? pick(row, ...C.id) : ''}`) };
}

export function readBank(text: string): { format: string; lines: Line[]; warnings: string[] } {
  const t = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).trimStart();
  if (t.startsWith('<') || /:20:|:25:|:60[FM]:/.test(t.slice(0, 400))) {
    const r = convertStatement(t);
    const lines = r.transactions
      .filter((x) => x.status !== 'Pending')
      .map((x, i): Line => {
        const day = toDay(x.bookingDate || x.valueDate);
        const text = [x.reference, x.endToEndId].filter(Boolean).join(' ');
        return { side: 'bank', index: i, id: x.bankReference || `entry ${i + 1}`, date: isoOf(day, x.bookingDate), day, cents: Math.round(x.amount * 100), currency: x.currency, name: x.counterparty, nameKey: supplierKey(x.counterparty), text: [text, x.type].filter(Boolean).join(' · '), refs: refsIn(text) };
      });
    return { format: r.format, lines, warnings: r.warnings };
  }
  const rows = parseCsv(t);
  if (!rows.length) throw new Error('The bank statement has no rows.');
  const lines = rows.map((r, i) => fromRow(r, i, 'bank'));
  if (lines.every((l) => l.cents === 0)) throw new Error('No amounts were found in the bank statement. It needs an "amount" column, or "credit" and "debit" columns.');
  return { format: 'CSV', lines, warnings: [] };
}

export function readLedger(text: string): Line[] {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('The ledger has no rows.');
  const lines = rows.map((r, i) => fromRow(r, i, 'ledger'));
  if (lines.every((l) => l.cents === 0)) throw new Error('No amounts were found in the ledger. It needs an "amount" column, or "debit" and "credit" columns.');
  return lines;
}

// ---------- matching ----------

const nsim = (a: string, b: string): number => (a && b ? nameSim({ key: a } as Vendor, { key: b } as Vendor) : 0);
/** How well the ledger party matches the bank line: by the bank's name field, or else by the name written in the bank text. */
function partyScore(b: Line, l: Line): number {
  if (!l.nameKey) return 0;
  if (b.nameKey) return nsim(b.nameKey, l.nameKey);
  const words = ` ${supplierKey(b.text)} `;
  const want = l.nameKey.split(' ');
  return want.filter((w) => words.includes(` ${w} `)).length / want.length;
}
const sharesRef = (a: Line, b: Line): boolean => a.refs.some((r) => b.refs.includes(r));
const gap = (a: Line, b: Line): number => (a.day === null || b.day === null ? 0 : Math.abs(a.day - b.day));
const sameSign = (a: number, b: number): boolean => (a >= 0) === (b >= 0);

/** All subsets (2..maxSize) of items whose cents add up to target. Stops after 2 hits: we only need to know if it is unique. */
function subsetsSumming(items: Line[], target: number, maxSize = 5): Line[][] {
  const hits: Line[][] = [];
  const pool = items.slice(0, 16);
  const walk = (start: number, chosen: Line[], sum: number): void => {
    if (hits.length > 1) return;
    if (chosen.length >= 2 && sum === target) hits.push([...chosen]);
    if (chosen.length === maxSize) return;
    for (let i = start; i < pool.length; i++) {
      chosen.push(pool[i]);
      walk(i + 1, chosen, sum + pool[i].cents);
      chosen.pop();
    }
  };
  walk(0, [], 0);
  return hits;
}

export function reconcile(bankText: string, ledgerText: string, opts: ReconOptions = {}): ReconResult {
  const { format, lines: bank, warnings } = readBank(bankText);
  const ledger = readLedger(ledgerText);
  return reconcileLines(bank, ledger, opts, format, warnings);
}

export function reconcileLines(bank: Line[], ledgerIn: Line[], opts: ReconOptions = {}, bankFormat = 'CSV', warningsIn: string[] = []): ReconResult {
  const window = opts.windowDays ?? 5;
  const maxDiff = opts.maxDifference ?? 5000;
  const warnings = [...warningsIn];
  let ledger = ledgerIn;

  // Some ledgers are exported with the opposite sign (credit = money in). Detect it from the data.
  const amounts = new Set(bank.map((b) => b.cents));
  const asIs = ledger.filter((l) => amounts.has(l.cents)).length;
  const flipped = ledger.filter((l) => amounts.has(-l.cents)).length;
  const ledgerSignFlipped = flipped > asIs * 2 && flipped >= 3;
  if (ledgerSignFlipped) {
    ledger = ledger.map((l) => ({ ...l, cents: -l.cents }));
    warnings.push('The ledger uses the opposite sign to the bank (money in is negative). It was flipped before matching.');
  }

  const usedB = new Set<number>();
  const usedL = new Set<number>();
  const matches: Match[] = [];
  const add = (kind: MatchKind, b: Line[], l: Line[], confidence: Match['confidence'], why: string): void => {
    b.forEach((x) => usedB.add(x.index));
    l.forEach((x) => usedL.add(x.index));
    const diff = b.reduce((s, x) => s + x.cents, 0) - l.reduce((s, x) => s + x.cents, 0);
    matches.push({ kind, bank: b.map((x) => x.index), ledger: l.map((x) => x.index), difference: diff, confidence, why });
  };
  const freeB = (): Line[] => bank.filter((b) => !usedB.has(b.index));
  const freeL = (): Line[] => ledger.filter((l) => !usedL.has(l.index));
  const near = (b: Line, l: Line, extra = 0): boolean => b.day === null || l.day === null || Math.abs(b.day - l.day) <= window + extra;

  // 1. Same reference, same amount.
  for (const b of freeB()) {
    if (!b.refs.length) continue;
    const c = freeL().filter((l) => l.cents === b.cents && sharesRef(b, l)).sort((x, y) => gap(b, x) - gap(b, y));
    if (c.length) add('reference', [b], [c[0]], 'high', `Same reference (${b.refs.find((r) => c[0].refs.includes(r))}) and amount`);
  }

  // 2. One bank line paying several ledger items, all referenced in the bank text.
  for (const b of freeB()) {
    if (!b.refs.length) continue;
    const c = freeL().filter((l) => sharesRef(b, l) && sameSign(l.cents, b.cents) && near(b, l, 30));
    if (c.length < 2) continue;
    const hits = subsetsSumming(c, b.cents);
    if (hits.length === 1) add('combined', [b], hits[0], 'high', `One payment for ${hits[0].length} items, all referenced`);
  }

  // 3. Several bank lines (part payments) for one ledger item, all with its reference.
  for (const l of freeL()) {
    if (!l.refs.length) continue;
    const c = freeB().filter((b) => sharesRef(b, l) && sameSign(l.cents, b.cents) && near(b, l, 60));
    if (c.length < 2) continue;
    const hits = subsetsSumming(c, l.cents);
    if (hits.length === 1) add('part-payments', hits[0], [l], 'high', `${hits[0].length} part payments with the same reference`);
  }

  // 4. Same reference, slightly different amount: bank charges taken off, or an FX difference.
  for (const b of freeB()) {
    if (!b.refs.length) continue;
    const c = freeL()
      .filter((l) => sharesRef(b, l) && sameSign(l.cents, b.cents) && Math.abs(b.cents - l.cents) <= Math.max(maxDiff, Math.abs(l.cents) * 0.02) && near(b, l, 10))
      .sort((x, y) => Math.abs(b.cents - x.cents) - Math.abs(b.cents - y.cents));
    if (c.length === 1 || (c.length > 1 && Math.abs(b.cents - c[0].cents) < Math.abs(b.cents - c[1].cents))) {
      const d = b.cents - c[0].cents;
      add('reference-difference', [b], [c[0]], 'medium', `Same reference; bank amount differs by ${(d / 100).toFixed(2)} (charges or exchange rate)`);
    }
  }

  // 5. Same amount within the date window; the name decides between candidates.
  const ambiguous = new Map<number, number[]>();
  const score = (b: Line, l: Line): number => partyScore(b, l) + (1 - gap(b, l) / (window + 1)) * 0.3;
  const pairs = freeB().map((b) => ({ b, c: freeL().filter((l) => l.cents === b.cents && near(b, l)) })).filter((p) => p.c.length);
  pairs.sort((x, y) => x.c.length - y.c.length);
  for (const { b } of pairs) {
    const c = freeL()
      .filter((l) => l.cents === b.cents && near(b, l))
      .map((l) => ({ l, s: score(b, l), n: partyScore(b, l) }))
      .sort((x, y) => y.s - x.s);
    if (!c.length) continue;
    // A ledger line may have a better bank partner; don't take it from them.
    const best = c[0];
    const rival = freeB().some((o) => o !== b && o.cents === b.cents && near(o, best.l) && score(o, best.l) > best.s + 0.001);
    if (rival) continue;
    const named = !!b.nameKey && !!best.l.nameKey;
    // Same amount but a different name: suggest it, never match it on our own.
    if (named && best.n < 0.5) continue;
    if (c.length === 1 || best.s - c[1].s >= 0.25) add('amount-date', [b], [best.l], named && best.n >= 0.8 && c.length === 1 ? 'high' : 'medium', best.n >= 0.5 ? `Same amount, ${gap(b, best.l)} day${gap(b, best.l) === 1 ? '' : 's'} apart, same name` : `Same amount, ${gap(b, best.l)} day${gap(b, best.l) === 1 ? '' : 's'} apart`);
    else ambiguous.set(b.index, c.map((x) => x.l.index));
  }

  // 6. One bank line paying several open items of the same customer or supplier, without references.
  for (const b of freeB()) {
    const c = freeL().filter((l) => partyScore(b, l) >= 0.8 && sameSign(l.cents, b.cents) && (b.day === null || l.day === null || (l.day <= b.day + window && l.day >= b.day - 60)));
    if (c.length < 2) continue;
    const hits = subsetsSumming(c, b.cents, 4);
    if (hits.length === 1) add('combined-by-name', [b], hits[0], 'medium', `One payment from ${b.name || ledger[hits[0][0].index].name} for ${hits[0].length} open items (amounts add up exactly)`);
  }

  // ---------- what is left ----------
  const openBank: Open[] = freeB().map((b) => {
    const t = `${b.text} ${b.name}`.toLowerCase();
    const cands = (ambiguous.get(b.index) ?? []).filter((i) => !usedL.has(i));
    if (cands.length) return { line: b.index, side: 'bank', reason: `${cands.length} ledger entries have this amount; none is clearly the one`, action: 'Pick the right entry by hand', candidates: cands };
    if (/charge|fee|commission|geb(ü|ue)hr|frais|comision|kontof(ü|ue)hrung|chrg|maintenance/.test(t)) return { line: b.index, side: 'bank', reason: 'Bank charge not yet in the ledger', action: 'Post to bank charges', candidates: [] };
    if (/interest|zins|int(e|é)r(e|ê)t|intr\b/.test(t)) return { line: b.index, side: 'bank', reason: 'Interest not yet in the ledger', action: b.cents >= 0 ? 'Post to interest income' : 'Post to interest expense', candidates: [] };
    const sameAmt = ledger.filter((l) => !usedL.has(l.index) && l.cents === b.cents);
    if (sameAmt.length) return { line: b.index, side: 'bank', reason: 'A ledger entry has this amount but a different name or date', action: 'Check whether it is the same item', candidates: sameAmt.map((l) => l.index) };
    return b.cents >= 0
      ? { line: b.index, side: 'bank', reason: 'Money received that is not in the ledger', action: 'Find the invoice it pays, or ask the payer', candidates: [] }
      : { line: b.index, side: 'bank', reason: 'Money paid out that is not in the ledger', action: 'Find the approval and post it; if unknown, ask the bank', candidates: [] };
  });
  const lastBankDay = Math.max(...bank.map((b) => b.day ?? -Infinity));
  const openLedger: Open[] = freeL().map((l) => {
    const late = l.day !== null && Number.isFinite(lastBankDay) && l.day > lastBankDay - window;
    if (l.cents >= 0) return { line: l.index, side: 'ledger', reason: late ? 'Receipt booked near the period end; not on the statement yet' : 'Receipt in the ledger but not on the statement', action: late ? 'Expect it on the next statement (deposit in transit)' : 'Check it was really received', candidates: [] };
    return { line: l.index, side: 'ledger', reason: late ? 'Payment not yet cleared by the bank' : 'Payment in the ledger but not on the statement', action: late ? 'Expect it on the next statement (outstanding payment)' : 'Check it was really sent, or reverse it', candidates: [] };
  });

  const sum = (xs: Line[]): number => xs.reduce((s, x) => s + x.cents, 0);
  const tBank = sum(bank);
  const tLedger = sum(ledger);
  const oB = openBank.reduce((s, o) => s + bank[o.line].cents, 0);
  const oL = openLedger.reduce((s, o) => s + ledger[o.line].cents, 0);
  const diffs = matches.reduce((s, m) => s + m.difference, 0);
  const curr = new Set([...bank, ...ledger].map((l) => l.currency).filter(Boolean));
  if (curr.size > 1) warnings.push(`More than one currency (${[...curr].join(', ')}). Reconcile one account and currency at a time.`);
  return {
    bankFormat,
    bank,
    ledger,
    matches,
    openBank,
    openLedger,
    totals: { bank: tBank, ledger: tLedger, matchedBank: tBank - oB, openBank: oB, openLedger: oL, differences: diffs, unexplained: tBank - tLedger - (oB - oL + diffs) },
    matchedShare: bank.length ? (bank.length - openBank.length) / bank.length : 1,
    ledgerSignFlipped,
    warnings,
  };
}

export const money = (cents: number): string => (cents / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const KIND_WORDS: Record<MatchKind, string> = {
  reference: 'Reference',
  combined: 'Combined payment',
  'part-payments': 'Part payments',
  'reference-difference': 'Reference, amount differs',
  'amount-date': 'Amount and date',
  'combined-by-name': 'Combined, by name',
};
