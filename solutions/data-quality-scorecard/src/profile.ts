// Data Quality Scorecard: profiles any table for completeness, validity, uniqueness and consistency.
// Finance formats are recognised from the values themselves and checked properly (check digits included).

import { isCountryCode } from '../../../engine/src/address/countries.ts';
import { ibanCountry, ibanValid } from '../../../engine/src/address/iban.ts';
import { leiValid } from '../../ssi-checker/src/ssi.ts';
import { isinValid } from '../../corporate-actions-checker/src/events.ts';
import type { Row } from '../../shared/csv.ts';

export type Kind = 'iban' | 'bic' | 'lei' | 'isin' | 'currency' | 'country' | 'date' | 'email' | 'amount' | 'number' | 'id' | 'text';

export interface ColumnProfile {
  name: string;
  kind: Kind;
  filled: number;
  blank: number;
  distinct: number;
  /** Values of a recognised format that fail its rules. */
  invalid: number;
  invalidExamples: string[];
  /** Values written in a different style from the column's main style. */
  inconsistent: number;
  inconsistentExamples: string[];
  duplicates: number;
  duplicateExamples: string[];
  completeness: number;
  validity: number | null;
  uniqueness: number | null;
  consistency: number;
  score: number;
}

export interface CrossCheck {
  columns: string[];
  rule: string;
  failed: number;
  checked: number;
  examples: string[];
}

export interface Scorecard {
  rows: number;
  columns: ColumnProfile[];
  duplicateRows: number;
  cross: CrossCheck[];
  dimensions: { completeness: number; validity: number; uniqueness: number; consistency: number };
  score: number;
  grade: string;
}

const CURRENCIES = new Set('AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWL'.split(' '));

const SHAPE: Partial<Record<Kind, RegExp>> = {
  iban: /^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/,
  bic: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  lei: /^[A-Z0-9]{18}\d{2}$/,
  isin: /^[A-Z]{2}[A-Z0-9]{9}\d$/,
  currency: /^[A-Z]{3}$/,
  country: /^[A-Z]{2}$/,
  email: /^[^@\s]+@[^@\s]+$/,
};

const DATE_STYLES: [string, RegExp][] = [
  ['YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}([T ][\d:.]+Z?)?$/],
  ['DD/MM/YYYY', /^\d{1,2}\/\d{1,2}\/\d{4}$/],
  ['DD.MM.YYYY', /^\d{1,2}\.\d{1,2}\.\d{4}$/],
  ['DD-MM-YYYY', /^\d{1,2}-\d{1,2}-\d{4}$/],
  ['YYYYMMDD', /^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/],
];
const AMOUNT = /^-?\(?[$€£]?\s?\d{1,3}([,.' ]?\d{3})*([.,]\d{1,4})?\)?$/;
const NUMBER = /^-?\d+([.,]\d+)?$/;

function compact(v: string): string {
  return v.replace(/\s+/g, '').toUpperCase();
}

function dateValid(v: string, style: string): boolean {
  let y: number, m: number, d: number;
  if (style === 'YYYY-MM-DD') [y, m, d] = v.slice(0, 10).split('-').map(Number);
  else if (style === 'YYYYMMDD') [y, m, d] = [Number(v.slice(0, 4)), Number(v.slice(4, 6)), Number(v.slice(6, 8))];
  else [d, m, y] = v.split(/[/.-]/).map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d && y >= 1900 && y <= 2100;
}

function hinted(name: string): Kind | null {
  const n = name.toLowerCase();
  if (/iban/.test(n)) return 'iban';
  if (/\b(bic|swift)|_bic|bic_/.test(n)) return 'bic';
  if (/\blei\b|_lei|lei_/.test(n) || n === 'lei') return 'lei';
  if (/isin/.test(n)) return 'isin';
  if (/^(ccy|currency)|_ccy$|currency$/.test(n)) return 'currency';
  if (/country|^ctry$/.test(n)) return 'country';
  if (/date|_dt$|^dt_|day$/.test(n)) return 'date';
  if (/e?mail|owner$/.test(n)) return 'email';
  if (/amount|amt$|balance|price|value$/.test(n)) return 'amount';
  if (/(^|_)(id|no|number|nr|code|ref|reference|key)$/.test(n)) return 'id';
  return null;
}

/** Decide what a column holds from its name and its values. */
export function detectKind(name: string, values: string[]): Kind {
  const vals = values.filter(Boolean);
  const hint = hinted(name);
  if (!vals.length) return hint ?? 'text';
  const share = (test: (v: string) => boolean) => vals.filter(test).length / vals.length;
  const order: Kind[] = ['iban', 'lei', 'isin', 'bic', 'currency', 'country', 'email'];
  if (hint && hint !== 'id' && hint !== 'amount') {
    const re = SHAPE[hint];
    if (hint === 'date' && share((v) => DATE_STYLES.some(([, r]) => r.test(v.trim()))) >= 0.5) return 'date';
    if (re && share((v) => re.test(compact(v)) || (hint === 'country' && v.trim().length > 2)) >= 0.5) return hint;
  }
  for (const k of order) {
    const re = SHAPE[k]!;
    if (k === 'currency' && share((v) => CURRENCIES.has(compact(v))) < 0.8) continue;
    if (k === 'country' && share((v) => isCountryCode(compact(v))) < 0.8) continue;
    if (k === 'bic' && share((v) => re.test(compact(v))) >= 0.8 && hint !== 'id') return 'bic';
    if (k !== 'bic' && share((v) => re.test(compact(v))) >= 0.8) return k;
  }
  if (share((v) => DATE_STYLES.some(([, r]) => r.test(v.trim()))) >= 0.8) return 'date';
  if (hint === 'id') return 'id';
  if (hint === 'amount' || share((v) => AMOUNT.test(v.trim())) >= 0.9) return share((v) => NUMBER.test(v.trim())) >= 0.9 && hint !== 'amount' ? 'number' : 'amount';
  const distinct = new Set(vals).size;
  if (distinct === vals.length && vals.length >= 5 && share((v) => /^[A-Za-z0-9][A-Za-z0-9_\-/.]*$/.test(v.trim()) && /\d/.test(v)) >= 0.9) return 'id';
  return 'text';
}

function valid(kind: Kind, raw: string): boolean {
  const v = compact(raw);
  switch (kind) {
    case 'iban': return ibanValid(v);
    case 'bic': return SHAPE.bic!.test(v) && isCountryCode(v.slice(4, 6));
    case 'lei': return leiValid(v);
    case 'isin': return isinValid(v);
    case 'currency': return CURRENCIES.has(v);
    case 'country': return isCountryCode(v);
    case 'email': return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw.trim());
    case 'date': {
      const t = raw.trim();
      const s = DATE_STYLES.find(([, r]) => r.test(t));
      return !!s && dateValid(t, s[0]);
    }
    case 'amount': return AMOUNT.test(raw.trim());
    case 'number': return NUMBER.test(raw.trim());
    default: return true;
  }
}

/** Style of a value, so that a column written two ways can be spotted. */
function style(kind: Kind, raw: string): string {
  if (raw !== raw.trim() || /\s{2,}/.test(raw)) return 'extra spaces';
  const v = raw.trim();
  switch (kind) {
    case 'date': return DATE_STYLES.find(([, r]) => r.test(v))?.[0] ?? 'other';
    case 'iban': case 'bic': case 'lei': case 'isin': case 'currency': case 'country':
      return v === v.toUpperCase() ? (/\s/.test(v) ? 'grouped with spaces' : 'upper case') : 'lower case';
    case 'amount': return /,\d{1,2}$/.test(v) ? 'decimal comma' : /\.\d{1,2}$/.test(v) ? 'decimal point' : 'whole';
    default: return 'any';
  }
}

const ratio = (a: number, b: number): number => (b ? a / b : 1);
const examples = (xs: string[]): string[] => [...new Set(xs)].slice(0, 5);

export function profileColumn(name: string, values: string[]): ColumnProfile {
  const kind = detectKind(name, values);
  const filledVals = values.filter((v) => v.trim() !== '');
  const blank = values.length - filledVals.length;
  const bad: string[] = [];
  for (const v of filledVals) if (!valid(kind, v)) bad.push(v);
  const styles = new Map<string, number>();
  for (const v of filledVals) {
    const s = style(kind, v);
    styles.set(s, (styles.get(s) ?? 0) + 1);
  }
  const mainStyle = [...styles.entries()].filter(([s]) => s !== 'extra spaces').sort((a, b) => b[1] - a[1])[0]?.[0];
  const off = filledVals.filter((v) => style(kind, v) !== mainStyle && !(style(kind, v) === 'whole' && mainStyle?.startsWith('decimal')));
  const counts = new Map<string, number>();
  for (const v of filledVals) counts.set(v.trim(), (counts.get(v.trim()) ?? 0) + 1);
  const keyLike = kind === 'id';
  const dupVals = [...counts.entries()].filter(([, c]) => c > 1);
  const duplicates = keyLike ? dupVals.reduce((a, [, c]) => a + c - 1, 0) : 0;
  const recognised = !['text', 'id'].includes(kind);
  const completeness = ratio(filledVals.length, values.length);
  const validity = recognised ? ratio(filledVals.length - bad.length, filledVals.length) : null;
  const uniqueness = keyLike ? ratio(filledVals.length - duplicates, filledVals.length) : null;
  const consistency = ratio(filledVals.length - off.length, filledVals.length);
  const parts = [completeness, consistency, validity, uniqueness].filter((x): x is number => x !== null);
  return {
    name, kind, filled: filledVals.length, blank, distinct: counts.size,
    invalid: bad.length, invalidExamples: examples(bad),
    inconsistent: off.length, inconsistentExamples: examples(off),
    duplicates, duplicateExamples: examples(dupVals.map(([v]) => v)),
    completeness, validity, uniqueness, consistency,
    score: parts.reduce((a, b) => a + b, 0) / parts.length,
  };
}

export function scorecard(rows: Row[]): Scorecard {
  const names = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const columns = names.map((n) => profileColumn(n, rows.map((r) => r[n] ?? '')));
  const seen = new Map<string, number>();
  let duplicateRows = 0;
  for (const r of rows) {
    const k = names.map((n) => (r[n] ?? '').trim().toLowerCase()).join('\u0001');
    if (seen.has(k)) duplicateRows++;
    seen.set(k, 1);
  }
  const cross: CrossCheck[] = [];
  const of = (k: Kind) => columns.filter((c) => c.kind === k);
  const country = of('country').find((c) => !/bank|iban/.test(c.name));
  for (const ib of of('iban')) {
    if (country) {
      let checked = 0;
      const ex: string[] = [];
      for (const r of rows) {
        const iban = compact(r[ib.name] ?? ''), c = compact(r[country.name] ?? '');
        if (!ibanValid(iban) || !isCountryCode(c)) continue;
        checked++;
        if (ibanCountry(iban) !== c) ex.push(`${iban} / ${c}`);
      }
      if (checked) cross.push({ columns: [ib.name, country.name], rule: 'IBAN country matches the country column', failed: ex.length, checked, examples: examples(ex) });
    }
    for (const b of of('bic')) {
      let checked = 0;
      const ex: string[] = [];
      for (const r of rows) {
        const iban = compact(r[ib.name] ?? ''), bic = compact(r[b.name] ?? '');
        if (!ibanValid(iban) || !valid('bic', bic)) continue;
        checked++;
        if (ibanCountry(iban) !== bic.slice(4, 6)) ex.push(`${bic} / ${iban}`);
      }
      if (checked) cross.push({ columns: [b.name, ib.name], rule: 'BIC country matches the IBAN country', failed: ex.length, checked, examples: examples(ex) });
    }
  }
  const avg = (xs: (number | null)[], w: number[]): number => {
    let s = 0, t = 0;
    xs.forEach((x, i) => { if (x !== null) { s += x * w[i]; t += w[i]; } });
    return t ? s / t : 1;
  };
  const filled = columns.map((c) => c.filled);
  const completeness = avg(columns.map((c) => c.completeness), columns.map(() => 1));
  const validityBase = avg(columns.map((c) => c.validity), filled);
  const crossChecked = cross.reduce((a, c) => a + c.checked, 0);
  const validity = crossChecked ? (validityBase * 3 + ratio(crossChecked - cross.reduce((a, c) => a + c.failed, 0), crossChecked)) / 4 : validityBase;
  const uniqueness = Math.min(avg(columns.map((c) => c.uniqueness), filled), ratio(rows.length - duplicateRows, rows.length));
  const consistency = avg(columns.map((c) => c.consistency), filled);
  const score = Math.round(100 * (completeness * 0.3 + validity * 0.35 + uniqueness * 0.15 + consistency * 0.2));
  const grade = score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : score >= 50 ? 'D' : 'E';
  return { rows: rows.length, columns, duplicateRows, cross, dimensions: { completeness, validity, uniqueness, consistency }, score, grade };
}
