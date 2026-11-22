// Labelled vendor history and payment runs for tests and the benchmark.
import { makeIban } from '../../../engine/src/address/iban.ts';
import { toCsv } from '../../shared/csv.ts';
import { rng } from '../../ssi-checker/src/sample.ts';

export const INJECTED = ['ACCOUNT_CHANGED', 'FOREIGN_ACCOUNT', 'OTHER_PAYEES_ACCOUNT', 'NEW_PAYEE_LARGE', 'AMOUNT_SPIKE', 'IBAN_INVALID', 'RECENT_CHANGE'] as const;
export type Injected = (typeof INJECTED)[number];

const A = ['Redwood', 'Kestrel', 'Harbor', 'Summit', 'Bluebell', 'Granite', 'Northwind', 'Silverline', 'Oakridge', 'Meridian', 'Falcon', 'Lumen', 'Cobalt', 'Juniper', 'Sterling', 'Aurora', 'Beacon', 'Cedar', 'Evergreen', 'Fjord', 'Hawthorn', 'Ironbridge', 'Lakeside', 'Orion', 'Pioneer', 'Quarry', 'Saffron', 'Thistle', 'Vantage', 'Willow', 'Zenith'];
const B = ['Textiles', 'Logistics', 'Packaging', 'Engineering', 'Foods', 'Software', 'Chemicals', 'Print', 'Electrical', 'Metals', 'Freight', 'Consulting', 'Plastics', 'Furniture'];
const LEGAL: Record<string, string> = { DE: 'GmbH', FR: 'SAS', NL: 'B.V.', ES: 'S.L.', IT: 'S.r.l.', GB: 'Ltd', BE: 'NV', AT: 'GmbH' };
const CTRY = Object.keys(LEGAL);

export interface Labelled {
  history: Record<string, string>[];
  run: Record<string, string>[];
  labels: Map<number, Injected>;
  today: Date;
}

export function generateRun(opts: { seed?: number; vendors?: number; payments?: number } = {}): Labelled {
  const r = rng(opts.seed ?? 4);
  const d = (k: number) => Array.from({ length: k }, () => Math.floor(r() * 10)).join('');
  const today = new Date(Date.UTC(2026, 10, 20));
  const used = new Set<string>();
  const vendors: { id: string; name: string; country: string; iban: string; avg: number }[] = [];
  const nV = opts.vendors ?? 80;
  while (vendors.length < nV) {
    const base = `${A[Math.floor(r() * A.length)]} ${B[Math.floor(r() * B.length)]}`;
    if (used.has(base)) continue;
    used.add(base);
    const country = CTRY[Math.floor(r() * CTRY.length)];
    vendors.push({ id: `V${1000 + vendors.length}`, name: `${base} ${LEGAL[country]}`, country, iban: makeIban(country, d(18)), avg: 200 + Math.floor(r() * 8000) });
  }
  const history: Record<string, string>[] = [];
  for (const v of vendors) {
    const n = 2 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) history.push({ vendor_id: v.id, payee_name: v.name, iban: v.iban, country: v.country, amount: (v.avg * (0.6 + r() * 0.8)).toFixed(2), currency: 'EUR', bank_details_changed: '2025-03-01' });
  }
  const run: Record<string, string>[] = [];
  const labels = new Map<number, Injected>();
  const nP = opts.payments ?? 120;
  const taken = new Set<string>();
  for (let i = 0; i < nP; i++) {
    let v = vendors[Math.floor(r() * vendors.length)];
    // Each injected payment uses a vendor not otherwise in the run, so labels stay unambiguous.
    const inject = r() < 0.25 ? INJECTED[Math.floor(r() * INJECTED.length)] : null;
    if (inject) {
      const free = vendors.filter((x) => !taken.has(x.id));
      if (free.length < 3) continue;
      v = free[Math.floor(r() * free.length)];
    } else if (taken.has(v.id)) continue;
    taken.add(v.id);
    const p = { vendor_id: v.id, payee_name: r() < 0.3 ? v.name.toUpperCase() : v.name, iban: r() < 0.3 ? v.iban.replace(/(.{4})/g, '$1 ').trim() : v.iban, amount: (v.avg * (0.6 + r() * 0.8)).toFixed(2), currency: 'EUR' };
    if (inject === 'ACCOUNT_CHANGED') p.iban = makeIban(v.country, d(18));
    else if (inject === 'FOREIGN_ACCOUNT') p.iban = makeIban(CTRY.find((c) => c !== v.country)!, d(18));
    else if (inject === 'OTHER_PAYEES_ACCOUNT') {
      const other = vendors.find((x) => x.id !== v.id && !taken.has(x.id))!;
      taken.add(other.id);
      p.iban = other.iban;
    } else if (inject === 'NEW_PAYEE_LARGE') {
      const nb = `Nimbus ${B[Math.floor(r() * B.length)]} Trading ${d(2)} Ltd`;
      p.vendor_id = `NEW${d(4)}`;
      p.payee_name = nb;
      p.iban = makeIban('GB', d(18));
      p.amount = (15000 + Math.floor(r() * 40000)).toFixed(2);
    } else if (inject === 'AMOUNT_SPIKE') p.amount = (v.avg * 6).toFixed(2);
    else if (inject === 'IBAN_INVALID') {
      const s = v.iban;
      const k = 8 + Math.floor(r() * 8);
      p.iban = s.slice(0, k) + String((Number(s[k]) + 1) % 10) + s.slice(k + 1);
    } else if (inject === 'RECENT_CHANGE') {
      for (const h of history) if (h.vendor_id === v.id) h.bank_details_changed = '2026-11-12';
    }
    if (inject) labels.set(run.length, inject);
    run.push(p);
  }
  return { history, run, labels, today };
}

export const toCsvFiles = (g: Labelled): { history: string; run: string } => ({ history: toCsv(g.history), run: toCsv(g.run) });
