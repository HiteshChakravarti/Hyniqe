// Generate a synthetic vendor master extract for a fictional company.
// Deterministic (seeded) so tests and CI runs are reproducible.
// Usage: node scripts/seed.ts [count] [outfile]

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { makeIban } from '../src/address/iban.ts';
import { toCsv, type SourceRow } from '../src/records.ts';

let seed = 20261122;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const digits = (n: number) => Array.from({ length: n }, () => int(0, 9)).join('');
const letters = (n: number) => Array.from({ length: n }, () => String.fromCharCode(65 + int(0, 25))).join('');

interface Place { town: string; pc: string; region?: string; unique: boolean }
interface CountryDef {
  code: string;
  words: string[];
  form: string;
  streets: string[];
  places: Place[];
  iban?: () => string;
  owner: string;
  text: (b: string, street: string, p: Place, country: string | null) => string;
}

const C: CountryDef[] = [
  {
    code: 'GB', words: ['United Kingdom', 'UK', 'England', 'GB'], form: 'Ltd', owner: 'ap-emea@larkspur.example',
    streets: ['Canary Wharf Road', 'Victoria Street', 'King Street', 'Deansgate', 'Corporation Street'],
    places: [{ town: 'London', pc: 'E14 5AB', unique: false }, { town: 'Manchester', pc: 'M2 3WQ', unique: false }, { town: 'Leeds', pc: 'LS1 4DY', unique: true }, { town: 'Glasgow', pc: 'G2 1AL', unique: true }],
    iban: () => makeIban('GB', letters(4) + digits(14)),
    text: (b, s, p, c) => `${b} ${s}, ${p.town} ${p.pc}${c ? `, ${c}` : ''}`,
  },
  {
    code: 'DE', words: ['Germany', 'Deutschland'], form: 'GmbH', owner: 'ap-emea@larkspur.example',
    streets: ['Hauptstrasse', 'Friedrichstrasse', 'Königsallee', 'Mainzer Landstrasse'],
    places: [{ town: 'Berlin', pc: '10117', unique: true }, { town: 'Munich', pc: '80331', unique: true }, { town: 'Hamburg', pc: '20095', unique: true }, { town: 'Düsseldorf', pc: '40212', unique: true }],
    iban: () => makeIban('DE', digits(18)),
    text: (b, s, p, c) => `${s} ${b}\n${p.pc} ${p.town}${c ? `\n${c}` : ''}`,
  },
  {
    code: 'FR', words: ['France', 'FR'], form: 'SARL', owner: 'ap-emea@larkspur.example',
    streets: ['rue de Rivoli', 'rue de la République', 'boulevard Haussmann'],
    places: [{ town: 'Paris', pc: '75001', unique: false }, { town: 'Lyon', pc: '69002', unique: true }, { town: 'Marseille', pc: '13001', unique: true }],
    iban: () => makeIban('FR', digits(23)),
    text: (b, s, p, c) => `${b} ${s} ${p.pc} ${p.town}${c ? ` ${c}` : ''}`,
  },
  {
    code: 'NL', words: ['Netherlands', 'Holland', 'NL'], form: 'B.V.', owner: 'ap-emea@larkspur.example',
    streets: ['Keizersgracht', 'Herengracht', 'Coolsingel'],
    places: [{ town: 'Amsterdam', pc: '1015 CJ', unique: true }, { town: 'Rotterdam', pc: '3011 AD', unique: true }, { town: 'Utrecht', pc: '3511 AB', unique: true }],
    iban: () => makeIban('NL', letters(4) + digits(10)),
    text: (b, s, p, c) => `${s} ${b}, ${p.pc} ${p.town}${c ? `, ${c}` : ''}`,
  },
  {
    code: 'IN', words: ['India'], form: 'Pvt Ltd', owner: 'ap-apac@larkspur.example',
    streets: ['Bandra Kurla Complex', 'MG Road', 'Hinjewadi Phase 2', 'Anna Salai'],
    places: [{ town: 'Mumbai', pc: '400051', unique: true }, { town: 'Bengaluru', pc: '560001', unique: true }, { town: 'Pune', pc: '411057', unique: true }, { town: 'Chennai', pc: '600002', unique: true }, { town: 'Hyderabad', pc: '500081', unique: false }],
    text: (b, s, p, c) => `${pick(['Flat', 'Office', 'Unit'])} ${b}${pick(['A', 'B', ''])}, ${s}, ${p.town} ${p.pc}${c ? `, ${c}` : ''}`,
  },
  {
    code: 'SG', words: ['Singapore'], form: 'Pte Ltd', owner: 'ap-apac@larkspur.example',
    streets: ['Raffles Place', 'Marina Boulevard', 'Robinson Road'],
    places: [{ town: 'Singapore', pc: '048616', unique: true }, { town: 'Singapore', pc: '018989', unique: true }],
    text: (b, s, p) => `${b} ${s} #${int(2, 40)}-${int(1, 99)}, Singapore ${p.pc}`,
  },
  {
    code: 'US', words: ['USA', 'United States'], form: 'LLC', owner: 'ap-americas@larkspur.example',
    streets: ['Fifth Avenue', 'Market Street', 'Michigan Avenue', 'Congress Avenue'],
    places: [{ town: 'New York', pc: '10118', region: 'NY', unique: true }, { town: 'San Francisco', pc: '94105', region: 'CA', unique: true }, { town: 'Chicago', pc: '60611', region: 'IL', unique: true }, { town: 'Austin', pc: '78701', region: 'TX', unique: true }, { town: 'Springfield', pc: '62701', region: 'IL', unique: false }],
    text: (b, s, p, c) => (p.town === 'Springfield' && !c ? `${b} ${s}, Springfield` : `${b} ${s}, ${p.town}, ${p.region} ${p.pc}${c ? `, ${c}` : ''}`),
  },
  {
    code: 'AE', words: ['UAE', 'United Arab Emirates'], form: 'FZE', owner: 'ap-emea@larkspur.example',
    streets: ['Sheikh Zayed Road'], places: [{ town: 'Dubai', pc: '', unique: true }, { town: 'Abu Dhabi', pc: '', unique: true }],
    iban: () => makeIban('AE', digits(19)),
    text: (b, _s, p, c) => (rnd() < 0.5 ? `PO Box ${b}${int(100, 999)} ${p.town}${c ? ` ${c}` : ''}` : `Office ${b}, ${pick(['Emirates', 'Gold', 'Marina'])} Tower, Sheikh Zayed Road, ${p.town}${c ? `, ${c}` : ''}`),
  },
  {
    code: 'ES', words: ['Spain', 'España'], form: 'S.L.', owner: 'ap-emea@larkspur.example',
    streets: ['Calle Mayor', 'Calle de Alcalá'], places: [{ town: 'Madrid', pc: '28013', unique: true }, { town: 'Barcelona', pc: '08007', unique: true }],
    iban: () => makeIban('ES', digits(20)),
    text: (b, s, p, c) => `${s} ${b}, ${p.pc} ${p.town}${c ? `, ${c}` : ''}`,
  },
  {
    code: 'AU', words: ['Australia'], form: 'Pty Ltd', owner: 'ap-apac@larkspur.example',
    streets: ['Phillip Street', 'Collins Street'], places: [{ town: 'Sydney', pc: '2000', region: 'NSW', unique: false }, { town: 'Melbourne', pc: '3000', region: 'VIC', unique: false }],
    text: (b, s, p, c) => `Level ${int(2, 30)}, ${b} ${s}, ${p.town} ${p.region} ${p.pc}${c ? `, ${c}` : ''}`,
  },
];

const NAMES = ['Alder', 'Birch', 'Cobalt', 'Delta', 'Ember', 'Fjord', 'Granite', 'Harbor', 'Indigo', 'Juniper', 'Kestrel', 'Lumen', 'Meridian', 'Nimbus', 'Orchid', 'Pinnacle', 'Quarry', 'Redwood', 'Saffron', 'Tidewater', 'Umber', 'Vantage', 'Willow', 'Zephyr'];
const TRADES = ['Logistics', 'Components', 'Textiles', 'Foods', 'Analytics', 'Packaging', 'Engineering', 'Chemicals', 'Freight', 'Consulting', 'Supplies', 'Metals'];
const NO_DATA = ['Main street 5', 'Building 7, Industrial Area Phase 2', 'Unit 12, Riverside Business Park', 'Warehouse 3, Near Central Station', 'Plot 44, Sector 9'];

export function generate(n = 240): SourceRow[] {
  const rows: SourceRow[] = [];
  for (let i = 0; i < n; i++) {
    const c = pick(C);
    const p = pick(c.places);
    const street = pick(c.streets);
    const b = String(int(1, 220));
    const bankCountry = rnd() < 0.07 ? pick(['GB', 'DE', 'NL', 'AE'].filter((x) => x !== c.code)) : c.code;
    const ibanDef = C.find((x) => x.code === bankCountry)?.iban;
    let iban = ibanDef ? ibanDef() : '';
    if (iban && rnd() < 0.015) iban = iban.slice(0, -1) + ((Number(iban.slice(-1)) + 1) % 10); // broken checksum
    const row: SourceRow = {
      vendor_id: `V-${String(10001 + i)}`,
      name: `${pick(NAMES)} ${pick(TRADES)} ${c.form}`,
      address_text: '',
      street: '', building: '', postcode: '', town: '', country: '',
      iban,
      bic: `${letters(4)}${bankCountry}${letters(2)}`,
      owner: c.owner,
    };
    const roll = rnd();
    if (roll < 0.28) {
      // Clean, already structured in the ERP.
      Object.assign(row, { street, building: c.code === 'AE' ? '' : b, postcode: p.pc, town: p.town, country: c.code });
    } else if (roll < 0.36) {
      // Split into fields, but the country is a name or legacy code.
      Object.assign(row, { street, building: b, postcode: p.pc, town: p.town, country: pick(c.words) });
    } else if (roll < 0.83) {
      // Free text with a country.
      row.address_text = c.text(b, street, p, pick(c.words));
      if (rnd() < 0.3) row.country = c.code; // ERP country field sometimes filled
    } else if (roll < 0.95) {
      // Free text without a country (sometimes ambiguous).
      row.address_text = c.text(b, street, p, null);
    } else {
      // Not enough information: needs the vendor.
      row.address_text = pick(NO_DATA);
    }
    rows.push(row);
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = Number(process.argv[2] ?? 240);
  const out = process.argv[3] ?? 'data/vendor_master_sample.csv';
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, toCsv(generate(n) as unknown as Record<string, unknown>[]));
  console.log(`Wrote ${n} synthetic vendor records to ${out}`);
}
