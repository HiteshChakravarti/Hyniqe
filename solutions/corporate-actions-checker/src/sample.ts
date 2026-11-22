// Generated corporate action notices from three sources with labelled disagreements.
// Issuers, ISINs and figures are fictional (ISINs have valid check digits).

import type { Row } from '../../shared/csv.ts';
import { rng } from '../../ssi-checker/src/sample.ts';

export type Injected = 'EX_DATE' | 'PAY_DATE' | 'RATE' | 'RATIO' | 'OPTIONS' | 'DATE_ORDER' | 'DEADLINE_SOON' | 'NO_DEADLINE';
export const INJECTED: Injected[] = ['EX_DATE', 'PAY_DATE', 'RATE', 'RATIO', 'OPTIONS', 'DATE_ORDER', 'DEADLINE_SOON', 'NO_DEADLINE'];
/** Finding code and field expected for each injected problem. */
export const EXPECT: Record<Injected, [string, string]> = {
  EX_DATE: ['DISAGREE', 'exDate'], PAY_DATE: ['DISAGREE', 'payDate'], RATE: ['DISAGREE', 'rate'], RATIO: ['DISAGREE', 'ratio'], OPTIONS: ['DISAGREE', 'options'],
  DATE_ORDER: ['DATE_ORDER', 'dates'], DEADLINE_SOON: ['DEADLINE_SOON', 'deadline'], NO_DEADLINE: ['NO_DEADLINE', 'deadline'],
};

export function isinWithCheck(base11: string): string {
  const digits = base11.split('').map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c)).join('');
  for (let d = 0; d <= 9; d++) {
    const s = digits + d;
    let sum = 0;
    for (let i = 0; i < s.length; i++) {
      let x = Number(s[s.length - 1 - i]);
      if (i % 2 === 1) {
        x *= 2;
        if (x > 9) x -= 9;
      }
      sum += x;
    }
    if (sum % 10 === 0) return base11 + d;
  }
  return base11 + '0';
}

const ISSUERS = ['Aldermoor Energy', 'Brightline Telecom', 'Carrow Pharma', 'Dunmere Banking Group', 'Eastfield Retail', 'Fernhill Mining', 'Glenrock Insurance', 'Halloway Industrial', 'Ivel Foods', 'Juno Logistics', 'Kelso Semiconductors', 'Lomond Utilities'];
const SOURCES = ['Custodian A', 'Vendor B', 'Vendor C'];
const day0 = Date.UTC(2026, 10, 22) / 86_400_000;
const iso = (d: number): string => new Date(d * 86_400_000).toISOString().slice(0, 10);
const nextBiz = (d: number, n: number): number => {
  let x = d;
  let k = 0;
  while (k < n) {
    x++;
    const wd = new Date(x * 86_400_000).getUTCDay();
    if (wd !== 0 && wd !== 6) k++;
  }
  return x;
};

export interface LabelledNotices {
  rows: Row[];
  /** ISIN + event type -> injected problem */
  labels: Map<string, Injected>;
  events: number;
}

export function generateNotices(opts: { events?: number; seed?: number; rate?: number } = {}): LabelledNotices {
  const r = rng(opts.seed ?? 6);
  const int = (n: number): number => Math.floor(r() * n);
  const rows: Row[] = [];
  const labels = new Map<string, Injected>();
  const n = opts.events ?? 40;
  for (let e = 0; e < n; e++) {
    const country = ['GB', 'DE', 'FR', 'NL', 'IE'][int(5)];
    const isin = isinWithCheck(`${country}${String(int(1e9)).padStart(9, '0')}`);
    const issuer = ISSUERS[int(ISSUERS.length)];
    const type = ['DVCA', 'DVCA', 'DVCA', 'SPLF', 'TEND', 'RHTS'][int(6)];
    const voluntary = type === 'TEND' || type === 'RHTS';
    const ex = nextBiz(day0, 5 + int(40));
    const rec = nextBiz(ex, 1);
    const pay = nextBiz(rec, 5 + int(15));
    const base: Row = {
      isin, security: issuer, event_type: type, mandatory_voluntary: voluntary ? 'VOLU' : 'MAND',
      ex_date: iso(ex), record_date: iso(rec), pay_date: iso(pay),
      rate: type === 'DVCA' ? (0.05 + int(200) / 100).toFixed(4) : '', currency: type === 'DVCA' ? (country === 'GB' ? 'GBP' : 'EUR') : '',
      ratio: type === 'SPLF' ? `${[2, 3, 5, 10][int(4)]}:1` : type === 'RHTS' ? '1:4' : '',
      options: voluntary ? 'CASH,NOAC' : 'CASH', default_option: voluntary ? 'NOAC' : 'CASH',
      election_deadline: voluntary ? iso(nextBiz(day0, 8 + int(10))) : '', market_deadline: voluntary ? iso(nextBiz(day0, 20 + int(5))) : '',
    };
    const k = 2 + int(2);
    const copies: Record<string, string>[] = SOURCES.slice(0, k).map((s) => ({ ...base, source: s }));
    // Cosmetic differences that must not be flagged: date format, ratio format, rate precision.
    if (r() < 0.4) {
      const c = copies[1];
      c.ex_date = c.ex_date.split('-').reverse().join('/');
      if (c.ratio) c.ratio = c.ratio.replace(':', ' for ');
      if (c.rate) c.rate = String(Number(c.rate));
    }
    if (r() < 0.45) {
      let p = INJECTED[int(INJECTED.length)];
      if ((p === 'RATE' && type !== 'DVCA') || (p === 'RATIO' && !base.ratio)) p = 'PAY_DATE';
      if ((p === 'OPTIONS' || p === 'DEADLINE_SOON' || p === 'NO_DEADLINE') && !voluntary) p = 'EX_DATE';
      labels.set(`${isin}|${type}`, p);
      const c = copies[copies.length - 1];
      if (p === 'EX_DATE') c.ex_date = iso(nextBiz(ex, 1));
      if (p === 'PAY_DATE') c.pay_date = iso(nextBiz(pay, 2));
      if (p === 'RATE') c.rate = (Number(base.rate) + 0.01).toFixed(4);
      if (p === 'RATIO') c.ratio = c.ratio.replace(/^\d+/, (m) => String(Number(m) + 1));
      if (p === 'OPTIONS') c.options = 'CASH,SECU,NOAC';
      if (p === 'DATE_ORDER') c.pay_date = iso(ex - 3);
      if (p === 'DEADLINE_SOON') for (const x of copies) x.election_deadline = iso(nextBiz(day0, 1));
      if (p === 'NO_DEADLINE') for (const x of copies) x.election_deadline = '';
    }
    rows.push(...copies);
  }
  for (let i = rows.length - 1; i > 0; i--) {
    const j = int(i + 1);
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return { rows, labels, events: n };
}
