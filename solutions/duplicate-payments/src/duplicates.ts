// Duplicate Payment Finder: catches the same obligation paid twice, including the near-duplicates
// that exact-match ERP checks miss (re-keyed invoice numbers, duplicate vendor records, second channels).
// Every flagged pair carries plain-language reasons.

import { pick, type Row } from '../../shared/csv.ts';

export interface Payment {
  id: string;
  vendor: string;
  vendorId: string;
  invoice: string;
  invoiceDate: string;
  paymentDate: string;
  /** Amount in minor units (cents). */
  cents: number;
  currency: string;
  iban: string;
  vendorKey: string;
  invoiceKey: string;
  day: number | null;
}

export type Confidence = 'high' | 'medium' | 'low';

export interface Pair {
  a: string;
  b: string;
  confidence: Confidence;
  rule: string;
  reasons: string[];
}

export interface Cluster {
  id: string;
  confidence: Confidence;
  /** Earliest payment, treated as the original. */
  original: Payment;
  duplicates: Payment[];
  /** Amount at risk in minor units: the sum of the suspected duplicate payments. */
  exposureCents: number;
  currency: string;
  reasons: string[];
}

export interface DuplicateResult {
  payments: Payment[];
  pairs: Pair[];
  clusters: Cluster[];
  exposure: Record<string, number>;
  recurringVendors: number;
}

export const COLUMNS = {
  id: ['payment_id', 'id', 'document_number', 'doc_no', 'payment_reference', 'reference'],
  vendor: ['vendor_name', 'vendor', 'supplier', 'supplier_name', 'payee', 'beneficiary', 'beneficiary_name'],
  vendorId: ['vendor_id', 'supplier_id', 'vendor_number', 'vendor_code', 'supplier_number'],
  invoice: ['invoice_number', 'invoice', 'invoice_no', 'invoice_ref', 'bill_number'],
  invoiceDate: ['invoice_date', 'document_date', 'bill_date'],
  paymentDate: ['payment_date', 'paid_on', 'value_date', 'posting_date', 'date'],
  amount: ['amount', 'payment_amount', 'gross_amount', 'value', 'paid_amount'],
  currency: ['currency', 'ccy', 'payment_currency'],
  iban: ['iban', 'bank_account', 'account_number', 'beneficiary_iban', 'vendor_iban'],
};

const LEGAL = new Set([
  'ltd', 'limited', 'inc', 'incorporated', 'llc', 'llp', 'lp', 'gmbh', 'ag', 'sa', 'sas', 'sarl', 'bv', 'nv', 'plc', 'corp', 'corporation',
  'co', 'company', 'pvt', 'private', 'srl', 'spa', 'oy', 'ab', 'as', 'aps', 'kg', 'pte', 'pty', 'the', 'and', 'group', 'holdings', 'intl', 'international',
]);

export function vendorKey(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t && !LEGAL.has(t))
    .join(' ');
}

export function invoiceKey(inv: string): string {
  return inv
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^(INVOICE|INVNO|INV|BILL|NO|NR|REF)+/, '')
    .replace(/^0+(?=\d)/, '');
}

export function parseAmount(s: string): number | null {
  let t = s.replace(/[^\d,.\-()]/g, '');
  if (!t) return null;
  const neg = /^\(.*\)$/.test(t) || t.includes('-');
  t = t.replace(/[()\-]/g, '');
  const lastComma = t.lastIndexOf(',');
  const lastDot = t.lastIndexOf('.');
  if (lastComma > lastDot) {
    // 1.234,56 or 1234,56: comma is the decimal separator when followed by 1-2 digits
    t = /,\d{1,2}$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else t = t.replace(/,/g, '');
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round((neg ? -n : n) * 100);
}

function parseDay(s: string): number | null {
  if (!s) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86_400_000);
  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(s);
  if (m) return Math.floor(Date.UTC(+m[3], +m[2] - 1, +m[1]) / 86_400_000);
  return null;
}

export function toPayment(row: Row, index: number): Payment {
  const g = (k: keyof typeof COLUMNS): string => pick(row, ...COLUMNS[k]).trim();
  const vendor = g('vendor');
  const invoice = g('invoice');
  const paymentDate = g('paymentDate');
  return {
    id: g('id') || `row-${index + 2}`,
    vendor,
    vendorId: g('vendorId'),
    invoice,
    invoiceDate: g('invoiceDate'),
    paymentDate,
    cents: parseAmount(g('amount')) ?? 0,
    currency: (g('currency') || '—').toUpperCase(),
    iban: g('iban').replace(/\s+/g, '').toUpperCase(),
    vendorKey: vendorKey(vendor),
    invoiceKey: invoiceKey(invoice),
    day: parseDay(paymentDate) ?? parseDay(g('invoiceDate')),
  };
}

function levenshtein(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function isTransposition(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const diff: number[] = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff.push(i);
  return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]];
}

/** 0..1: how likely two vendor records are the same supplier. */
export function vendorSimilarity(p: Payment, q: Payment): number {
  if (p.vendorId && p.vendorId === q.vendorId) return 1;
  if (!p.vendorKey || !q.vendorKey) return 0;
  if (p.vendorKey === q.vendorKey) return 1;
  if (p.vendorKey.replace(/ /g, '') === q.vendorKey.replace(/ /g, '')) return 0.95;
  const ta = new Set(p.vendorKey.split(' '));
  const tb = new Set(q.vendorKey.split(' '));
  const inter = [...ta].filter((t) => tb.has(t) || [...tb].some((u) => u.length >= 3 && t.length >= 3 && (u.startsWith(t) || t.startsWith(u)))).length;
  const jac = inter / (ta.size + tb.size - inter);
  const lev = levenshtein(p.vendorKey, q.vendorKey, 3);
  const levSim = lev <= 3 ? 1 - lev / Math.max(p.vendorKey.length, q.vendorKey.length) : 0;
  return Math.max(jac, levSim);
}

/** Returns a similarity and a reason when two invoice references look like the same document. */
export function invoiceSimilarity(a: string, b: string): { sim: number; why: string } {
  if (!a || !b) return { sim: 0, why: '' };
  if (a === b) return { sim: 1, why: 'same invoice number' };
  const da = a.replace(/\D/g, '').replace(/^0+/, '');
  const db = b.replace(/\D/g, '').replace(/^0+/, '');
  if (da.length >= 4 && da === db) return { sim: 0.95, why: 'same invoice digits with a different prefix or suffix' };
  if (a.length >= 5 && isTransposition(a, b)) return { sim: 0.9, why: 'invoice numbers differ by two swapped characters' };
  if (a.length >= 6 && b.length >= 6 && levenshtein(a, b, 1) <= 1) return { sim: 0.85, why: 'invoice numbers differ by one character' };
  if (Math.min(a.length, b.length) >= 5 && (a.endsWith(b) || b.endsWith(a))) return { sim: 0.8, why: 'one invoice number contains the other' };
  return { sim: 0, why: '' };
}

const fmt = (cents: number): string => (cents / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 });

export function findDuplicates(rows: Row[], opts: { windowDays?: number } = {}): DuplicateResult {
  const windowDays = opts.windowDays ?? 30;
  const payments = rows.map(toPayment).filter((p) => p.cents !== 0);
  const byId = new Map(payments.map((p) => [p.id, p]));

  // Recurring payments (rent, subscriptions): same vendor and amount at regular intervals are not duplicates.
  const recurring = new Set<string>();
  const series = new Map<string, Payment[]>();
  for (const p of payments) {
    const k = `${p.vendorId || p.vendorKey}|${p.currency}|${p.cents}`;
    series.set(k, [...(series.get(k) ?? []), p]);
  }
  for (const [k, ps] of series) {
    const days = ps.map((p) => p.day).filter((d): d is number => d !== null).sort((a, b) => a - b);
    if (days.length < 3) continue;
    const gaps = days.slice(1).map((d, i) => d - days[i]);
    const regular = gaps.filter((g) => g >= 20).length >= Math.ceil(gaps.length * 0.7);
    if (regular) recurring.add(k);
  }

  const pairs: Pair[] = [];
  const seen = new Set<string>();
  const consider = (p: Payment, q: Payment): void => {
    const key = p.id < q.id ? `${p.id}|${q.id}` : `${q.id}|${p.id}`;
    if (seen.has(key) || p.id === q.id) return;
    seen.add(key);
    if (Math.sign(p.cents) !== Math.sign(q.cents)) return;
    const sameAmount = p.cents === q.cents && p.currency === q.currency;
    const vSim = vendorSimilarity(p, q);
    const sameIban = !!p.iban && p.iban === q.iban;
    const inv = invoiceSimilarity(p.invoiceKey, q.invoiceKey);
    const gap = p.day !== null && q.day !== null ? Math.abs(p.day - q.day) : null;
    const amount = `${p.currency} ${fmt(Math.abs(p.cents))}`;
    const isRecurring = recurring.has(`${p.vendorId || p.vendorKey}|${p.currency}|${p.cents}`);
    const sameRecord = (p.vendorId && p.vendorId === q.vendorId) || p.vendor === q.vendor;
    const vendorWhy = sameRecord ? 'same vendor' : vSim === 1 ? `same supplier under two vendor records ("${p.vendor}" / "${q.vendor}")${sameIban ? ', same bank account' : ''}` : `vendor records look like the same supplier ("${p.vendor}" / "${q.vendor}")${sameIban ? ', same bank account' : ''}`;
    const push = (confidence: Confidence, rule: string, reasons: string[]): void => {
      pairs.push({ a: p.id, b: q.id, confidence, rule, reasons });
    };

    if (sameAmount && inv.sim === 1 && vSim >= 0.9) return push('high', 'exact', [vendorWhy, inv.why, `same amount ${amount}`]);
    if (sameAmount && inv.sim === 1 && (vSim >= 0.6 || sameIban))
      return push('high', 'vendor-variant', [vendorWhy, inv.why, `same amount ${amount}`, 'the vendor appears twice in the vendor master']);
    if (sameAmount && inv.sim >= 0.95 && (vSim >= 0.6 || sameIban)) return push('high', 're-keyed', [vendorWhy, `${inv.why} ("${p.invoice}" / "${q.invoice}")`, `same amount ${amount}`]);
    // A one-character difference can also be the next invoice in a sequence, so recurring series are excluded
    // and the pair is only high confidence when the payments are close together.
    if (sameAmount && inv.sim >= 0.8 && !isRecurring && (vSim >= 0.6 || sameIban)) {
      const close = gap !== null && gap <= 45;
      return push(close ? 'high' : 'medium', 're-keyed', [vendorWhy, `${inv.why} ("${p.invoice}" / "${q.invoice}")`, `same amount ${amount}`, ...(gap !== null ? [`paid ${gap} day${gap === 1 ? '' : 's'} apart`] : [])]);
    }
    if (!sameAmount && inv.sim === 1 && vSim >= 0.9 && p.currency === q.currency)
      return push('low', 'same-invoice-different-amount', [vendorWhy, inv.why, `different amounts (${p.currency} ${fmt(p.cents)} / ${fmt(q.cents)}): partial payment, or a credit note not applied`]);
    // Round amounts (deposits, retainers, instalments) repeat legitimately, so they are only listed as low.
    const round = Math.abs(p.cents) % 5_000 === 0;
    if (sameAmount && !isRecurring && gap !== null && gap <= windowDays && vSim >= 0.9 && Math.abs(p.cents) >= 10_000)
      return push(round ? 'low' : 'medium', 'same-vendor-amount-window', [vendorWhy, `same amount ${amount}`, `paid ${gap} day${gap === 1 ? '' : 's'} apart`, `different references ("${p.invoice || 'none'}" / "${q.invoice || 'none'}"), possibly the same bill through a second channel`]);
    if (sameAmount && sameIban && vSim < 0.6 && gap !== null && gap <= 7 && Math.abs(p.cents) >= 10_000)
      return push('medium', 'same-account-amount', [`same bank account ${p.iban} under different vendor names ("${p.vendor}" / "${q.vendor}")`, `same amount ${amount}`, `paid ${gap} day${gap === 1 ? '' : 's'} apart`]);
  };

  // Candidate blocks keep the comparison fast: same currency and amount, or same invoice key.
  const blocks = new Map<string, Payment[]>();
  const addBlock = (k: string, p: Payment): void => {
    blocks.set(k, [...(blocks.get(k) ?? []), p]);
  };
  for (const p of payments) {
    addBlock(`a|${p.currency}|${p.cents}`, p);
    if (p.invoiceKey.length >= 3) addBlock(`i|${p.invoiceKey}`, p);
  }
  for (const block of blocks.values()) {
    if (block.length < 2) continue;
    const sorted = block.length > 400 ? [...block].sort((a, b) => (a.day ?? 0) - (b.day ?? 0)) : block;
    for (let i = 0; i < sorted.length; i++) {
      const limit = block.length > 400 ? Math.min(sorted.length, i + 60) : sorted.length;
      for (let j = i + 1; j < limit; j++) consider(sorted[i], sorted[j]);
    }
  }

  // Group high and medium pairs into clusters: one original plus its suspected duplicates.
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  };
  const strong = pairs.filter((p) => p.confidence !== 'low');
  for (const p of strong) {
    for (const id of [p.a, p.b]) if (!parent.has(id)) parent.set(id, id);
    parent.set(find(p.a), find(p.b));
  }
  const groups = new Map<string, string[]>();
  for (const id of parent.keys()) groups.set(find(id), [...(groups.get(find(id)) ?? []), id]);
  const rank: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };
  const clusters: Cluster[] = [...groups.values()].map((ids, n) => {
    const members = ids.map((id) => byId.get(id)!).sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || a.id.localeCompare(b.id));
    const ps = strong.filter((p) => ids.includes(p.a));
    const confidence = ps.reduce<Confidence>((c, p) => (rank[p.confidence] < rank[c] ? p.confidence : c), 'low');
    const reasons = Array.from(new Set(ps.flatMap((p) => p.reasons)));
    const duplicates = members.slice(1);
    return {
      id: `D-${String(n + 1).padStart(4, '0')}`,
      confidence,
      original: members[0],
      duplicates,
      exposureCents: duplicates.reduce((s, p) => s + Math.abs(p.cents), 0),
      currency: members[0].currency,
      reasons,
    };
  });
  clusters.sort((a, b) => rank[a.confidence] - rank[b.confidence] || b.exposureCents - a.exposureCents);
  clusters.forEach((c, i) => (c.id = `D-${String(i + 1).padStart(4, '0')}`));

  const exposure: Record<string, number> = {};
  for (const c of clusters) if (c.confidence === 'high') exposure[c.currency] = (exposure[c.currency] ?? 0) + c.exposureCents;
  return { payments, pairs, clusters, exposure, recurringVendors: recurring.size };
}
