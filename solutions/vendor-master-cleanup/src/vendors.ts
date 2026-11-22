// Vendor Master Cleanup: finds suppliers set up more than once, bank accounts shared by
// unrelated suppliers, invalid VAT numbers and missing details. Deterministic and explainable.

import { isCountryCode, lookupCountry } from '../../../engine/src/address/countries.ts';
import { ibanCountry, ibanValid } from '../../../engine/src/address/iban.ts';
import { vendorKey } from '../../duplicate-payments/src/duplicates.ts';
import { pick, type Row } from '../../shared/csv.ts';

export type Severity = 'error' | 'review' | 'info';
export type Code =
  | 'DUPLICATE_VENDOR' | 'SHARED_IBAN' | 'IBAN_INVALID' | 'IBAN_COUNTRY' | 'BIC_FORMAT' | 'BIC_COUNTRY'
  | 'VAT_FORMAT' | 'VAT_COUNTRY' | 'MISSING_NAME' | 'MISSING_BANK' | 'MISSING_COUNTRY' | 'MISSING_TAX_ID';

export interface Vendor {
  row: number;
  id: string;
  name: string;
  key: string;
  country: string;
  iban: string;
  bic: string;
  vat: string;
}

export interface Finding {
  ids: string[];
  code: Code;
  severity: Severity;
  message: string;
  action: string;
}

export interface Cluster {
  ids: string[];
  names: string[];
  reasons: string[];
}

export interface CleanupResult {
  vendors: Vendor[];
  findings: Finding[];
  clusters: Cluster[];
  affected: number;
}

export const COLUMNS = {
  id: ['vendor_id', 'supplier_id', 'vendor_number', 'supplier_number', 'vendor', 'id', 'creditor_id', 'lifnr'],
  name: ['name', 'vendor_name', 'supplier_name', 'company_name', 'beneficiary_name', 'payee'],
  country: ['country', 'country_code', 'ctry', 'vendor_country'],
  address: ['address_text', 'address', 'full_address'],
  iban: ['iban', 'bank_account', 'account_number', 'vendor_iban'],
  bic: ['bic', 'swift', 'bic_swift', 'swift_code'],
  vat: ['vat', 'vat_number', 'vat_id', 'tax_id', 'tax_number', 'gstin', 'ein', 'tin'],
};

/** VAT number formats after the two-letter prefix has been removed. GR uses EL. */
const VAT: Record<string, RegExp> = {
  AT: /^U\d{8}$/, BE: /^[01]\d{9}$/, BG: /^\d{9,10}$/, CY: /^\d{8}[A-Z]$/, CZ: /^\d{8,10}$/, DE: /^\d{9}$/,
  DK: /^\d{8}$/, EE: /^\d{9}$/, GR: /^\d{9}$/, ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/, FI: /^\d{8}$/, FR: /^[A-HJ-NP-Z0-9]{2}\d{9}$/,
  HR: /^\d{11}$/, HU: /^\d{8}$/, IE: /^(\d{7}[A-W][A-I]?|\d[A-Z+*]\d{5}[A-W])$/, IT: /^\d{11}$/, LT: /^(\d{9}|\d{12})$/,
  LU: /^\d{8}$/, LV: /^\d{11}$/, MT: /^\d{8}$/, NL: /^\d{9}B\d{2}$/, PL: /^\d{10}$/, PT: /^\d{9}$/, RO: /^\d{2,10}$/,
  SE: /^\d{10}01$/, SI: /^\d{8}$/, SK: /^\d{10}$/, GB: /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/, XI: /^(\d{9}|\d{12})$/,
  CH: /^E\d{9}(MWST|TVA|IVA)?$/, NO: /^\d{9}(MVA)?$/,
};
const VAT_PREFIX: Record<string, string> = { GR: 'EL' };
const PREFIX_COUNTRY: Record<string, string> = { EL: 'GR', XI: 'GB', CH: 'CH' };
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normVat(v: string): string {
  return v.toUpperCase().replace(/[\s.\-/]/g, '');
}

/** Checks a VAT or tax number against the vendor's country. Unknown countries are not judged. */
export function vatProblem(vat: string, country: string): { code: 'VAT_FORMAT' | 'VAT_COUNTRY'; detail: string } | null {
  const v = normVat(vat);
  if (!v) return null;
  if (country === 'IN') return GSTIN.test(v) ? null : { code: 'VAT_FORMAT', detail: 'is not a valid 15-character GSTIN' };
  const prefix = v.slice(0, 2);
  const prefCountry = PREFIX_COUNTRY[prefix] ?? (VAT[prefix] ? prefix : null);
  if (prefCountry) {
    if (country && prefCountry !== country && !(country === 'GB' && prefix === 'XI')) {
      return { code: 'VAT_COUNTRY', detail: `starts with ${prefix} but the supplier is in ${country}` };
    }
    return VAT[prefix === 'EL' ? 'GR' : prefix].test(v.slice(2)) ? null : { code: 'VAT_FORMAT', detail: `does not match the ${prefix} format` };
  }
  const re = VAT[country];
  if (!re) return null;
  return re.test(v) ? null : { code: 'VAT_FORMAT', detail: `does not match the ${VAT_PREFIX[country] ?? country} format` };
}

const BIC_RE = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

function countryOf(row: Row): string {
  const c = pick(row, ...COLUMNS.country).trim();
  if (c) return isCountryCode(c.toUpperCase()) ? c.toUpperCase() : (lookupCountry(c) ?? '');
  const addr = pick(row, ...COLUMNS.address);
  if (!addr) return '';
  const last = addr.split(',').pop()!.trim().replace(/[\d\s-]+$/, '').trim();
  const words = last.split(/\s+/);
  for (const cand of [last, words.slice(-2).join(' '), words[words.length - 1], last.normalize('NFKD').replace(/\p{M}/gu, '')]) {
    const c = cand && lookupCountry(cand);
    if (c) return c;
  }
  return '';
}

export function toVendor(row: Row, index: number): Vendor {
  const name = pick(row, ...COLUMNS.name).replace(/\s+/g, ' ').trim();
  return {
    row: index + 2,
    id: pick(row, ...COLUMNS.id).trim() || `row ${index + 2}`,
    name,
    key: supplierKey(name),
    country: countryOf(row),
    iban: pick(row, ...COLUMNS.iban).replace(/\s+/g, '').toUpperCase(),
    bic: pick(row, ...COLUMNS.bic).replace(/\s+/g, '').toUpperCase(),
    vat: pick(row, ...COLUMNS.vat).trim(),
  };
}

const MORE_LEGAL = new Set(['sl', 'srl', 'spa', 'bv', 'nv', 'sas', 'sa', 'spzoo', 'zoo', 'sro', 'kft', 'oy', 'kk', 'gmbh', 'ltda', 'sasu', 'eurl']);

/** Name key: legal forms (including dotted ones such as S.r.l. or Sp. z o.o.), case, accents and punctuation removed. */
export function supplierKey(name: string): string {
  const undotted = name
    .replace(/\bsp\.?\s*z\s*o\.?\s*o\.?/gi, ' ')
    .replace(/\b(?:[A-Za-z]{1,2}\.\s?){2,}/g, (m) => ' ' + m.replace(/[.\s]/g, '') + ' ');
  return vendorKey(undotted).split(' ').filter((t) => t && !MORE_LEGAL.has(t)).join(' ');
}

function editDistance(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[b.length];
}

function tokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return a.length >= 4 && b.length >= 4 && editDistance(a, b) <= 1;
}

/** 0..1: share of words that match. A different distinctive word keeps the score low. */
export function nameSim(a: Vendor, b: Vendor): number {
  if (!a.key || !b.key) return 0;
  if (a.key === b.key) return 1;
  if (a.key.replace(/ /g, '') === b.key.replace(/ /g, '')) return 0.95;
  const ta = a.key.split(' ');
  const tb = b.key.split(' ');
  const left = [...tb];
  let matched = 0;
  for (const t of ta) {
    const k = left.findIndex((u) => tokenMatch(t, u));
    if (k >= 0) {
      matched++;
      left.splice(k, 1);
    }
  }
  return matched / Math.max(ta.length, tb.length);
}

/** Reasons two records are the same supplier, or null. */
export function sameSupplier(a: Vendor, b: Vendor): string[] | null {
  const sim = nameSim(a, b);
  const why: string[] = [];
  const va = normVat(a.vat), vb = normVat(b.vat);
  const vatSame = !!va && va.replace(/^[A-Z]{2}/, '') === vb.replace(/^[A-Z]{2}/, '');
  const ibanSame = !!a.iban && a.iban === b.iban;
  const countryOk = !a.country || !b.country || a.country === b.country;
  if (vatSame && sim >= 0.5) why.push('same VAT or tax number');
  if (ibanSame && sim >= 0.75) why.push('same bank account');
  if (sim >= 0.85 && countryOk) why.push(sim === 1 ? 'same name once legal form, case and punctuation are ignored' : 'almost the same name');
  if (!why.length) return null;
  if (why.length === 1 && why[0].startsWith('almost') && !countryOk) return null;
  return why;
}

function blocks(v: Vendor): string[] {
  const keys = v.key.split(' ').filter((t) => t.length >= 3).map((t) => `n:${t.slice(0, 4)}`);
  const compact = v.key.replace(/ /g, '');
  if (compact) keys.push(`c:${compact.slice(0, 4)}`, `e:${compact.slice(-4)}`);
  if (v.iban) keys.push(`i:${v.iban}`);
  const vat = normVat(v.vat).replace(/^[A-Z]{2}/, '');
  if (vat) keys.push(`v:${vat}`);
  return keys;
}

export function cleanupVendors(rows: Row[]): CleanupResult {
  const vendors = rows.map(toVendor).filter((v) => v.name || v.iban || v.vat);
  const findings: Finding[] = [];
  const add = (ids: string[], code: Code, severity: Severity, message: string, action: string) => findings.push({ ids, code, severity, message, action });

  for (const v of vendors) {
    const label = v.name || v.id;
    if (!v.name) add([v.id], 'MISSING_NAME', 'error', `${v.id} has no name.`, 'Add the legal name from the invoice or contract.');
    if (!v.iban) add([v.id], 'MISSING_BANK', 'review', `${label} has no bank account.`, 'Collect bank details on the supplier\'s letterhead and confirm them by phone.');
    else if (!ibanValid(v.iban)) {
      if (/^[A-Z]{2}\d{2}/.test(v.iban)) add([v.id], 'IBAN_INVALID', 'error', `${label}: IBAN ${v.iban} fails the check digits.`, 'A digit is wrong. Ask the supplier for the IBAN again; do not pay until it is corrected.');
    } else if (v.country && ibanCountry(v.iban) !== v.country) {
      add([v.id], 'IBAN_COUNTRY', 'review', `${label} is in ${v.country} but the bank account is in ${ibanCountry(v.iban)}.`, 'Confirm with the supplier that the foreign account is theirs. Changed or foreign accounts are a common fraud pattern.');
    }
    if (v.bic) {
      if (!BIC_RE.test(v.bic)) add([v.id], 'BIC_FORMAT', 'error', `${label}: BIC ${v.bic} is not 8 or 11 characters in the right pattern.`, 'Correct the BIC, or leave it empty if the IBAN is enough for the payment.');
      else if (v.iban && ibanValid(v.iban) && v.bic.slice(4, 6) !== ibanCountry(v.iban)) add([v.id], 'BIC_COUNTRY', 'review', `${label}: the BIC is for ${v.bic.slice(4, 6)} but the IBAN is for ${ibanCountry(v.iban)}.`, 'One of the two bank details belongs to a different bank. Check both with the supplier.');
    }
    if (!v.country) add([v.id], 'MISSING_COUNTRY', 'review', `${label} has no country.`, 'Add the country; banks need it for structured addresses and sanctions screening.');
    if (!v.vat) add([v.id], 'MISSING_TAX_ID', 'info', `${label} has no VAT or tax number.`, 'Add it if the supplier is VAT-registered; it is the strongest way to spot duplicates.');
    else {
      const p = vatProblem(v.vat, v.country);
      if (p) add([v.id], p.code, p.code === 'VAT_FORMAT' ? 'error' : 'review', `${label}: VAT number ${v.vat} ${p.detail}.`, p.code === 'VAT_FORMAT' ? 'Check the number on an invoice and against the official register (VIES for the EU).' : 'Check whether the VAT number or the country is wrong.');
    }
  }

  // Candidate pairs from shared blocking keys.
  const byBlock = new Map<string, number[]>();
  vendors.forEach((v, i) => {
    for (const k of blocks(v)) {
      if (!byBlock.has(k)) byBlock.set(k, []);
      byBlock.get(k)!.push(i);
    }
  });
  const seen = new Set<string>();
  const parent = vendors.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const pairReasons = new Map<string, string[]>();
  const countries = vendors.map((v) => {
    const hint = v.country || (ibanValid(v.iban) ? ibanCountry(v.iban) : '') || (BIC_RE.test(v.bic) ? v.bic.slice(4, 6) : '');
    return new Set(hint ? [hint] : []);
  });
  for (const idx of byBlock.values()) {
    if (idx.length > 400) continue;
    for (let x = 0; x < idx.length; x++) {
      for (let y = x + 1; y < idx.length; y++) {
        const [i, j] = [idx[x], idx[y]];
        const k = `${i}|${j}`;
        if (seen.has(k)) continue;
        seen.add(k);
        const why = sameSupplier(vendors[i], vendors[j]);
        if (!why) continue;
        const [ri, rj] = [find(i), find(j)];
        const merged = new Set([...countries[ri], ...countries[rj]]);
        // A name-only match must not join suppliers known to be in different countries.
        const strong = why.some((w) => !w.includes('name'));
        if (merged.size > 1 && !strong) continue;
        parent[ri] = rj;
        countries[rj] = merged;
        pairReasons.set(k, why);
      }
    }
  }
  const groups = new Map<number, number[]>();
  vendors.forEach((_, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  });
  const clusters: Cluster[] = [];
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const reasons = new Set<string>();
    for (const i of g) for (const j of g) if (i < j) pairReasons.get(`${i}|${j}`)?.forEach((r) => reasons.add(r));
    const c = { ids: g.map((i) => vendors[i].id), names: g.map((i) => vendors[i].name), reasons: [...reasons] };
    clusters.push(c);
    add(c.ids, 'DUPLICATE_VENDOR', 'review', `${g.length} records look like one supplier (${c.names.map((n, k) => `${n} [${c.ids[k]}]`).join(', ')}): ${c.reasons.join(', ')}.`, 'Keep one record, block the others for payment, and move open invoices to the record you keep.');
  }

  // One bank account used by suppliers that are not the same supplier.
  const byIban = new Map<string, number[]>();
  vendors.forEach((v, i) => {
    if (v.iban && ibanValid(v.iban)) {
      if (!byIban.has(v.iban)) byIban.set(v.iban, []);
      byIban.get(v.iban)!.push(i);
    }
  });
  for (const [iban, idx] of byIban) {
    const roots = new Set(idx.map(find));
    if (roots.size < 2) continue;
    add(idx.map((i) => vendors[i].id), 'SHARED_IBAN', 'review', `Bank account ${iban} is used by ${roots.size} different suppliers: ${idx.map((i) => `${vendors[i].name} [${vendors[i].id}]`).join(', ')}.`, 'Find out why. It can be a factoring company or a parent paying for subsidiaries, but it is also how supplier fraud looks. Confirm with each supplier by phone using a number you already hold.');
  }

  const rank: Record<Severity, number> = { error: 0, review: 1, info: 2 };
  findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
  const affected = new Set(findings.filter((f) => f.severity !== 'info').flatMap((f) => f.ids)).size;
  return { vendors, findings, clusters, affected };
}
