// Validation rules the Rule Engineer agent proposes. Once a human approves a
// rule it becomes active and is enforced at the point of entry (vendor
// onboarding), so the same defect is prevented instead of repaired again.

import type { Engine } from './engine.ts';
import { isCountryCode, lookupCountry } from './address/countries.ts';
import { postcodeValid } from './address/postcodes.ts';
import { findCityIn } from './address/gazetteer.ts';
import { ibanCountry } from './address/iban.ts';
import type { SourceRow } from './records.ts';

export type RuleCheck =
  | { type: 'required'; fields: (keyof SourceRow)[] }
  | { type: 'iso_country'; field: 'country' }
  | { type: 'postcode_format' }
  | { type: 'bank_country_match' }
  | { type: 'unambiguous_town' };

export interface RuleRow {
  id: string;
  code: string;
  title: string;
  rationale: string;
  definition: string;
  evidence_count: number;
  status: 'proposed' | 'active' | 'rejected';
  proposed_by: string;
  created_at: string;
}

export interface Violation {
  rule: string;
  title: string;
  message: string;
}

export function evaluateRule(check: RuleCheck, r: SourceRow): string | null {
  switch (check.type) {
    case 'required': {
      const missing = check.fields.filter((f) => !String(r[f] ?? '').trim());
      return missing.length ? `Missing required field(s): ${missing.join(', ')}` : null;
    }
    case 'iso_country':
      if (!r.country) return null;
      return isCountryCode(r.country) && r.country.length === 2
        ? null
        : `Country "${r.country}" must be an ISO 3166 alpha-2 code${lookupCountry(r.country, { allowAlpha2: true }) ? ` (did you mean ${lookupCountry(r.country, { allowAlpha2: true })}?)` : ''}`;
    case 'postcode_format':
      if (!r.postcode || !r.country || !isCountryCode(r.country)) return null;
      return postcodeValid(r.postcode, r.country.toUpperCase()) === false ? `Postcode "${r.postcode}" is not a valid ${r.country.toUpperCase()} format` : null;
    case 'bank_country_match': {
      const bank = ibanCountry(r.iban);
      if (!bank || !r.country || !isCountryCode(r.country)) return null;
      return bank !== r.country.toUpperCase() ? `Bank account country ${bank} differs from address country ${r.country.toUpperCase()}; a justification is required` : null;
    }
    case 'unambiguous_town': {
      if (!r.town) return null;
      const hit = findCityIn(r.town);
      return hit && (hit.city.alsoIn?.length || hit.city.needsRegion) && !r.country
        ? `Town "${r.town}" is ambiguous without a country`
        : null;
    }
  }
}

export function activeRules(engine: Engine): RuleRow[] {
  return engine.db.prepare("SELECT * FROM rules WHERE company_id = ? AND status = 'active' ORDER BY code").all(engine.companyId) as unknown as RuleRow[];
}

export function allRules(engine: Engine): RuleRow[] {
  return engine.db.prepare('SELECT * FROM rules WHERE company_id = ? ORDER BY code').all(engine.companyId) as unknown as RuleRow[];
}

/** The onboarding gate: check a new vendor record against every active rule. */
export function validateAtSource(engine: Engine, r: SourceRow): { accepted: boolean; violations: Violation[] } {
  const violations: Violation[] = [];
  for (const rule of activeRules(engine)) {
    const msg = evaluateRule(JSON.parse(rule.definition) as RuleCheck, r);
    if (msg) violations.push({ rule: rule.code, title: rule.title, message: msg });
  }
  return { accepted: violations.length === 0, violations };
}
