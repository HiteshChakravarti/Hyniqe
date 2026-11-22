// Record-level repair logic shared by the agent team (skills/payment-data-ops.ts) and the
// browser version on the Hyniqe Hub website, so both apply exactly the same rules.

import { isCountryCode, lookupCountry } from './countries.ts';
import { bicCountry, ibanCountry, ibanValid } from './iban.ts';
import { parseAddress, validateAddress, type ParseResult, type PostalAddress } from './parse.ts';

export const AUTO_ACCEPT_CONFIDENCE = 0.8;

export type RepairDecision = 'auto' | 'review' | 'needs_data';

/** The address fields of a vendor or beneficiary record, as they arrive from an ERP export. */
export interface AddressFields {
  address_text?: string;
  street?: string;
  building?: string;
  postcode?: string;
  town?: string;
  country?: string;
}

/** The Repair Analyst's decision rule, shared with the accuracy benchmark. */
export function decide(result: ParseResult): RepairDecision {
  if (result.format === 'unresolved') return 'needs_data';
  if (result.issues.some((i) => i.severity === 'review') || result.confidence < AUTO_ACCEPT_CONFIDENCE) return 'review';
  return 'auto';
}

export function sourceText(s: AddressFields): string {
  if (s.address_text) return s.address_text;
  return [s.building && s.street ? `${s.building} ${s.street}` : s.street, [s.postcode, s.town].filter(Boolean).join(' '), s.country]
    .filter(Boolean)
    .join(', ');
}

/** Already-split ERP fields: normalise them rather than re-parse free text. */
export function normaliseFields(s: AddressFields): ParseResult {
  const evidence: string[] = [];
  let conf = 0.97;
  let ctry: string | undefined;
  if (s.country) {
    if (s.country.length === 2 && isCountryCode(s.country)) ctry = s.country.toUpperCase();
    else {
      const c = lookupCountry(s.country, { allowAlpha2: true });
      if (c) {
        ctry = c;
        evidence.push(`Country "${s.country}" normalised to ISO code ${c}`);
      }
    }
  }
  const address: PostalAddress = {
    ...(s.street ? { StrtNm: s.street } : {}),
    ...(s.building ? { BldgNb: s.building } : {}),
    ...(s.postcode ? { PstCd: s.postcode.toUpperCase() } : {}),
    ...(s.town ? { TwnNm: s.town } : {}),
    ...(ctry ? { Ctry: ctry } : {}),
  };
  if (!address.TwnNm || !address.Ctry) {
    // Fields incomplete: fall back to parsing everything we have as text.
    const parsed = parseAddress(sourceText(s), { countryHint: ctry ?? null });
    parsed.evidence.unshift('ERP fields incomplete, re-parsed from combined text');
    return parsed;
  }
  evidence.push('Existing ERP fields mapped to PostalAddress24');
  const issues = validateAddress(address);
  if (issues.some((i) => i.severity === 'review')) conf -= 0.3;
  return { address, format: issues.some((i) => i.severity === 'block') ? 'unresolved' : 'structured', confidence: conf, evidence, issues };
}

/** Structure one record: split ERP fields are normalised, free text is parsed. */
export function structureRecord(s: AddressFields): { result: ParseResult; method: 'field-normalisation' | 'rules-parser' } {
  const viaFields = !!(s.town || s.street);
  return viaFields
    ? { result: normaliseFields(s), method: 'field-normalisation' }
    : { result: parseAddress(s.address_text ?? '', { countryHint: s.country || null }), method: 'rules-parser' };
}

/** The Controls Analyst's checks: bank account, BIC and address must point to consistent countries. */
export function controlReasons(r: { iban?: string | null; bic?: string | null; address?: PostalAddress | null }): string[] {
  const reasons: string[] = [];
  const bank = ibanCountry(r.iban);
  if (r.iban && !ibanValid(r.iban)) reasons.push('IBAN checksum is invalid');
  if (bank && r.address?.Ctry && bank !== r.address.Ctry) reasons.push(`Bank account country ${bank} differs from address country ${r.address.Ctry}`);
  const bicC = bicCountry(r.bic);
  if (bicC && bank && bicC !== bank) reasons.push(`BIC country ${bicC} differs from IBAN country ${bank}`);
  if (bicC && !bank && r.address?.Ctry && bicC !== r.address.Ctry) reasons.push(`Bank (BIC) country ${bicC} differs from address country ${r.address.Ctry}`);
  return reasons;
}
