// A labelled trade table with an exact, known number of defects per column and dimension.
import { makeIban } from '../../../engine/src/address/iban.ts';
import { isinWithCheck } from '../../corporate-actions-checker/src/sample.ts';
import { toCsv } from '../../shared/csv.ts';
import { leiWithCheck, rng } from '../../ssi-checker/src/sample.ts';

export interface Truth {
  blank: Record<string, number>;
  invalid: Record<string, number>;
  inconsistent: Record<string, number>;
  duplicates: Record<string, number>;
  duplicateRows: number;
  ibanCountry: number;
}

export const COLUMNS = ['trade_id', 'trade_date', 'isin', 'lei', 'currency', 'amount', 'country', 'iban', 'bic', 'email'] as const;
const CTRY = ['DE', 'FR', 'NL', 'GB', 'ES', 'IT', 'BE', 'AT'];
const CCY = ['EUR', 'GBP', 'USD', 'CHF'];

export function generateTable(opts: { seed?: number; rows?: number } = {}): { rows: Record<string, string>[]; truth: Truth; csv: string } {
  const r = rng(opts.seed ?? 3);
  const n = opts.rows ?? 400;
  const d = (k: number) => Array.from({ length: k }, () => Math.floor(r() * 10)).join('');
  const rows: Record<string, string>[] = [];
  for (let i = 0; i < n; i++) {
    const c = CTRY[Math.floor(r() * CTRY.length)];
    const day = 1 + Math.floor(r() * 28), m = 1 + Math.floor(r() * 12);
    rows.push({
      trade_id: `T${String(100000 + i)}`,
      trade_date: `2026-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isin: isinWithCheck(`${c}${d(9)}`),
      lei: leiWithCheck(`5493${d(14)}`),
      currency: CCY[Math.floor(r() * CCY.length)],
      amount: (Math.floor(r() * 10000000) / 100 + 1).toFixed(2),
      country: c,
      iban: makeIban(c, d(18)),
      bic: `${'ABCDEFGH'[Math.floor(r() * 8)]}BNK${c}${'2X'[Math.floor(r() * 2)]}X`,
      email: `ops${i}@bank${Math.floor(r() * 9)}.example`,
    });
  }
  const truth: Truth = { blank: {}, invalid: {}, inconsistent: {}, duplicates: { trade_id: 0 }, duplicateRows: 0, ibanCountry: 0 };
  for (const col of COLUMNS) { truth.blank[col] = 0; truth.invalid[col] = 0; truth.inconsistent[col] = 0; }
  const touched = new Set<string>();
  const take = (col: string): Record<string, string> => {
    for (;;) {
      const i = Math.floor(r() * n);
      if (!touched.has(`${i}`)) { touched.add(`${i}`); return rows[i]; }
    }
  };
  const k = Math.max(2, Math.round(n * 0.02));
  for (const col of COLUMNS) {
    if (col === 'trade_id') continue;
    for (let j = 0; j < k; j++) { take(col)[col] = ''; truth.blank[col]++; }
  }
  const invalid: Partial<Record<(typeof COLUMNS)[number], (v: string) => string>> = {
    trade_date: (v) => v.slice(0, 5) + '02-30',
    isin: (v) => v.slice(0, 11) + String((Number(v[11]) + 1) % 10),
    lei: (v) => v.slice(0, 19) + String((Number(v[19]) + 1) % 10),
    currency: () => 'EUX',
    iban: (v) => v.slice(0, 10) + String((Number(v[10]) + 1) % 10) + v.slice(11),
    bic: (v) => v.slice(0, 4) + 'QQ' + v.slice(6),
    email: (v) => v.replace('.example', ''),
  };
  for (const [col, f] of Object.entries(invalid)) for (let j = 0; j < k; j++) { const row = take(col); row[col] = f!(row[col]); truth.invalid[col]++; }
  const restyle: Partial<Record<(typeof COLUMNS)[number], (v: string) => string>> = {
    trade_date: (v) => `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}`,
    isin: (v) => v.toLowerCase(),
    iban: (v) => v.replace(/(.{4})/g, '$1 ').trim(),
    amount: (v) => v.replace('.', ','),
    country: (v) => v.toLowerCase(),
  };
  for (const [col, f] of Object.entries(restyle)) for (let j = 0; j < k; j++) { const row = take(col); row[col] = f!(row[col]); truth.inconsistent[col]++; }
  for (let j = 0; j < k; j++) {
    const row = take('iban');
    const other = CTRY.find((c) => c !== row.country)!;
    row.iban = makeIban(other, d(18));
    row.bic = row.bic.slice(0, 4) + other + row.bic.slice(6);
    truth.ibanCountry++;
  }
  for (let j = 0; j < k; j++) { const src = take('trade_id'); take('trade_id').trade_id = src.trade_id; truth.duplicates.trade_id++; }
  for (let j = 0; j < k; j++) { rows.push({ ...take('row') }); truth.duplicateRows++; truth.duplicates.trade_id++; }
  return { rows, truth, csv: toCsv(rows) };
}
