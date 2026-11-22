// Synthetic SSI data with labelled defects, used by the benchmark, the tests and the website's
// "try with sample data" button. Every counterparty, BIC and account here is fictional.

import { makeIban } from '../../../engine/src/address/iban.ts';
import type { Row } from '../../shared/csv.ts';
import { CSDS, ICSD_BICS } from './csd.ts';
import type { FindingCode } from './ssi.ts';

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MARKETS: { market: string; currency: string; iban: string }[] = [
  { market: 'DE', currency: 'EUR', iban: 'DE' },
  { market: 'FR', currency: 'EUR', iban: 'FR' },
  { market: 'NL', currency: 'EUR', iban: 'NL' },
  { market: 'BE', currency: 'EUR', iban: 'BE' },
  { market: 'IT', currency: 'EUR', iban: 'IT' },
  { market: 'ES', currency: 'EUR', iban: 'ES' },
  { market: 'PT', currency: 'EUR', iban: 'PT' },
  { market: 'AT', currency: 'EUR', iban: 'AT' },
  { market: 'FI', currency: 'EUR', iban: 'FI' },
  { market: 'GB', currency: 'GBP', iban: 'GB' },
  { market: 'CH', currency: 'CHF', iban: 'CH' },
  { market: 'DK', currency: 'DKK', iban: 'DK' },
  { market: 'SE', currency: 'SEK', iban: 'SE' },
  { market: 'PL', currency: 'PLN', iban: 'PL' },
];

const BBAN_LEN: Record<string, number> = { DE: 18, FR: 23, NL: 14, BE: 12, IT: 23, ES: 20, PT: 21, AT: 16, FI: 14, GB: 18, CH: 17, DK: 14, SE: 20, PL: 24 };

const NAMES = [
  'Aldgate Capital Markets', 'Brightwater Securities', 'Calder Asset Management', 'Dunmore Brokerage', 'Elmstead Investors',
  'Fairlie Global Custody', 'Greyfriars Trading', 'Halberd Fund Services', 'Ivybridge Partners', 'Juniper Lane Capital',
  'Kestrel Point Advisers', 'Larchmont Securities', 'Meridian Quay Funds', 'Northgate Clearing', 'Oakhurst Asset Mgmt',
  'Pemberton Row Capital', 'Quayside Investments', 'Redhill Markets', 'Saltmarsh Securities', 'Thornbury Pension Fund',
];

export function leiWithCheck(base18: string): string {
  let rem = 0;
  for (const ch of base18 + '00') {
    const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return base18 + String(98 - rem).padStart(2, '0');
}

const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

export interface LabelledSsis {
  rows: Row[];
  golden: Row[];
  /** ssi_id -> defect code the checker is expected to raise (absent = clean). */
  labels: Map<string, FindingCode>;
}

export const INJECTED: FindingCode[] = [
  'PSET_NOT_CSD',
  'PSET_MARKET_MISMATCH',
  'BIC_FORMAT',
  'MISSING_FIELD',
  'LEI_INVALID',
  'CASH_IBAN_INVALID',
  'STALE',
  'UNAUTHENTICATED_SOURCE',
  'CONFLICT',
  'MISMATCH_SAFEKEEPING',
  'MISMATCH_AGENT',
];

/** Generate SSIs as of 2026-11-01, a share of them carrying exactly one labelled defect. */
export function generateSsis(opts: { count?: number; defectRate?: number; seed?: number } = {}): LabelledSsis {
  const count = opts.count ?? 400;
  const defectRate = opts.defectRate ?? 0.3;
  const r = rng(opts.seed ?? 7);
  const int = (n: number): number => Math.floor(r() * n);
  const chars = (n: number, set = ALNUM): string => Array.from({ length: n }, () => set[int(set.length)]).join('');
  const digits = (n: number): string => chars(n, '0123456789');
  const asOf = Date.UTC(2026, 10, 1);
  const day = (offset: number): string => new Date(asOf - offset * 86_400_000).toISOString().slice(0, 10);

  const SUFFIX = ['', ' Europe', ' International', ' Holdings', ' Fund II', ' Markets'];
  const cptys = SUFFIX.flatMap((sfx) => NAMES.map((n) => ({ name: n + sfx, lei: leiWithCheck(`5493${chars(14)}`) })));
  const agents = MARKETS.map((m) => ({ market: m.market, bic: `${chars(4, 'ABCDEFGHKLMNPRSTVWXZ')}${m.market}${chars(2, 'ABCDEFGHKLMNPRSTUVWXYZ23456789')}XXX` }));
  const csdFor = (market: string): string => CSDS.find((c) => c.country === market && !ICSD_BICS.has(c.bic))!.bic;

  const rows: Row[] = [];
  const golden: Row[] = [];
  const labels = new Map<string, FindingCode>();
  const used = new Set<string>();
  for (let i = 0; rows.length < count && i < count * 20; i++) {
    const c = cptys[int(cptys.length)];
    const m = MARKETS[int(MARKETS.length)];
    const assetClass = r() < 0.7 ? 'EQU' : 'FI';
    const route = `${c.lei}|${m.market}|${assetClass}`;
    if (used.has(route)) continue;
    used.add(route);
    const id = `SSI-${String(rows.length + 1).padStart(5, '0')}`;
    const pset = assetClass === 'FI' && r() < 0.3 ? (r() < 0.5 ? 'MGTCBEBEECL' : 'CEDELULLXXX') : csdFor(m.market);
    const row: Row = {
      ssi_id: id,
      counterparty: c.name,
      counterparty_lei: c.lei,
      asset_class: assetClass,
      market: m.market,
      currency: m.currency,
      pset_bic: pset,
      agent_bic: agents.find((a) => a.market === m.market)!.bic,
      safekeeping_account: digits(8 + int(4)),
      cash_agent_bic: agents.find((a) => a.market === m.market)!.bic,
      cash_account: makeIban(m.iban, digits(BBAN_LEN[m.iban])),
      last_verified: day(int(300)),
      effective_date: day(400 + int(600)),
      source: r() < 0.8 ? 'SSI platform' : 'SWIFT MT670',
    };
    golden.push({ ...row });

    if (r() < defectRate) {
      let code = INJECTED[int(INJECTED.length)];
      if (code === 'PSET_MARKET_MISMATCH' && assetClass !== 'EQU') code = 'PSET_NOT_CSD';
      labels.set(id, code);
      switch (code) {
        case 'PSET_NOT_CSD':
          row.pset_bic = row.agent_bic; // agent keyed into the PSET field: the classic error
          break;
        case 'PSET_MARKET_MISMATCH': {
          const other = MARKETS.filter((x) => x.market !== m.market)[int(MARKETS.length - 1)];
          row.pset_bic = csdFor(other.market);
          break;
        }
        case 'BIC_FORMAT':
          row.agent_bic = row.agent_bic.slice(0, 2) + '0' + row.agent_bic.slice(3); // letter keyed as zero in the bank code
          break;
        case 'MISSING_FIELD':
          row.safekeeping_account = '';
          break;
        case 'LEI_INVALID': {
          const d = Number(row.counterparty_lei.slice(-1));
          row.counterparty_lei = row.counterparty_lei.slice(0, -1) + String((d + 1) % 10);
          break;
        }
        case 'CASH_IBAN_INVALID': {
          const pos = 6 + int(row.cash_account.length - 6);
          const d = Number(row.cash_account[pos]);
          row.cash_account = row.cash_account.slice(0, pos) + String(Number.isNaN(d) ? 1 : (d + 1) % 10) + row.cash_account.slice(pos + 1);
          break;
        }
        case 'STALE':
          row.last_verified = day(400 + int(900));
          break;
        case 'UNAUTHENTICATED_SOURCE':
          row.source = r() < 0.5 ? 'email' : 'PDF attachment';
          break;
        case 'CONFLICT': {
          rows.push({ ...row });
          row.ssi_id = `${id}-B`;
          row.safekeeping_account = digits(9);
          labels.delete(id);
          labels.set(row.ssi_id, 'CONFLICT');
          break;
        }
        case 'MISMATCH_SAFEKEEPING':
          row.safekeeping_account = digits(9);
          break;
        case 'MISMATCH_AGENT':
          row.agent_bic = agents.filter((a) => a.market !== m.market)[0].bic.slice(0, 4) + row.agent_bic.slice(4);
          break;
      }
    }
    else if (r() < 0.25) {
      // Cosmetic differences that must NOT be flagged: spacing, case, BIC8 vs BIC11.
      row.cash_account = row.cash_account.replace(/(.{4})/g, '$1 ').trim();
      row.agent_bic = row.agent_bic.toLowerCase();
      golden[golden.length - 1].pset_bic = golden[golden.length - 1].pset_bic.replace(/XXX$/, '');
    }
    rows.push(row);
  }
  return { rows, golden, labels };
}
