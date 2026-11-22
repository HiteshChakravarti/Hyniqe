// Labelled vendor master generator for tests and the benchmark.
import { makeIban } from '../../../engine/src/address/iban.ts';
import { toCsv } from '../../shared/csv.ts';
import { rng } from '../../ssi-checker/src/sample.ts';

export const INJECTED = ['DUPLICATE_VENDOR', 'SHARED_IBAN', 'IBAN_INVALID', 'IBAN_COUNTRY', 'VAT_FORMAT', 'MISSING_BANK', 'BIC_FORMAT'] as const;
export type Injected = (typeof INJECTED)[number];

export interface Label {
  kind: Injected;
  /** The other record involved (the original for a duplicate, the account holder for a shared IBAN). */
  other?: string;
}

const A = ['Redwood', 'Kestrel', 'Harbor', 'Summit', 'Bluebell', 'Granite', 'Northwind', 'Silverline', 'Oakridge', 'Meridian', 'Falcon', 'Lumen', 'Cobalt', 'Juniper', 'Sterling', 'Aurora', 'Beacon', 'Cedar', 'Delta', 'Evergreen', 'Fjord', 'Hawthorn', 'Ironbridge', 'Lakeside', 'Maple', 'Orion', 'Pioneer', 'Quarry', 'Riverside', 'Saffron', 'Thistle', 'Upland', 'Vantage', 'Willow', 'Zenith'];
const B = ['Textiles', 'Logistics', 'Packaging', 'Engineering', 'Foods', 'Software', 'Chemicals', 'Print', 'Electrical', 'Metals', 'Freight', 'Consulting', 'Plastics', 'Furniture', 'Pharma', 'Office Supplies', 'Tooling', 'Catering'];
const LEGAL: Record<string, string[]> = { DE: ['GmbH', 'AG'], FR: ['SAS', 'SA'], ES: ['S.L.', 'S.A.'], NL: ['B.V.'], IT: ['S.r.l.', 'S.p.A.'], GB: ['Ltd', 'Limited', 'plc'], BE: ['NV', 'BV'], AT: ['GmbH'], IE: ['Ltd'], PL: ['Sp. z o.o.'] };
const COUNTRIES = Object.keys(LEGAL);

function digits(r: () => number, n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(r() * 10);
  return s;
}

function vatFor(r: () => number, c: string): string {
  switch (c) {
    case 'AT': return `ATU${digits(r, 8)}`;
    case 'BE': return `BE0${digits(r, 9)}`;
    case 'ES': return `ESB${digits(r, 8)}`;
    case 'FR': return `FR${digits(r, 2)}${digits(r, 9)}`;
    case 'IE': return `IE${digits(r, 7)}W`;
    case 'IT': return `IT${digits(r, 11)}`;
    case 'NL': return `NL${digits(r, 9)}B01`;
    case 'PL': return `PL${digits(r, 10)}`;
    case 'GB': return `GB${digits(r, 9)}`;
    default: return `DE${digits(r, 9)}`;
  }
}

/** Format differences that must not be flagged. */
function cosmeticVat(v: string, r: () => number): string {
  const x = r();
  if (x < 0.2) return `${v.slice(0, 2)} ${v.slice(2, 5)} ${v.slice(5)}`;
  if (x < 0.3) return v.slice(0, 2).toLowerCase() + v.slice(2);
  return v;
}

function variant(name: string, legal: string, r: () => number): string {
  const x = r();
  if (x < 0.25) return `${name.toUpperCase()} ${legal.toUpperCase()}`;
  if (x < 0.5) return legal === 'Ltd' ? `${name} Limited` : `${name}`;
  if (x < 0.7) return `${name}, ${legal}`.replace(' Office Supplies', ' Office-Supplies');
  // one-letter typo inside the longest word
  const words = name.split(' ');
  const w = words.reduce((a, b) => (b.length > a.length ? b : a));
  const at = 2 + Math.floor(r() * (w.length - 3));
  const typo = w.slice(0, at) + w.slice(at + 1);
  return `${name.replace(w, typo)} ${legal}`;
}

export interface LabelledVendors {
  rows: Record<string, string>[];
  labels: Map<string, Label>;
  csv: string;
}

export function generateVendors(opts: { count?: number; defectRate?: number; seed?: number } = {}): LabelledVendors {
  const r = rng(opts.seed ?? 7);
  const count = opts.count ?? 200;
  const rows: Record<string, string>[] = [];
  const labels = new Map<string, Label>();
  const used = new Set<string>();
  let n = 10000;
  const newBase = (): { name: string; country: string; legal: string } => {
    for (;;) {
      const name = `${A[Math.floor(r() * A.length)]} ${B[Math.floor(r() * B.length)]}`;
      const first = name.split(' ')[0];
      if (used.has(name) || [...used].some((u) => u.startsWith(first + ' ') && r() < 0.5)) continue;
      used.add(name);
      const country = COUNTRIES[Math.floor(r() * COUNTRIES.length)];
      const l = LEGAL[country];
      return { name, country, legal: l[Math.floor(r() * l.length)] };
    }
  };
  const bic = (c: string) => `${'ABCDEFGHJKLMNPRSTUVW'[Math.floor(r() * 20)]}${'ABCDEFGHJKLMNPRSTUVW'[Math.floor(r() * 20)]}KB${c}${'2X'[Math.floor(r() * 2)]}${Math.floor(r() * 10)}`;
  const make = (b: { name: string; country: string; legal: string }) => ({
    vendor_id: `V-${n++}`,
    name: `${b.name} ${b.legal}`,
    country: b.country,
    iban: makeIban(b.country, digits(r, 18)),
    bic: bic(b.country),
    vat_number: vatFor(r, b.country),
  });
  const bases: { b: ReturnType<typeof newBase>; row: Record<string, string> }[] = [];
  for (let i = 0; i < count; i++) {
    const b = newBase();
    const row = make(b);
    row.vat_number = cosmeticVat(row.vat_number, r);
    if (r() < 0.15) row.iban = row.iban.replace(/(.{4})/g, '$1 ').trim().toLowerCase();
    rows.push(row);
    bases.push({ b, row });
  }
  const pickClean = (): { b: ReturnType<typeof newBase>; row: Record<string, string> } => {
    for (;;) {
      const x = bases[Math.floor(r() * bases.length)];
      if (!labels.has(x.row.vendor_id) && ![...labels.values()].some((l) => l.other === x.row.vendor_id)) return x;
    }
  };
  const defects = Math.round(count * (opts.defectRate ?? 0.2));
  for (let k = 0; k < defects; k++) {
    const kind = INJECTED[k % INJECTED.length];
    if (kind === 'DUPLICATE_VENDOR') {
      const o = pickClean();
      const dup = make(o.b);
      dup.name = variant(o.b.name, o.b.legal, r);
      const how = r();
      if (how < 0.4) dup.iban = o.row.iban;
      else if (how < 0.7) dup.vat_number = o.row.vat_number.replace(/\s/g, '').toUpperCase();
      rows.push(dup);
      labels.set(dup.vendor_id, { kind, other: o.row.vendor_id });
    } else if (kind === 'SHARED_IBAN') {
      const o = pickClean();
      const other = make(newBase());
      other.country = o.row.country;
      other.iban = o.row.iban;
      other.bic = o.row.bic;
      other.vat_number = vatFor(r, other.country);
      rows.push(other);
      labels.set(other.vendor_id, { kind, other: o.row.vendor_id });
    } else {
      const x = pickClean().row;
      labels.set(x.vendor_id, { kind });
      if (kind === 'IBAN_INVALID') {
        const s = x.iban.replace(/\s/g, '').toUpperCase();
        const p = 6 + Math.floor(r() * 10);
        x.iban = s.slice(0, p) + String((Number(s[p]) + 1) % 10) + s.slice(p + 1);
      } else if (kind === 'IBAN_COUNTRY') {
        const other = COUNTRIES.find((c) => c !== x.country && c !== 'GB')!;
        x.iban = makeIban(other, digits(r, 18));
        x.bic = bic(other);
      } else if (kind === 'VAT_FORMAT') x.vat_number = x.vat_number.replace(/\s/g, '').slice(0, -1);
      else if (kind === 'MISSING_BANK') { x.iban = ''; x.bic = ''; }
      else if (kind === 'BIC_FORMAT') x.bic = x.bic.slice(0, 7);
    }
  }
  return { rows, labels, csv: toCsv(rows) };
}
