// Payment Data Repair as a stand-alone function: structures vendor and beneficiary addresses
// for ISO 20022 and checks bank details, using the same rules as the Hyniqe agent team.

import { pick, type Row } from '../../shared/csv.ts';
import { controlReasons, decide, sourceText, structureRecord, type AddressFields, type RepairDecision } from '../../../engine/src/address/repair.ts';
import type { PostalAddress } from '../../../engine/src/address/parse.ts';

export interface RepairedRecord {
  id: string;
  name: string;
  original: string;
  decision: RepairDecision | 'compliant';
  confidence: number;
  address: PostalAddress;
  issues: string[];
  controls: string[];
  evidence: string[];
}

export interface RepairSummary {
  records: RepairedRecord[];
  total: number;
  compliantBefore: number;
  autoRepaired: number;
  review: number;
  needsData: number;
  controlFlags: number;
}

const FIELD_ALIASES: Record<keyof AddressFields | 'id' | 'name' | 'iban' | 'bic', string[]> = {
  id: ['vendor_id', 'id', 'supplier_id', 'beneficiary_id', 'account_id'],
  name: ['name', 'vendor_name', 'supplier_name', 'beneficiary_name', 'payee'],
  address_text: ['address_text', 'address', 'full_address', 'address_line', 'beneficiary_address'],
  street: ['street', 'street_name', 'address_line_1', 'strtnm'],
  building: ['building', 'building_number', 'house_number', 'bldgnb'],
  postcode: ['postcode', 'post_code', 'postal_code', 'zip', 'zip_code', 'pstcd'],
  town: ['town', 'city', 'twnnm'],
  country: ['country', 'country_code', 'ctry'],
  iban: ['iban', 'account', 'bank_account'],
  bic: ['bic', 'swift', 'bic_code', 'swift_code'],
};

/** A record that already arrives with street, town and country split out and no issues counts as compliant. */
export function repairRecords(rows: Row[]): RepairSummary {
  const records = rows.map((row, i): RepairedRecord => {
    const get = (k: keyof typeof FIELD_ALIASES): string => pick(row, ...FIELD_ALIASES[k]);
    const fields: AddressFields = { address_text: get('address_text'), street: get('street'), building: get('building'), postcode: get('postcode'), town: get('town'), country: get('country') };
    const { result } = structureRecord(fields);
    const controls = controlReasons({ iban: get('iban'), bic: get('bic'), address: result.address });
    const verdict = decide(result);
    const alreadyStructured = !!(fields.street && fields.town && fields.country) && verdict === 'auto';
    return {
      id: get('id') || `row-${i + 2}`,
      name: get('name'),
      original: sourceText(fields),
      decision: alreadyStructured && !controls.length ? 'compliant' : verdict === 'auto' && controls.length ? 'review' : verdict,
      confidence: result.confidence,
      address: result.address,
      issues: result.issues.map((x) => x.message),
      controls,
      evidence: result.evidence,
    };
  });
  return {
    records,
    total: records.length,
    compliantBefore: records.filter((r) => r.decision === 'compliant').length,
    autoRepaired: records.filter((r) => r.decision === 'auto').length,
    review: records.filter((r) => r.decision === 'review').length,
    needsData: records.filter((r) => r.decision === 'needs_data').length,
    controlFlags: records.filter((r) => r.controls.length).length,
  };
}

export function addressLine(a: PostalAddress): string {
  return [[a.BldgNb, a.StrtNm].filter(Boolean).join(' '), [a.PstCd, a.TwnNm].filter(Boolean).join(' '), a.CtrySubDvsn, a.Ctry].filter(Boolean).join(', ');
}
