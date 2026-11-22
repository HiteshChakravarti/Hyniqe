// Bank Detail Change Check: before a payment run goes out, compare every payee's bank account with
// the details you already trust (vendor master or earlier payment runs). Payment-redirection fraud
// almost always shows up as one of these patterns.

import { ibanCountry, ibanValid } from '../../../engine/src/address/iban.ts';
import { pick, type Row } from '../../shared/csv.ts';
import { nameSim, supplierKey, type Vendor } from '../../vendor-master-cleanup/src/vendors.ts';

export type Risk = 'stop' | 'check' | 'ok';
export type Code =
  | 'ACCOUNT_CHANGED' | 'FOREIGN_ACCOUNT' | 'OTHER_PAYEES_ACCOUNT' | 'NEW_PAYEE' | 'NEW_PAYEE_LARGE'
  | 'RECENT_CHANGE' | 'AMOUNT_SPIKE' | 'SHARED_IN_RUN' | 'IBAN_INVALID' | 'NO_ACCOUNT';

export interface Finding {
  code: Code;
  risk: Risk;
  message: string;
  action: string;
}

export interface PaymentResult {
  row: number;
  payee: string;
  payeeId: string;
  account: string;
  amount: number | null;
  currency: string;
  risk: Risk;
  matchedAs: string;
  findings: Finding[];
}

export interface CheckResult {
  payments: PaymentResult[];
  trustedPayees: number;
  stop: number;
  check: number;
  ok: number;
  atRisk: Record<string, number>;
}

export const COLUMNS = {
  id: ['vendor_id', 'supplier_id', 'payee_id', 'creditor_id', 'vendor', 'vendor_number', 'supplier_number', 'beneficiary_id', 'id'],
  name: ['payee', 'payee_name', 'beneficiary', 'beneficiary_name', 'creditor_name', 'vendor_name', 'supplier_name', 'name'],
  account: ['iban', 'account', 'account_number', 'bank_account', 'beneficiary_iban', 'creditor_iban', 'beneficiary_account'],
  country: ['country', 'country_code', 'vendor_country', 'beneficiary_country'],
  amount: ['amount', 'payment_amount', 'instructed_amount', 'value'],
  currency: ['currency', 'ccy'],
  changed: ['bank_details_changed', 'bank_changed_on', 'last_changed', 'changed_on', 'bank_change_date', 'modified_date'],
};

export const normAccount = (a: string): string => a.replace(/[\s.\-/]/g, '').toUpperCase();
const mask = (a: string): string => (a.length > 8 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);

function amountOf(row: Row): number | null {
  const raw = pick(row, ...COLUMNS.amount).trim();
  if (!raw) return null;
  let s = raw.replace(/[^\d.,-]/g, '');
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDate(s: string): Date | null {
  const t = s.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(t);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
}

interface TrustedPayee {
  id: string;
  name: string;
  key: string;
  accounts: Set<string>;
  countries: Set<string>;
  amounts: number[];
  lastChanged: Date | null;
}

const asVendor = (key: string) => ({ key }) as Vendor;

/** Builds the trusted picture from a vendor master or from earlier payment runs (or both concatenated). */
export function buildTrusted(rows: Row[]): TrustedPayee[] {
  const byId = new Map<string, TrustedPayee>();
  const byKey = new Map<string, TrustedPayee>();
  for (const r of rows) {
    const id = pick(r, ...COLUMNS.id).trim();
    const name = pick(r, ...COLUMNS.name).replace(/\s+/g, ' ').trim();
    const key = supplierKey(name);
    if (!id && !key) continue;
    let p = (id && byId.get(id)) || (!id ? byKey.get(key) : undefined);
    if (!p) {
      p = { id, name, key, accounts: new Set(), countries: new Set(), amounts: [], lastChanged: null };
      if (id) byId.set(id, p);
      else byKey.set(key, p);
    }
    const acc = normAccount(pick(r, ...COLUMNS.account));
    if (acc) p.accounts.add(acc);
    const c = pick(r, ...COLUMNS.country).trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(c)) p.countries.add(c);
    const ic = ibanValid(acc) ? ibanCountry(acc) : null;
    if (ic) p.countries.add(ic);
    const amt = amountOf(r);
    if (amt !== null) p.amounts.push(Math.abs(amt));
    const ch = parseDate(pick(r, ...COLUMNS.changed));
    if (ch && (!p.lastChanged || ch > p.lastChanged)) p.lastChanged = ch;
  }
  return [...byId.values(), ...byKey.values()];
}

export interface CheckOptions {
  /** Payments to new payees at or above this amount are treated as high risk. Default: 10,000. */
  largeAmount?: number;
  /** A payment this many times larger than the payee's largest earlier payment is flagged. Default: 3. */
  spikeFactor?: number;
  /** Bank details changed within this many days before the run are flagged. Default: 30. */
  recentDays?: number;
  today?: Date;
}

export function checkRun(runRows: Row[], trustedRows: Row[], opts: CheckOptions = {}): CheckResult {
  const large = opts.largeAmount ?? 10000;
  const spike = opts.spikeFactor ?? 3;
  const today = opts.today ?? new Date();
  const recentMs = (opts.recentDays ?? 30) * 86400000;
  const trusted = buildTrusted(trustedRows);
  const byId = new Map(trusted.filter((t) => t.id).map((t) => [t.id, t]));
  const owners = new Map<string, TrustedPayee[]>();
  for (const t of trusted) for (const a of t.accounts) owners.set(a, [...(owners.get(a) ?? []), t]);
  const runAccounts = new Map<string, Set<string>>();

  const payments: PaymentResult[] = runRows.map((r, i) => {
    const payeeId = pick(r, ...COLUMNS.id).trim();
    const payee = pick(r, ...COLUMNS.name).replace(/\s+/g, ' ').trim();
    const key = supplierKey(payee);
    const account = normAccount(pick(r, ...COLUMNS.account));
    const amount = amountOf(r);
    const currency = pick(r, ...COLUMNS.currency).trim().toUpperCase();
    const findings: Finding[] = [];
    const add = (code: Code, risk: Risk, message: string, action: string) => findings.push({ code, risk, message, action });
    const label = payee || payeeId || `row ${i + 2}`;
    if (account) runAccounts.set(account, new Set([...(runAccounts.get(account) ?? []), payeeId || key]));

    // Which trusted payee is this?
    let match: TrustedPayee | undefined = payeeId ? byId.get(payeeId) : undefined;
    let matchedAs = match ? 'payee ID' : '';
    if (!match && key) {
      let best = 0;
      for (const t of trusted) {
        const s = nameSim(asVendor(key), asVendor(t.key));
        if (s > best && s >= 0.85) {
          best = s;
          match = t;
        }
      }
      if (match) matchedAs = best === 1 ? 'name' : 'similar name';
    }

    if (!account) add('NO_ACCOUNT', 'stop', `${label} has no bank account in the payment run.`, 'Add the account from the trusted vendor record, not from an email.');
    else if (/^[A-Z]{2}\d{2}/.test(account) && !ibanValid(account)) add('IBAN_INVALID', 'stop', `${label}: IBAN ${mask(account)} fails its check digits.`, 'A digit is wrong. Take the IBAN from the trusted vendor record.');

    const others = account ? (owners.get(account) ?? []).filter((t) => t !== match) : [];
    if (others.length) {
      add('OTHER_PAYEES_ACCOUNT', 'stop', `${label} is being paid into the account of ${others.map((o) => o.name || o.id).join(', ')}.`, 'Stop this payment. Either the payee or the account is wrong; confirm with both suppliers using phone numbers you already hold.');
    }

    if (!match) {
      if (amount !== null && amount >= large) add('NEW_PAYEE_LARGE', 'stop', `${label} has never been paid before and this payment is ${amount.toLocaleString('en-GB')} ${currency}.`, 'Confirm the supplier exists, the invoice is real and the bank account is theirs before releasing.');
      else add('NEW_PAYEE', 'check', `${label} has never been paid before.`, 'Check the supplier was approved through your onboarding process.');
    } else if (account && !match.accounts.has(account) && !others.length && !findings.some((f) => f.code === 'IBAN_INVALID')) {
      const ctry = ibanValid(account) ? ibanCountry(account) : '';
      const foreign = ctry && match.countries.size > 0 && !match.countries.has(ctry);
      add('ACCOUNT_CHANGED', 'stop', `${label}: bank account changed from ${[...match.accounts].map(mask).join(' / ') || 'none on file'} to ${mask(account)}.`, 'Call the supplier on a number you already hold (not one from the email or invoice) and confirm the new account before paying.');
      if (foreign) add('FOREIGN_ACCOUNT', 'stop', `${label}: the new account is in ${ctry}, but the supplier has always been paid in ${[...match.countries].join(', ')}.`, 'A move to a foreign account is the most common sign of payment-redirection fraud.');
    }
    if (match?.lastChanged && today.getTime() - match.lastChanged.getTime() <= recentMs && today >= match.lastChanged) {
      add('RECENT_CHANGE', 'check', `${label}: bank details were changed on ${match.lastChanged.toISOString().slice(0, 10)}, shortly before this run.`, 'Make sure the change was verified by a call-back before this payment is released.');
    }
    if (match && amount !== null && match.amounts.length) {
      const max = Math.max(...match.amounts);
      if (max > 0 && Math.abs(amount) >= spike * max) add('AMOUNT_SPIKE', 'check', `${label}: ${amount.toLocaleString('en-GB')} ${currency} is ${(Math.abs(amount) / max).toFixed(1)} times the largest earlier payment.`, 'Check the invoice and purchase order behind this amount.');
    }
    return { row: i + 2, payee, payeeId, account, amount, currency, risk: 'ok' as Risk, matchedAs, findings };
  });

  for (const p of payments) {
    const ids = p.account ? runAccounts.get(p.account) : undefined;
    if (ids && ids.size > 1 && !p.findings.some((f) => f.code === 'OTHER_PAYEES_ACCOUNT')) {
      p.findings.push({ code: 'SHARED_IN_RUN', risk: 'check', message: `${p.payee || p.payeeId}: the same account is used for ${ids.size} different payees in this run.`, action: 'Confirm why several suppliers are paid into one account (for example a factoring company).' });
    }
    p.risk = p.findings.some((f) => f.risk === 'stop') ? 'stop' : p.findings.length ? 'check' : 'ok';
  }
  const atRisk: Record<string, number> = {};
  for (const p of payments) if (p.risk === 'stop' && p.amount !== null) atRisk[p.currency || '?'] = Math.round(((atRisk[p.currency || '?'] ?? 0) + p.amount) * 100) / 100;
  return {
    payments,
    trustedPayees: trusted.length,
    stop: payments.filter((p) => p.risk === 'stop').length,
    check: payments.filter((p) => p.risk === 'check').length,
    ok: payments.filter((p) => p.risk === 'ok').length,
    atRisk,
  };
}
