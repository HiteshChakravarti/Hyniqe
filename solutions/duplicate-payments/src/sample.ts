// Synthetic accounts-payable payments with labelled duplicates and realistic traps
// (monthly rent and subscriptions, equal amounts to unrelated suppliers). All names are fictional.

import { makeIban } from '../../../engine/src/address/iban.ts';
import type { Row } from '../../shared/csv.ts';
import { rng } from '../../ssi-checker/src/sample.ts';

export type DuplicateKind = 'exact' | 're-keyed' | 'vendor-variant' | 'second-channel';
export const KINDS: DuplicateKind[] = ['exact', 're-keyed', 'vendor-variant', 'second-channel'];

export interface LabelledPayments {
  rows: Row[];
  /** duplicate payment id -> { original id, kind } */
  labels: Map<string, { original: string; kind: DuplicateKind }>;
}

const STEMS = [
  'Acme Industrial', 'Borealis Logistics', 'Cobalt Facilities', 'Delta Office Supplies', 'Evergreen Packaging', 'Falcon IT Services',
  'Granite Construction', 'Harbor Freight Partners', 'Ion Electrical', 'Jasper Catering', 'Keystone Security', 'Lumen Print Works',
  'Mosaic Marketing', 'Nimbus Cloud Hosting', 'Orion Engineering', 'Pinnacle Staffing', 'Quartz Lab Supplies', 'Riverbend Waste',
  'Summit Legal', 'Titan Fleet Services', 'Unity Telecom', 'Vertex Consulting', 'Willow Cleaning', 'Xenon Lighting', 'Yarrow Translations', 'Zephyr HVAC',
];
const LEGAL = ['Ltd', 'Limited', 'Inc', 'GmbH', 'BV', 'SAS', 'LLC', 'PLC'];

/** A second vendor-master record for the same supplier, as created by a careless onboarding. */
function variant(name: string, r: () => number): string {
  const options = [
    () => name.toUpperCase(),
    () => name.replace(/ (Ltd|Limited|Inc|GmbH|BV|SAS|LLC|PLC)$/, ''),
    () => name.replace(/ (Ltd|Limited|Inc|GmbH|BV|SAS|LLC|PLC)$/, (m) => `${m}.`).replace(' ', ' & Co '),
    () => name.replace(/ (Ltd)$/, ' Limited').replace(/ (Inc)$/, ' Incorporated'),
    () => name.replace(/ (\w+)( \w+)$/, (_, a: string, b: string) => ` ${a.slice(0, 4)}.${b}`),
  ];
  return options[Math.floor(r() * options.length)]();
}

function rekey(inv: string, r: () => number): string {
  const digits = inv.replace(/\D/g, '');
  const opts = [
    () => digits, // prefix dropped
    () => `${inv}/A`, // suffix added
    () => {
      const i = 1 + Math.floor(r() * (digits.length - 2));
      return inv.replace(digits, digits.slice(0, i) + digits[i + 1] + digits[i] + digits.slice(i + 2)); // swapped digits
    },
    () => inv.toLowerCase().replace('-', ' '),
  ];
  let out = opts[Math.floor(r() * opts.length)]();
  if (out === inv) out = digits;
  return out;
}

export function generatePayments(opts: { count?: number; duplicateRate?: number; seed?: number } = {}): LabelledPayments {
  const count = opts.count ?? 1500;
  const dupRate = opts.duplicateRate ?? 0.03;
  const r = rng(opts.seed ?? 21);
  const int = (n: number): number => Math.floor(r() * n);
  const start = Date.UTC(2025, 10, 1);
  const date = (d: number): string => new Date(start + d * 86_400_000).toISOString().slice(0, 10);
  const vendors = STEMS.flatMap((s, i) => [0, 1, 2].map((k) => {
    const name = `${s}${k ? ` ${['Nordic', 'Iberia', 'Digital'][k]}` : ''} ${LEGAL[(i + k) % LEGAL.length]}`;
    return { id: `V${String(i * 3 + k + 1).padStart(4, '0')}`, name, iban: makeIban('DE', String(100000000000000000n + BigInt(i * 3 + k) * 7919n).slice(0, 18)), prefix: ['INV-', 'IN', 'F', '', 'BILL-'][int(5)] };
  }));
  const rows: Row[] = [];
  const labels = new Map<string, { original: string; kind: DuplicateKind }>();
  let n = 0;
  const nextId = (): string => `P${String(++n).padStart(6, '0')}`;

  // Recurring payments: rent and subscriptions, same amount every month (traps, never duplicates).
  for (const v of vendors.slice(0, 8)) {
    const amount = (500 + int(9000)) * 100 + [0, 0, 50, 99][int(4)];
    for (let m = 0; m < 12; m++) {
      rows.push({ payment_id: nextId(), vendor_id: v.id, vendor_name: v.name, invoice_number: `${v.prefix}${2025 * 100 + m + 1}${int(10)}`, payment_date: date(m * 30 + int(3)), amount: (amount / 100).toFixed(2), currency: 'EUR', iban: v.iban });
    }
  }
  // Ordinary one-off invoices.
  while (rows.length < count) {
    const v = vendors[8 + int(vendors.length - 8)];
    const cents = r() < 0.15 ? [10000, 25000, 50000, 100000][int(4)] : 5000 + int(4_000_000);
    rows.push({ payment_id: nextId(), vendor_id: v.id, vendor_name: v.name, invoice_number: `${v.prefix}${String(10000 + int(89999)).padStart(6, '0')}`, invoice_date: date(int(350)), payment_date: date(5 + int(355)), amount: (cents / 100).toFixed(2), currency: 'EUR', iban: v.iban });
  }
  // Inject labelled duplicates of randomly chosen one-off payments.
  const originals = rows.filter((x) => !vendors.slice(0, 8).some((v) => v.id === x.vendor_id));
  const target = Math.round(count * dupRate);
  const usedOriginals = new Set<string>();
  for (let k = 0; k < target; k++) {
    const o = originals[int(originals.length)];
    if (usedOriginals.has(o.payment_id) || Number(o.amount) < 100) continue;
    usedOriginals.add(o.payment_id);
    const kind = KINDS[int(KINDS.length)];
    const d: Row = { ...o, payment_id: nextId() };
    const shift = 1 + int(25);
    d.payment_date = date(Math.min(364, Math.round((Date.parse(o.payment_date) - start) / 86_400_000) + shift));
    if (kind === 're-keyed') d.invoice_number = rekey(o.invoice_number, r);
    if (kind === 'vendor-variant') {
      d.vendor_name = variant(o.vendor_name, r);
      d.vendor_id = `V9${String(int(999)).padStart(3, '0')}`;
    }
    if (kind === 'second-channel') d.invoice_number = `PO-${4500000 + int(99999)}`;
    rows.push(d);
    labels.set(d.payment_id, { original: o.payment_id, kind });
  }
  // Shuffle so duplicates are not at the end of the file.
  for (let i = rows.length - 1; i > 0; i--) {
    const j = int(i + 1);
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return { rows, labels };
}
