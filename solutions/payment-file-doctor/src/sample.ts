// Generated payment files with labelled defects, for the benchmark, tests and the website sample.
// All companies, people and accounts are fictional.

import { makeIban } from '../../../engine/src/address/iban.ts';
import { rng } from '../../ssi-checker/src/sample.ts';
import { buildPain001, type Party, type Transfer } from './build.ts';

const PLACES = [
  { street: 'Friedrichstrasse', building: '112', postcode: '10117', town: 'Berlin', country: 'DE', len: 18 },
  { street: 'Calle de Alcala', building: '36', postcode: '28014', town: 'Madrid', country: 'ES', len: 20 },
  { street: 'Rue de Rivoli', building: '84', postcode: '75004', town: 'Paris', country: 'FR', len: 23 },
  { street: 'Damrak', building: '70', postcode: '1012 LM', town: 'Amsterdam', country: 'NL', len: 14 },
  { street: 'Via Torino', building: '21', postcode: '20123', town: 'Milan', country: 'IT', len: 23 },
  { street: 'Mariahilfer Strasse', building: '45', postcode: '1060', town: 'Vienna', country: 'AT', len: 16 },
  { street: 'Rua Augusta', building: '150', postcode: '1100-053', town: 'Lisbon', country: 'PT', len: 21 },
  { street: 'Avenue Louise', building: '231', postcode: '1050', town: 'Brussels', country: 'BE', len: 12 },
];
const NAMES = ['Kestrel Textiles', 'Borealis Logistics', 'Cobalt Facilities', 'Delta Office Supplies', 'Evergreen Packaging', 'Falcon IT Services', 'Granite Works', 'Harbor Catering', 'Ion Electrical', 'Jasper Print'];
const COUNTRY: Record<string, string> = { DE: 'Germany', ES: 'Spain', FR: 'France', NL: 'Netherlands', IT: 'Italy', AT: 'Austria', PT: 'Portugal', BE: 'Belgium' };
const SUFFIX: Record<string, string> = { DE: 'GmbH', ES: 'S.L.', FR: 'SAS', NL: 'B.V.', IT: 'S.r.l.', AT: 'GmbH', PT: 'Lda', BE: 'SA' };

export type Defect = 'ONE_LINE_ADDRESS' | 'CHARACTERS' | 'IBAN_SPACES' | 'BAD_IBAN' | 'NAME_TOO_LONG';
export const DEFECTS: Defect[] = ['ONE_LINE_ADDRESS', 'CHARACTERS', 'IBAN_SPACES', 'BAD_IBAN', 'NAME_TOO_LONG'];
/** The finding code the doctor should raise for each injected defect. */
export const EXPECTED: Record<Defect, string> = { ONE_LINE_ADDRESS: 'ADDRESS', CHARACTERS: 'CHARACTERS', IBAN_SPACES: 'IBAN_FORMAT', BAD_IBAN: 'IBAN', NAME_TOO_LONG: 'TOO_LONG' };
export const FIXABLE: Record<Defect, boolean> = { ONE_LINE_ADDRESS: true, CHARACTERS: true, IBAN_SPACES: true, BAD_IBAN: false, NAME_TOO_LONG: true };

export interface LabelledFile {
  xml: string;
  version: '03' | '09';
  headerWrong: boolean;
  /** endToEndId -> injected defect */
  labels: Map<string, Defect>;
}

export function generatePaymentFile(opts: { seed?: number; count?: number; version?: '03' | '09'; defectRate?: number; headerWrong?: boolean; executionDate?: string } = {}): LabelledFile {
  const r = rng(opts.seed ?? 5);
  const int = (n: number): number => Math.floor(r() * n);
  const digits = (n: number): string => Array.from({ length: n }, () => String(int(10))).join('');
  const version = opts.version ?? '03';
  const count = opts.count ?? 24;
  const labels = new Map<string, Defect>();
  const transfers: Transfer[] = [];
  for (let i = 0; i < count; i++) {
    const p = PLACES[int(PLACES.length)];
    const name = `${NAMES[int(NAMES.length)]} ${SUFFIX[p.country]}`;
    const payee: Party = { name, iban: makeIban(p.country, digits(p.len)), address: { street: p.street, building: p.building, postcode: p.postcode, town: p.town, country: p.country } };
    const t: Transfer = { endToEndId: `E2E-${String(i + 1).padStart(4, '0')}`, amount: (100 + int(2_000_000) / 100).toFixed(2), payee, reference: `Invoice ${20000 + int(9999)}` };
    if (r() < (opts.defectRate ?? 0.45)) {
      const d = DEFECTS[int(DEFECTS.length)];
      labels.set(t.endToEndId, d);
      if (d === 'ONE_LINE_ADDRESS') {
        payee.addressLines = [`${p.street} ${p.building}, ${p.postcode} ${p.town}, ${COUNTRY[p.country]}`];
        payee.address = undefined;
      }
      if (d === 'CHARACTERS') payee.name = name.replace(/a/, 'á').replace(' ', ' & ');
      if (d === 'IBAN_SPACES') payee.iban = payee.iban.replace(/(.{4})/g, '$1 ').trim();
      if (d === 'BAD_IBAN') payee.iban = payee.iban.slice(0, -1) + String((Number(payee.iban.slice(-1)) + 1) % 10);
      if (d === 'NAME_TOO_LONG') payee.name = `${name} Holding Company for European Distribution and Logistics Services`;
    }
    transfers.push(t);
  }
  const headerWrong = opts.headerWrong ?? true;
  const xml = buildPain001({
    version,
    messageId: `MSG-${digits(8)}`,
    createdAt: '2026-11-20T09:15:00',
    executionDate: opts.executionDate ?? '2026-11-27',
    payer: { name: 'Larkspur Industrial Group Ltd', iban: 'IE29AIBK93115212345678', bic: 'AIBKIE2D', address: { street: 'Grand Canal Street', building: '10', postcode: 'D02 X123', town: 'Dublin', country: 'IE' } },
    batchId: 'PMT-NOV-01',
    transfers,
    headerCount: headerWrong ? String(count + 1) : undefined,
    headerSum: headerWrong ? '1000.00' : undefined,
  });
  return { xml, version, headerWrong, labels };
}
