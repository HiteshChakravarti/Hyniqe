// DORA Register Pre-Check
// EU financial entities submit a yearly Register of Information on their ICT third-party arrangements, and many
// submissions are rejected or questioned for data-quality errors. This checks a working register (one row per
// contractual arrangement, as most firms keep it in a spreadsheet before converting to the official xBRL-CSV format)
// for the errors that most often cause trouble: invalid LEIs/identifiers, bad codes and dates, duplicates, broken
// references, inconsistent provider data, and gaps for arrangements supporting critical or important functions.

import { type Row, pick, parseAmount, parseBool } from "../../shared/table.ts";
import { checkCountry, checkCurrency, checkLei } from "../../shared/ids.ts";
import { normName } from "../../shared/text.ts";

export interface Arrangement {
  line: number; ref: string; entity_lei: string; provider: string; provider_id: string; provider_id_type: string; provider_country: string; parent_ref: string;
  service_type: string; function: string; critical: boolean | null; start: string; end: string; notice_entity: string; notice_provider: string;
  governing_law: string; data_location: string; stores_data: boolean | null; substitutability: string; exit_plan: boolean | null; reintegration: string;
  cost: string; currency: string; intra_group: boolean | null;
}

export function readRegister(rows: Row[]): Arrangement[] {
  return rows.map((r, i) => ({
    line: i + 2,
    ref: pick(r, "arrangement_ref", "contract_ref", "contractual_arrangement_reference", "reference", "contract_id"),
    entity_lei: pick(r, "entity_lei", "financial_entity_lei", "lei_of_entity", "entity_lei_code"),
    provider: pick(r, "provider_name", "ict_provider", "provider", "vendor_name", "supplier"),
    provider_id: pick(r, "provider_id", "provider_identification_code", "provider_lei", "provider_code"),
    provider_id_type: pick(r, "provider_id_type", "type_of_code", "identification_code_type", "id_type").toUpperCase(),
    provider_country: pick(r, "provider_country", "country_of_provider", "headquarters_country", "provider_hq_country").toUpperCase(),
    parent_ref: pick(r, "subcontractor_of", "parent_arrangement", "parent_ref", "rank_parent", "upstream_arrangement"),
    service_type: pick(r, "ict_service_type", "service_type", "type_of_ict_service", "service"),
    function: pick(r, "function_name", "function", "business_function", "function_supported"),
    critical: parseBool(pick(r, "function_critical", "critical_or_important", "critical", "cif", "critical_important")),
    start: pick(r, "start_date", "effective_date", "contract_start"), end: pick(r, "end_date", "termination_date", "contract_end", "expiry_date"),
    notice_entity: pick(r, "notice_period_entity", "notice_period_entity_days", "termination_notice_entity"), notice_provider: pick(r, "notice_period_provider", "notice_period_provider_days", "termination_notice_provider"),
    governing_law: pick(r, "governing_law_country", "governing_law", "law_country").toUpperCase(),
    data_location: pick(r, "data_location_country", "data_storage_country", "location_of_data", "data_country").toUpperCase(),
    stores_data: parseBool(pick(r, "stores_data", "data_storage", "storage_of_data")),
    substitutability: pick(r, "substitutability", "substitutability_assessment"), exit_plan: parseBool(pick(r, "exit_plan", "exit_plan_exists", "exit_strategy")),
    reintegration: pick(r, "reintegration_possible", "reintegration", "possibility_of_reintegration"),
    cost: pick(r, "annual_cost", "annual_expense", "cost", "annual_budget"), currency: pick(r, "currency", "cost_currency").toUpperCase(),
    intra_group: parseBool(pick(r, "intra_group", "intragroup", "is_intra_group")),
  }));
}

export type Sev = "error" | "warning";
export interface Issue { line: number; ref: string; field: string; value: string; rule: string; severity: Sev; message: string }

export const RULE_TITLES: Record<string, string> = {
  MISSING: "Mandatory value missing", INVALID_LEI: "LEI invalid", INVALID_EUID: "EUID malformed", ID_TYPE: "Identifier type doesn't fit the code", INVALID_COUNTRY: "Country not ISO 3166",
  INVALID_CURRENCY: "Currency not ISO 4217", DATE_FORMAT: "Date not in YYYY-MM-DD", DATE_ORDER: "End date before start date", EXPIRED: "Arrangement already ended", DUPLICATE_REF: "Duplicate arrangement reference",
  BROKEN_REFERENCE: "Subcontracting reference points nowhere", PROVIDER_INCONSISTENT: "Same provider recorded inconsistently", CRITICAL_GAP: "Critical/important function: assessment missing",
  NUMBER: "Not a valid number", DATA_LOCATION: "Data stored but location missing",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EUID = /^[A-Z]{2}[A-Z0-9]{1,12}\.[A-Z0-9][A-Z0-9.\-\/ ]{0,40}$/i;

export function precheck(list: Arrangement[], opts: { referenceDate?: string } = {}): Issue[] {
  const out: Issue[] = [];
  const refDate = opts.referenceDate ?? `${new Date().getUTCFullYear() - 1}-12-31`;
  const add = (a: Arrangement, field: string, value: string, rule: string, severity: Sev, message: string) => out.push({ line: a.line, ref: a.ref, field, value, rule, severity, message });
  const refs = new Map<string, number>();
  for (const a of list) {
    for (const [f, v] of [["arrangement_ref", a.ref], ["entity_lei", a.entity_lei], ["provider_name", a.provider], ["provider_id", a.provider_id], ["ict_service_type", a.service_type], ["function_name", a.function], ["start_date", a.start]] as const) if (!v) add(a, f, "", "MISSING", "error", `${f} is required.`);
    if (a.entity_lei && !checkLei(a.entity_lei).ok) add(a, "entity_lei", a.entity_lei, "INVALID_LEI", "error", checkLei(a.entity_lei).reason ?? "");
    if (a.provider_id) {
      const looksLei = /^[A-Z0-9]{18}\d{2}$/i.test(a.provider_id);
      const type = a.provider_id_type || (looksLei ? "LEI" : "");
      if (type === "LEI" && !checkLei(a.provider_id).ok) add(a, "provider_id", a.provider_id, "INVALID_LEI", "error", checkLei(a.provider_id).reason ?? "");
      if (type === "EUID" && !EUID.test(a.provider_id)) add(a, "provider_id", a.provider_id, "INVALID_EUID", "error", "EUID should look like country code + register code + '.' + registration number.");
      if (type === "EUID" && looksLei && checkLei(a.provider_id).ok) add(a, "provider_id_type", type, "ID_TYPE", "warning", "Code looks like a valid LEI but is typed as EUID. LEI is preferred where one exists.");
      if (!type) add(a, "provider_id_type", "", "MISSING", "error", "Say whether the provider code is an LEI or an EUID (or another permitted code).");
    }
    for (const [f, v] of [["provider_country", a.provider_country], ["governing_law_country", a.governing_law], ["data_location_country", a.data_location]] as const) if (v && !checkCountry(v).ok) add(a, f, v, "INVALID_COUNTRY", "error", checkCountry(v).reason ?? "");
    if (a.currency && !checkCurrency(a.currency).ok) add(a, "currency", a.currency, "INVALID_CURRENCY", "error", checkCurrency(a.currency).reason ?? "");
    if (a.cost && !a.currency) add(a, "currency", "", "MISSING", "error", "Cost given without a currency.");
    if (a.cost && (parseAmount(a.cost) === null || (parseAmount(a.cost) as number) < 0)) add(a, "annual_cost", a.cost, "NUMBER", "error", "Annual cost must be a non-negative number.");
    for (const [f, v] of [["notice_period_entity", a.notice_entity], ["notice_period_provider", a.notice_provider]] as const) if (v && !/^\d+$/.test(v.trim())) add(a, f, v, "NUMBER", "error", "Notice period must be a whole number of days.");
    for (const [f, v] of [["start_date", a.start], ["end_date", a.end]] as const) if (v && !ISO_DATE.test(v)) add(a, f, v, "DATE_FORMAT", "error", "Use YYYY-MM-DD.");
    if (ISO_DATE.test(a.start) && ISO_DATE.test(a.end) && a.end < a.start) add(a, "end_date", a.end, "DATE_ORDER", "error", `Ends before it starts (${a.start}).`);
    if (ISO_DATE.test(a.end) && a.end < refDate.slice(0, 4) + "-01-01") add(a, "end_date", a.end, "EXPIRED", "warning", `Ended before the reporting year (reference date ${refDate}). Check whether it belongs in the register.`);
    if (a.stores_data && !a.data_location) add(a, "data_location_country", "", "DATA_LOCATION", "error", "Provider stores data, but the storage location is missing.");
    if (a.critical) {
      const gaps = [!a.substitutability && "substitutability assessment", a.exit_plan === null && "whether an exit plan exists", !a.reintegration && "reintegration possibility", !a.notice_entity && "notice period", !a.data_location && "data location", !a.governing_law && "governing law"].filter(Boolean);
      if (a.exit_plan === false) add(a, "exit_plan", "no", "CRITICAL_GAP", "warning", "Supports a critical or important function with no exit plan. Expect supervisory questions.");
      if (gaps.length) add(a, "critical", "yes", "CRITICAL_GAP", "error", `Supports a critical or important function but is missing: ${gaps.join(", ")}.`);
    }
    if (a.ref) { if (refs.has(a.ref)) add(a, "arrangement_ref", a.ref, "DUPLICATE_REF", "error", `Same reference as line ${refs.get(a.ref)}.`); else refs.set(a.ref, a.line); }
  }
  for (const a of list) if (a.parent_ref && !refs.has(a.parent_ref)) add(a, "subcontractor_of", a.parent_ref, "BROKEN_REFERENCE", "error", "Points to an arrangement reference that isn't in the register.");
  // provider consistency: same id with different names/countries, same name with different ids
  const byId = new Map<string, Arrangement[]>(), byName = new Map<string, Arrangement[]>();
  for (const a of list) { if (a.provider_id) byId.set(a.provider_id.toUpperCase(), [...(byId.get(a.provider_id.toUpperCase()) ?? []), a]); if (a.provider) byName.set(normName(a.provider), [...(byName.get(normName(a.provider)) ?? []), a]); }
  for (const [id, l] of byId) {
    const names = new Set(l.map((a) => normName(a.provider))), countries = new Set(l.map((a) => a.provider_country).filter(Boolean));
    if (names.size > 1 || countries.size > 1) for (const a of l.slice(1)) add(a, "provider_id", id, "PROVIDER_INCONSISTENT", "warning", `Provider ${id} appears with ${names.size > 1 ? "different names" : ""}${names.size > 1 && countries.size > 1 ? " and " : ""}${countries.size > 1 ? "different countries" : ""}.`);
  }
  for (const [n, l] of byName) {
    const ids = new Set(l.map((a) => a.provider_id.toUpperCase()).filter(Boolean));
    if (ids.size > 1) for (const a of l.slice(1)) add(a, "provider_name", a.provider, "PROVIDER_INCONSISTENT", "warning", `"${n}" has ${ids.size} different identifiers: check whether these are different legal entities.`);
  }
  return out;
}
