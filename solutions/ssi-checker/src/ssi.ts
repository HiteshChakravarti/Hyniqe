// SSI Checker: finds the Standing Settlement Instruction defects that cause unmatched
// instructions and settlement fails, and compares your stored SSIs with a golden source.
// Deterministic and explainable: every finding carries a code, a reason and a suggested fix.

import { isCountryCode, lookupCountry } from '../../../engine/src/address/countries.ts';
import { ibanValid } from '../../../engine/src/address/iban.ts';
import { pick, type Row } from '../../shared/csv.ts';
import { CSDS, CSD_BY_BIC, ICSD_BICS, type Csd } from './csd.ts';

export type Severity = 'error' | 'review' | 'info';

export type FindingCode =
  | 'MISSING_FIELD'
  | 'BIC_FORMAT'
  | 'BIC_COUNTRY'
  | 'LEI_MISSING'
  | 'LEI_INVALID'
  | 'MARKET_UNKNOWN'
  | 'PSET_NOT_CSD'
  | 'PSET_UNLISTED'
  | 'PSET_MARKET_MISMATCH'
  | 'CASH_IBAN_INVALID'
  | 'CURRENCY_FORMAT'
  | 'NEVER_VERIFIED'
  | 'STALE'
  | 'UNAUTHENTICATED_SOURCE'
  | 'CONFLICT'
  | 'DUPLICATE'
  | 'FUTURE_EFFECTIVE'
  | 'MISMATCH_PSET'
  | 'MISMATCH_AGENT'
  | 'MISMATCH_SAFEKEEPING'
  | 'MISMATCH_CASH_AGENT'
  | 'MISMATCH_CASH_ACCOUNT'
  | 'MISSING_IN_GOLDEN';

export interface Ssi {
  id: string;
  counterparty: string;
  lei: string;
  assetClass: string;
  market: string;
  currency: string;
  pset: string;
  agentBic: string;
  safekeeping: string;
  cashAgentBic: string;
  cashAccount: string;
  lastVerified: string;
  effectiveDate: string;
  source: string;
}

export interface Finding {
  ssiId: string;
  counterparty: string;
  market: string;
  field: string;
  code: FindingCode;
  severity: Severity;
  message: string;
  fix: string;
}

export interface CheckOptions {
  /** Reference date for staleness (defaults to today). */
  asOf?: Date;
  /** SSIs not verified within this many days are flagged for review. */
  maxAgeDays?: number;
}

export interface CheckResult {
  ssis: Ssi[];
  findings: Finding[];
  /** SSI ids with no error and no review finding. */
  ready: Set<string>;
  byCode: Record<string, number>;
}

/** Column names accepted for each field (case and punctuation insensitive). */
export const COLUMNS: Record<keyof Ssi, string[]> = {
  id: ['ssi_id', 'id', 'reference', 'ssi_ref'],
  counterparty: ['counterparty', 'counterparty_name', 'cpty', 'client', 'broker'],
  lei: ['counterparty_lei', 'lei'],
  assetClass: ['asset_class', 'asset', 'instrument_type', 'security_type'],
  market: ['market', 'country', 'market_country', 'place_of_trade_country'],
  currency: ['currency', 'settlement_currency', 'ccy'],
  pset: ['pset', 'pset_bic', 'place_of_settlement', 'place_of_settlement_bic', 'csd_bic'],
  agentBic: ['agent_bic', 'receiving_agent_bic', 'delivering_agent_bic', 'custodian_bic', 'reag', 'deag', 'settlement_agent_bic'],
  safekeeping: ['safekeeping_account', 'safe_account', 'securities_account', 'safekeeping'],
  cashAgentBic: ['cash_agent_bic', 'cash_correspondent_bic', 'cash_bic'],
  cashAccount: ['cash_account', 'cash_account_number', 'iban', 'cash_iban'],
  lastVerified: ['last_verified', 'verified_on', 'last_validated', 'last_confirmed'],
  effectiveDate: ['effective_date', 'effective_from', 'valid_from'],
  source: ['source', 'channel', 'received_via'],
};

const clean = (s: string): string => s.trim().replace(/\s+/g, ' ');
const compact = (s: string): string => s.replace(/[\s\-./]/g, '').toUpperCase();

export function toSsi(row: Row, index: number): Ssi {
  const get = (k: keyof Ssi): string => clean(pick(row, ...COLUMNS[k]));
  let market = get('market').toUpperCase();
  if (market && !isCountryCode(market)) market = lookupCountry(get('market'), { allowAlpha2: true }) ?? market;
  return {
    id: get('id') || `row-${index + 2}`,
    counterparty: get('counterparty'),
    lei: compact(get('lei')),
    assetClass: (get('assetClass') || 'EQU').toUpperCase(),
    market,
    currency: get('currency').toUpperCase(),
    pset: compact(get('pset')),
    agentBic: compact(get('agentBic')),
    safekeeping: compact(get('safekeeping')),
    cashAgentBic: compact(get('cashAgentBic')),
    cashAccount: compact(get('cashAccount')),
    lastVerified: get('lastVerified'),
    effectiveDate: get('effectiveDate'),
    source: get('source').toLowerCase(),
  };
}

const BIC_RE = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

/** BIC8 and BIC11 with branch XXX are the same institution. */
export function bic11(bic: string): string {
  const b = compact(bic);
  return b.length === 8 ? `${b}XXX` : b;
}

export function bicProblem(bic: string): 'format' | 'country' | null {
  const b = compact(bic);
  if (!BIC_RE.test(b)) return 'format';
  if (!isCountryCode(b.slice(4, 6))) return 'country';
  return null;
}

/** ISO 17442: 20 characters, last two are ISO 7064 MOD 97-10 check digits. */
export function leiValid(lei: string): boolean {
  const s = compact(lei);
  if (!/^[A-Z0-9]{18}[0-9]{2}$/.test(s)) return false;
  let rem = 0;
  for (const ch of s) {
    const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}

const UNAUTHENTICATED = /\b(e-?mail|pdf|fax|phone|telephone|spreadsheet|excel|manual|letter|chat)\b/;
const FIXED_INCOME = /^(FI|FIX|FIXED|BOND|BONDS|DEBT|GOVT|CORP|FIXED_INCOME|FIXED INCOME)$/;

function parseDate(s: string): Date | null {
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  const dmy = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(s);
  if (dmy) return new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]));
  return null;
}

/** The key two SSIs must share to describe the same settlement route. */
export function ssiKey(s: Ssi): string {
  const who = s.lei || s.counterparty.toLowerCase().replace(/[^a-z0-9]/g, '');
  return [who, s.market, s.assetClass, s.currency].join('|');
}

export function checkSsis(rows: Row[], opts: CheckOptions = {}): CheckResult {
  const asOf = opts.asOf ?? new Date();
  const maxAge = opts.maxAgeDays ?? 365;
  const ssis = rows.map(toSsi);
  const findings: Finding[] = [];
  const add = (s: Ssi, field: string, code: FindingCode, severity: Severity, message: string, fix: string): void => {
    findings.push({ ssiId: s.id, counterparty: s.counterparty, market: s.market, field, code, severity, message, fix });
  };

  for (const s of ssis) {
    // Required data: without these the instruction cannot be built or matched.
    const required: [keyof Ssi, string][] = [
      ['counterparty', 'Counterparty'],
      ['market', 'Market'],
      ['pset', 'Place of settlement (PSET)'],
      ['agentBic', 'Settlement agent BIC'],
      ['safekeeping', 'Safekeeping account'],
    ];
    for (const [k, label] of required) {
      if (!s[k]) add(s, k, 'MISSING_FIELD', 'error', `${label} is missing.`, `Obtain the ${label.toLowerCase()} from the counterparty's golden-source SSI.`);
    }
    if (!s.currency) add(s, 'currency', 'MISSING_FIELD', 'error', 'Settlement currency is missing.', 'Add the ISO 4217 settlement currency.');
    else if (!/^[A-Z]{3}$/.test(s.currency)) add(s, 'currency', 'CURRENCY_FORMAT', 'error', `Currency "${s.currency}" is not a 3-letter ISO 4217 code.`, 'Use the ISO 4217 code, e.g. EUR.');
    if (!s.cashAgentBic && !s.cashAccount) add(s, 'cashAccount', 'MISSING_FIELD', 'review', 'No cash leg details (cash agent BIC or cash account).', 'Confirm the cash correspondent for delivery-versus-payment settlement.');

    for (const [k, label] of [['pset', 'PSET'], ['agentBic', 'Settlement agent'], ['cashAgentBic', 'Cash agent']] as [keyof Ssi, string][]) {
      if (!s[k]) continue;
      const p = bicProblem(s[k]);
      if (p === 'format') add(s, k, 'BIC_FORMAT', 'error', `${label} BIC "${s[k]}" is not a valid 8 or 11 character BIC.`, 'Correct the BIC; check for O/0 and I/1 swaps or a truncated branch code.');
      else if (p === 'country') add(s, k, 'BIC_COUNTRY', 'error', `${label} BIC "${s[k]}" has an invalid country code "${s[k].slice(4, 6)}".`, 'Correct the BIC country code (characters 5-6).');
    }

    if (!s.lei) add(s, 'lei', 'LEI_MISSING', 'review', 'Counterparty LEI is missing.', 'Add the 20-character LEI; industry SSI templates key counterparties by LEI.');
    else if (!leiValid(s.lei)) add(s, 'lei', 'LEI_INVALID', 'error', `LEI "${s.lei}" fails the ISO 17442 check digits.`, 'Re-key the LEI from GLEIF.');

    if (s.market && !isCountryCode(s.market)) add(s, 'market', 'MARKET_UNKNOWN', 'error', `Market "${s.market}" is not a recognised country.`, 'Use the ISO 3166 country code of the market.');

    if (s.pset && !bicProblem(s.pset)) {
      const csd: Csd | undefined = CSD_BY_BIC[bic11(s.pset)];
      const psetCountry = s.pset.slice(4, 6);
      if (!csd) {
        const severity: Severity = s.market && CSD_MARKETS.has(s.market) ? 'error' : 'review';
        if (severity === 'error')
          add(s, 'pset', 'PSET_NOT_CSD', 'error', `PSET "${s.pset}" is not a CSD for ${s.market}. The PSET must be the central securities depository, not an agent or custodian.`, `Use the CSD BIC, e.g. ${CSD_BY_MARKET[s.market]?.bic ?? 'the local CSD'}${CSD_BY_MARKET[s.market] ? ` (${CSD_BY_MARKET[s.market].name})` : ''} or an ICSD.`);
        else add(s, 'pset', 'PSET_UNLISTED', 'review', `PSET "${s.pset}" is not in the reference CSD table for ${s.market || 'this market'}.`, 'Confirm the PSET against the market\'s CSD list.');
      } else if (!ICSD_BICS.has(csd.bic) && s.market && csd.country !== s.market) {
        const fi = FIXED_INCOME.test(s.assetClass);
        add(
          s,
          'pset',
          'PSET_MARKET_MISMATCH',
          fi ? 'review' : 'error',
          `PSET ${csd.name} (${psetCountry}) does not match the ${s.market} market.`,
          `Check the market or use ${CSD_BY_MARKET[s.market]?.name ?? 'the local CSD'}${fi ? '; cross-border fixed income may legitimately settle elsewhere' : ''}.`,
        );
      }
    }

    if (s.cashAccount && /^[A-Z]{2}\d{2}/.test(s.cashAccount) && s.cashAccount.length >= 15 && !ibanValid(s.cashAccount)) {
      add(s, 'cashAccount', 'CASH_IBAN_INVALID', 'error', `Cash account "${s.cashAccount}" looks like an IBAN but fails the check digits.`, 'Re-key the IBAN from the counterparty\'s confirmed instruction.');
    }

    const verified = parseDate(s.lastVerified);
    if (!verified) add(s, 'lastVerified', 'NEVER_VERIFIED', 'review', 'No record of when this SSI was last verified.', 'Verify with the counterparty and record the date.');
    else {
      const age = Math.floor((asOf.getTime() - verified.getTime()) / 86_400_000);
      if (age > maxAge) add(s, 'lastVerified', 'STALE', 'review', `Last verified ${age} days ago (limit ${maxAge}).`, 'Re-confirm with the counterparty before T+1 go-live.');
    }
    const eff = parseDate(s.effectiveDate);
    if (eff && eff.getTime() > asOf.getTime()) add(s, 'effectiveDate', 'FUTURE_EFFECTIVE', 'info', `Becomes effective on ${s.effectiveDate}.`, 'Make sure the current instruction stays active until then.');

    if (s.source && UNAUTHENTICATED.test(s.source)) {
      add(s, 'source', 'UNAUTHENTICATED_SOURCE', 'review', `Received via "${s.source}", an unauthenticated channel and a common route for fraud and keying errors.`, 'Confirm by call-back to a known contact, or move the counterparty to an authenticated electronic SSI platform.');
    }
  }

  // Conflicts: two SSIs for the same route with different details make the instruction ambiguous.
  const groups = new Map<string, Ssi[]>();
  for (const s of ssis) {
    if (!s.market || (!s.lei && !s.counterparty)) continue;
    const k = ssiKey(s);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const sig = (s: Ssi): string => [bic11(s.pset), bic11(s.agentBic), s.safekeeping, bic11(s.cashAgentBic), s.cashAccount].join('|');
    const distinct = new Set(group.map(sig));
    for (const s of group.slice(1)) {
      if (distinct.size > 1) {
        add(s, 'route', 'CONFLICT', 'error', `Conflicts with ${group[0].id}: same counterparty, market, asset class and currency but different settlement details.`, 'Keep one active SSI per route; retire the other with an end date.');
      } else {
        add(s, 'route', 'DUPLICATE', 'info', `Duplicate of ${group[0].id}.`, 'Remove the duplicate record.');
      }
    }
  }

  const blocked = new Set(findings.filter((f) => f.severity !== 'info').map((f) => f.ssiId));
  const ready = new Set(ssis.filter((s) => !blocked.has(s.id)).map((s) => s.id));
  const byCode: Record<string, number> = {};
  for (const f of findings) byCode[f.code] = (byCode[f.code] ?? 0) + 1;
  return { ssis, findings, ready, byCode };
}

export interface CompareResult {
  compared: number;
  matched: number;
  findings: Finding[];
}

/**
 * Compare your stored SSIs with a golden source (the counterparty's published SSIs or an
 * industry SSI database export). Any difference in PSET, agent or account will cause
 * an unmatched instruction at the CSD.
 */
export function compareSsis(ourRows: Row[], goldenRows: Row[]): CompareResult {
  const ours = ourRows.map(toSsi);
  const golden = new Map<string, Ssi>();
  goldenRows.map(toSsi).forEach((g) => golden.set(ssiKey(g), g));
  const findings: Finding[] = [];
  let compared = 0;
  let matched = 0;
  for (const s of ours) {
    const g = golden.get(ssiKey(s));
    const add = (field: string, code: FindingCode, severity: Severity, message: string, fix: string): void => {
      findings.push({ ssiId: s.id, counterparty: s.counterparty, market: s.market, field, code, severity, message, fix });
    };
    if (!g) {
      add('route', 'MISSING_IN_GOLDEN', 'review', 'No matching SSI in the golden source for this counterparty, market, asset class and currency.', 'Ask the counterparty to publish or confirm this SSI.');
      continue;
    }
    compared++;
    let ok = true;
    const cmp = (field: keyof Ssi, code: FindingCode, label: string, norm: (v: string) => string): void => {
      if (!s[field] && !g[field]) return;
      if (norm(s[field]) !== norm(g[field])) {
        ok = false;
        add(field, code, 'error', `${label} differs: yours "${s[field] || '(blank)'}", golden source "${g[field] || '(blank)'}".`, `Update to the golden-source ${label.toLowerCase()} (${g[field] || 'blank'}) after confirming with the counterparty.`);
      }
    };
    cmp('pset', 'MISMATCH_PSET', 'PSET', bic11);
    cmp('agentBic', 'MISMATCH_AGENT', 'Settlement agent BIC', bic11);
    cmp('safekeeping', 'MISMATCH_SAFEKEEPING', 'Safekeeping account', (v) => v);
    cmp('cashAgentBic', 'MISMATCH_CASH_AGENT', 'Cash agent BIC', bic11);
    cmp('cashAccount', 'MISMATCH_CASH_ACCOUNT', 'Cash account', (v) => v);
    if (ok) matched++;
  }
  return { compared, matched, findings };
}

// Lookups built from the CSD table.
export const CSD_BY_MARKET: Record<string, Csd> = {};
for (const c of CSDS) if (!ICSD_BICS.has(c.bic) && !CSD_BY_MARKET[c.country]) CSD_BY_MARKET[c.country] = c;
const CSD_MARKETS = new Set(Object.keys(CSD_BY_MARKET));

/** Days until the EU, UK and Swiss move to T+1 settlement on 11 October 2027. */
export function daysToT1(asOf: Date = new Date()): number {
  return Math.ceil((Date.UTC(2027, 9, 11) - asOf.getTime()) / 86_400_000);
}
