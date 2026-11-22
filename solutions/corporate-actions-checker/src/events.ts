// Corporate Actions Checker: groups the same event from several sources (custodians, data vendors)
// and lists every disagreement in dates, rates, ratios and options, plus dates in an impossible
// order and election deadlines that leave too little time to act.

import { pick, type Row } from '../../shared/csv.ts';

export type Severity = 'error' | 'review' | 'info';

export interface Notice {
  row: number;
  source: string;
  isin: string;
  security: string;
  eventType: string;
  mandatory: string;
  exDate: string;
  recordDate: string;
  payDate: string;
  rate: string;
  currency: string;
  ratio: string;
  options: string;
  defaultOption: string;
  deadline: string;
  marketDeadline: string;
}

export interface Finding {
  eventKey: string;
  isin: string;
  eventType: string;
  field: string;
  code: string;
  severity: Severity;
  message: string;
  action: string;
}

export interface EventGroup {
  key: string;
  isin: string;
  security: string;
  eventType: string;
  sources: string[];
  notices: Notice[];
  status: 'agree' | 'disagree' | 'single source';
}

export interface CheckResult {
  events: EventGroup[];
  findings: Finding[];
  notices: number;
}

export const COLUMNS: Record<keyof Omit<Notice, 'row'>, string[]> = {
  source: ['source', 'provider', 'custodian', 'vendor', 'from'],
  isin: ['isin', 'security_id', 'isin_code'],
  security: ['security', 'security_name', 'name', 'issuer'],
  eventType: ['event_type', 'event', 'ca_type', 'type', 'caev'],
  mandatory: ['mandatory_voluntary', 'mand_volu', 'mandatory', 'camv', 'event_category'],
  exDate: ['ex_date', 'exdate', 'xdte'],
  recordDate: ['record_date', 'recdate', 'recd'],
  payDate: ['pay_date', 'payment_date', 'paydate', 'pay'],
  rate: ['rate', 'gross_rate', 'gross_amount', 'amount_per_share', 'grss'],
  currency: ['currency', 'ccy', 'rate_currency'],
  ratio: ['ratio', 'new_to_old', 'adex', 'split_ratio'],
  options: ['options', 'option_types', 'caop'],
  defaultOption: ['default_option', 'default'],
  deadline: ['election_deadline', 'response_deadline', 'deadline', 'custodian_deadline'],
  marketDeadline: ['market_deadline', 'mkdt'],
};

const TYPE_NAMES: Record<string, string> = {
  DVCA: 'Cash dividend', DVSE: 'Stock dividend', DVOP: 'Dividend option', SPLF: 'Stock split', SPLR: 'Reverse split', RHTS: 'Rights issue', RHDI: 'Rights distribution',
  TEND: 'Tender offer', BIDS: 'Repurchase offer', MRGR: 'Merger', BONU: 'Bonus issue', EXOF: 'Exchange offer', INTR: 'Interest payment', REDM: 'Redemption', CAPD: 'Capital distribution', SOFF: 'Spin-off', MEET: 'Meeting',
};
export const typeName = (t: string): string => TYPE_NAMES[t] ?? t;
const VOLUNTARY = new Set(['VOLU', 'CHOS', 'VOLUNTARY', 'CHOICE', 'MANDATORY WITH OPTIONS']);

function normDate(s: string): string {
  const t = s.trim();
  let m = /^(\d{4})-?(\d{2})-?(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(t);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return t;
}
const normRate = (s: string): string => {
  const n = Number(s.replace(',', '.').replace(/[^\d.-]/g, ''));
  return s.trim() === '' || !Number.isFinite(n) ? '' : String(Math.round(n * 1e6) / 1e6);
};
const normRatio = (s: string): string => {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(?:[:/]|for)\s*(\d+(?:\.\d+)?)\s*$/i.exec(s);
  if (!m) return s.trim().toUpperCase();
  const a = Number(m[1]);
  const b = Number(m[2]);
  const g = (x: number, y: number): number => (y ? g(y, x % y) : x);
  const d = Number.isInteger(a) && Number.isInteger(b) ? g(a, b) || 1 : 1;
  return `${a / d}:${b / d}`;
};
const normList = (s: string): string => s.toUpperCase().split(/[\s,;/|]+/).filter(Boolean).sort().join(',');
const dayNum = (iso: string): number | null => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000 : null);

function businessDaysBetween(from: number, to: number): number {
  let n = 0;
  for (let d = from + 1; d <= to; d++) {
    const wd = new Date(d * 86_400_000).getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return n;
}

export function toNotice(r: Row, i: number): Notice {
  const g = (k: keyof typeof COLUMNS): string => pick(r, ...COLUMNS[k]).trim();
  return {
    row: i + 2,
    source: g('source') || 'Unknown source',
    isin: g('isin').toUpperCase(),
    security: g('security'),
    eventType: g('eventType').toUpperCase(),
    mandatory: g('mandatory').toUpperCase(),
    exDate: normDate(g('exDate')),
    recordDate: normDate(g('recordDate')),
    payDate: normDate(g('payDate')),
    rate: g('rate'),
    currency: g('currency').toUpperCase(),
    ratio: g('ratio'),
    options: g('options'),
    defaultOption: g('defaultOption').toUpperCase(),
    deadline: normDate(g('deadline')),
    marketDeadline: normDate(g('marketDeadline')),
  };
}

/** ISIN check digit (Luhn over the letters-as-numbers expansion). */
export function isinValid(isin: string): boolean {
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin)) return false;
  const digits = isin.split('').map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c)).join('');
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function checkEvents(rows: Row[], opts: { today?: Date; minBusinessDays?: number } = {}): CheckResult {
  const today = Math.floor((opts.today ?? new Date()).getTime() / 86_400_000);
  const minDays = opts.minBusinessDays ?? 3;
  const notices = rows.map(toNotice).filter((n) => n.isin || n.eventType);
  const findings: Finding[] = [];

  // Group: same ISIN and event type; then split by date so quarterly dividends stay apart.
  const byKey = new Map<string, Notice[]>();
  for (const n of notices) byKey.set(`${n.isin}|${n.eventType}`, [...(byKey.get(`${n.isin}|${n.eventType}`) ?? []), n]);
  const events: EventGroup[] = [];
  for (const [k, list] of byKey) {
    const anchor = (n: Notice): number => dayNum(n.exDate) ?? dayNum(n.recordDate) ?? dayNum(n.payDate) ?? 0;
    const sorted = [...list].sort((a, b) => anchor(a) - anchor(b));
    let cluster: Notice[] = [];
    const flush = (): void => {
      if (!cluster.length) return;
      const first = cluster[0];
      events.push({ key: `${first.isin} ${first.eventType} ${first.exDate || first.recordDate || first.payDate}`, isin: first.isin, security: cluster.find((c) => c.security)?.security ?? '', eventType: first.eventType, sources: [...new Set(cluster.map((c) => c.source))], notices: cluster, status: 'agree' });
      cluster = [];
    };
    for (const n of sorted) {
      if (cluster.length && Math.abs(anchor(n) - anchor(cluster[0])) > 31) flush();
      cluster.push(n);
    }
    flush();
    void k;
  }

  for (const ev of events) {
    const add = (field: string, code: string, severity: Severity, message: string, action: string): void => {
      findings.push({ eventKey: ev.key, isin: ev.isin, eventType: ev.eventType, field, code, severity, message, action });
    };
    if (ev.isin && !isinValid(ev.isin)) add('isin', 'ISIN_INVALID', 'error', `ISIN ${ev.isin} fails its check digit.`, 'Correct the security identifier with the source that sent it.');
    if (ev.sources.length < 2) add('source', 'SINGLE_SOURCE', 'info', `Only ${ev.sources[0]} reported this event, so it cannot be confirmed against a second source.`, 'Check against a second source before acting if the event is material.');

    const compare = (field: keyof Notice, label: string, norm: (s: string) => string, severity: Severity = 'error'): void => {
      const vals = new Map<string, string[]>();
      for (const n of ev.notices) {
        const v = norm(String(n[field] ?? ''));
        if (!v) continue;
        vals.set(v, [...(vals.get(v) ?? []), n.source]);
      }
      if (vals.size > 1) {
        add(field, 'DISAGREE', severity, `${label} differs: ${[...vals].map(([v, s]) => `${s.join(' and ')} say ${v}`).join('; ')}.`, `Confirm the ${label.toLowerCase()} with the issuer's agent or the market announcement before processing.`);
      }
      const missing = ev.notices.filter((n) => !norm(String(n[field] ?? ''))).map((n) => n.source);
      if (vals.size && missing.length && ev.sources.length > 1) add(field, 'MISSING', 'review', `${label} is missing from ${missing.join(', ')}.`, `Ask ${missing.join(', ')} for the ${label.toLowerCase()}.`);
    };
    compare('exDate', 'Ex date', normDate);
    compare('recordDate', 'Record date', normDate);
    compare('payDate', 'Pay date', normDate);
    compare('rate', 'Rate', normRate);
    compare('currency', 'Currency', (s) => s.toUpperCase());
    compare('ratio', 'Ratio', normRatio);
    compare('mandatory', 'Mandatory or voluntary flag', (s) => s.toUpperCase());
    compare('options', 'Options', normList);
    compare('defaultOption', 'Default option', (s) => s.toUpperCase(), 'review');
    compare('deadline', 'Election deadline', normDate);

    // Each source's own dates must be in a possible order.
    for (const n of ev.notices) {
      const ex = dayNum(n.exDate);
      const rec = dayNum(n.recordDate);
      const pay = dayNum(n.payDate);
      if (ex !== null && rec !== null && ex > rec) add('dates', 'DATE_ORDER', 'error', `${n.source} has the ex date (${n.exDate}) after the record date (${n.recordDate}).`, `Ask ${n.source} to correct the dates.`);
      if (rec !== null && pay !== null && pay < rec) add('dates', 'DATE_ORDER', 'error', `${n.source} has the pay date (${n.payDate}) before the record date (${n.recordDate}).`, `Ask ${n.source} to correct the dates.`);
      if (n.eventType === 'DVCA' && n.rate && Number(normRate(n.rate)) <= 0) add('rate', 'RATE_ZERO', 'error', `${n.source} gives a cash dividend rate of ${n.rate}.`, 'Confirm the rate before processing.');
      const dl = dayNum(n.deadline);
      const md = dayNum(n.marketDeadline);
      if (dl !== null && md !== null && dl > md) add('deadline', 'DEADLINE_AFTER_MARKET', 'error', `${n.source}'s election deadline (${n.deadline}) is after the market deadline (${n.marketDeadline}).`, 'Use the earlier deadline; instructions after the market deadline cannot be accepted.');
    }

    // Voluntary events: deadline must exist and leave time to act.
    const voluntary = ev.notices.some((n) => VOLUNTARY.has(n.mandatory)) || ['TEND', 'BIDS', 'EXOF', 'RHTS', 'DVOP'].includes(ev.eventType);
    if (voluntary) {
      const dls = ev.notices.map((n) => dayNum(n.deadline)).filter((d): d is number => d !== null);
      if (!dls.length) add('deadline', 'NO_DEADLINE', 'error', 'This is a voluntary event but no source gives an election deadline.', 'Get the deadline from your custodian today.');
      else {
        const earliest = Math.min(...dls);
        const left = earliest < today ? -1 : businessDaysBetween(today, earliest);
        const date = new Date(earliest * 86_400_000).toISOString().slice(0, 10);
        if (earliest < today) add('deadline', 'DEADLINE_PASSED', 'error', `The earliest election deadline (${date}) has passed.`, 'Contact the custodian about late instructions; the default option may already apply.');
        else if (left < minDays) add('deadline', 'DEADLINE_SOON', 'review', `The earliest election deadline (${date}) is ${left} business day${left === 1 ? '' : 's'} away.`, 'Collect client elections now.');
      }
    }
    ev.status = findings.some((f) => f.eventKey === ev.key && f.code === 'DISAGREE') ? 'disagree' : ev.sources.length < 2 ? 'single source' : 'agree';
  }
  return { events, findings, notices: notices.length };
}
