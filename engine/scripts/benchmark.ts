// Accuracy benchmark for the address engine.
//
// Builds a labelled test set from real places (bench/cities.ts) written in the
// messy ways vendor masters really contain them, runs each address through the
// same parser and decision rule the Repair Analyst uses, and measures:
//   - coverage: how many addresses are accepted automatically
//   - auto-accept precision: of those, how many have country, town AND postcode right
//   - silent-error rate: wrong answers that were auto-accepted (the number a bank cares about)
//
// Usage: node scripts/benchmark.ts [--set tuning|holdout] [--per-place 20] [--out out] [--min-precision 0.97]
// Set HYNIQE_GEONAMES=/path/to/cities15000.txt to benchmark with the GeoNames gazetteer.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAddress } from '../src/address/parse.ts';
import { countryName } from '../src/address/countries.ts';
import { lookupCity, norm, gazetteerSize } from '../src/address/gazetteer.ts';
import { useGeoNamesIfConfigured } from '../src/address/geonames-env.ts';
import { decide, type RepairDecision } from '../src/skills/payment-data-ops.ts';
import { PLACES as TUNING, PC_FIRST, type BenchPlace } from '../bench/cities.ts';
import { HOLDOUT } from '../bench/holdout.ts';

const args = process.argv.slice(2);
const opt = (n: string, d: string) => (args.indexOf(`--${n}`) >= 0 ? args[args.indexOf(`--${n}`) + 1] : d);
const PER_PLACE = Number(opt('per-place', '20'));
const OUT = opt('out', 'out');
const MIN_PRECISION = Number(opt('min-precision', '0'));
const SET = opt('set', 'tuning');
if (!['tuning', 'holdout'].includes(SET)) throw new Error('--set must be tuning or holdout');
const PLACES = SET === 'holdout' ? HOLDOUT : TUNING;

const geo = useGeoNamesIfConfigured();
const builtInTowns = new Set(PLACES.filter((p) => lookupCity(p.town)).map((p) => p.town));

// Independent seed and templates from scripts/seed.ts, so the benchmark is not the demo data.
let s = SET === 'holdout' ? 424_242 : 777_2026;
const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
const chance = (p: number) => rnd() < p;

const ALPHA3: Record<string, string> = {
  GB: 'GBR', IE: 'IRL', DE: 'DEU', AT: 'AUT', CH: 'CHE', FR: 'FRA', NL: 'NLD', BE: 'BEL', ES: 'ESP', IT: 'ITA',
  PT: 'PRT', SE: 'SWE', DK: 'DNK', NO: 'NOR', FI: 'FIN', PL: 'POL', US: 'USA', CA: 'CAN', MX: 'MEX', BR: 'BRA',
  IN: 'IND', JP: 'JPN', CN: 'CHN', KR: 'KOR', SG: 'SGP', AU: 'AUS', NZ: 'NZL', AE: 'ARE', ZA: 'ZAF',
};
const LOCAL: Record<string, string[]> = {
  GB: ['UK', 'England'], DE: ['Deutschland'], AT: ['Österreich'], CH: ['Schweiz', 'Suisse'], NL: ['Holland', 'Nederland'],
  ES: ['España'], IT: ['Italia'], US: ['USA', 'U.S.A.'], AE: ['UAE'], BR: ['Brasil'], KR: ['South Korea'], TR: ['Turkey'],
};

interface Case {
  id: number;
  text: string;
  hint: string | null;
  place: BenchPlace;
  expectPc: boolean;
  variant: string[];
}

function countryWord(code: string, variant: string[]): string | null {
  const r = rnd();
  if (r < 0.2) { variant.push('no-country'); return null; }
  if (r < 0.55) { variant.push('country-name'); return countryName(code); }
  if (r < 0.7) { variant.push('country-iso2'); return code; }
  if (r < 0.82 && ALPHA3[code]) { variant.push('country-iso3'); return ALPHA3[code]; }
  if (LOCAL[code]) { variant.push('country-local'); return pick(LOCAL[code]); }
  variant.push('country-name');
  return countryName(code);
}

function buildCase(id: number, p: BenchPlace): Case {
  const variant: string[] = [];
  const b = String(1 + Math.floor(rnd() * 240));
  const ctry = countryWord(p.country, variant);
  const dropPc = !!p.pc && chance(0.1);
  if (dropPc) variant.push('no-postcode');
  const pc = p.pc && !dropPc ? p.pc : '';
  const unit = chance(0.25) ? pick([`Unit ${b}B`, `Suite ${100 + Number(b)}`, `Floor ${1 + (Number(b) % 30)}`, `Office ${b}`]) : '';
  if (unit) variant.push('unit');

  let lines: string[];
  if (PC_FIRST.has(p.country)) {
    const streetLine = p.country === 'FR' || p.country === 'LU' ? `${b} ${p.street}` : `${p.street} ${b}`;
    lines = [unit, streetLine, [pc, p.town].filter(Boolean).join(' '), ctry ?? ''];
  } else if (p.country === 'IN') {
    lines = [unit || `Plot ${b}`, p.street, pc ? (chance(0.5) ? `${p.town} - ${pc}` : `${p.town} ${pc}`) : p.town, ctry ?? ''];
  } else {
    const townLine = [p.town, p.region, pc].filter(Boolean).join(' ');
    lines = [unit, `${b} ${p.street}`, p.region && chance(0.5) ? `${p.town}, ${[p.region, pc].filter(Boolean).join(' ')}` : townLine, ctry ?? ''];
  }
  lines = lines.filter(Boolean);
  if (chance(0.15)) { lines.unshift(pick(['Attn: Accounts Payable', 'c/o Finance Department', 'Accounts Receivable'])); variant.push('attn-line'); }

  let text: string;
  const sep = rnd();
  if (sep < 0.5) text = lines.join(', ');
  else if (sep < 0.85) { text = lines.join('\n'); variant.push('multiline'); }
  else { text = lines.join(' '); variant.push('single-line'); }
  if (chance(0.15)) { text = text.toUpperCase(); variant.push('uppercase'); }
  if (chance(0.05)) { text = text.replace(/ /g, '  ') + ','; variant.push('stray-spacing'); }
  const hint = chance(0.15) ? p.country : null;
  if (hint) variant.push('erp-country-field');
  return { id, text, hint, place: p, expectPc: !!pc, variant };
}

const cases: Case[] = [];
for (const p of PLACES) for (let i = 0; i < PER_PLACE; i++) cases.push(buildCase(cases.length + 1, p));

const sameTown = (a: string | undefined, b: string) => {
  if (!a) return false;
  if (norm(a) === norm(b)) return true;
  const ca = lookupCity(a);
  return !!ca && ca === lookupCity(b);
};
const samePc = (a: string | undefined, b: string) => !!a && a.replace(/\s+/g, '').toUpperCase() === b.replace(/\s+/g, '').toUpperCase();

interface Row { c: Case; decision: RepairDecision; ctryOk: boolean; townOk: boolean; pcOk: boolean; ok: boolean; got: Record<string, unknown> }
const rows: Row[] = cases.map((c) => {
  const r = parseAddress(c.text, { countryHint: c.hint });
  const decision = decide(r);
  const ctryOk = r.address.Ctry === c.place.country;
  const townOk = sameTown(r.address.TwnNm, c.place.town);
  const pcOk = !c.expectPc || samePc(r.address.PstCd, c.place.pc);
  return { c, decision, ctryOk, townOk, pcOk, ok: ctryOk && townOk && pcOk, got: { Ctry: r.address.Ctry, TwnNm: r.address.TwnNm, PstCd: r.address.PstCd, confidence: r.confidence } };
});

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);
function stats(rs: Row[]) {
  const auto = rs.filter((r) => r.decision === 'auto');
  const review = rs.filter((r) => r.decision === 'review');
  const data = rs.filter((r) => r.decision === 'needs_data');
  const autoWrong = auto.filter((r) => !r.ok);
  return {
    cases: rs.length,
    autoRate: pct(auto.length, rs.length),
    reviewRate: pct(review.length, rs.length),
    needsDataRate: pct(data.length, rs.length),
    autoPrecision: pct(auto.length - autoWrong.length, auto.length),
    silentErrorRate: pct(autoWrong.length, rs.length),
    countryAccuracy: pct(rs.filter((r) => r.ctryOk).length, rs.length),
    townAccuracy: pct(rs.filter((r) => r.townOk).length, rs.length),
    postcodeAccuracy: pct(rs.filter((r) => r.c.expectPc && r.pcOk).length, rs.filter((r) => r.c.expectPc).length),
    fullyCorrect: pct(rs.filter((r) => r.ok).length, rs.length),
    reviewCatchRate: pct(review.filter((r) => !r.ok).length + data.filter((r) => !r.ok).length, rs.filter((r) => !r.ok).length),
  };
}

const overall = stats(rows);
const byCountry = Object.fromEntries([...new Set(rows.map((r) => r.c.place.country))].sort().map((k) => [k, stats(rows.filter((r) => r.c.place.country === k))]));
const variants = [...new Set(rows.flatMap((r) => r.c.variant))].sort();
const byVariant = Object.fromEntries(variants.map((v) => [v, stats(rows.filter((r) => r.c.variant.includes(v)))]));
const known = stats(rows.filter((r) => builtInTowns.has(r.c.place.town)));
const unknown = stats(rows.filter((r) => !builtInTowns.has(r.c.place.town)));
const silent = rows.filter((r) => r.decision === 'auto' && !r.ok);

const label = `${SET} set, ${geo ? 'built-in gazetteer + GeoNames' : 'built-in gazetteer only'}`;
const result = {
  generatedAt: new Date().toISOString(),
  set: SET,
  gazetteer: label,
  gazetteerNames: gazetteerSize().names,
  places: PLACES.length,
  countries: Object.keys(byCountry).length,
  overall,
  townsInBuiltInList: known,
  townsNotInBuiltInList: unknown,
  byVariant,
  byCountry,
  silentErrors: silent.slice(0, Number(process.env.BENCH_MAX_ERRORS ?? 25)).map((r) => ({ text: r.c.text, expected: { Ctry: r.c.place.country, TwnNm: r.c.place.town, PstCd: r.c.expectPc ? r.c.place.pc : '' }, got: r.got })),
};

const md: string[] = [
  `## Address accuracy benchmark (${label})`,
  '',
  `${overall.cases} labelled addresses · ${PLACES.length} real places · ${result.countries} countries · gazetteer of ${result.gazetteerNames} names`,
  '',
  '| Metric | Value |',
  '|---|---|',
  `| Auto-accepted (no human needed) | ${overall.autoRate}% |`,
  `| **Auto-accept precision** (country, town and postcode all right) | **${overall.autoPrecision}%** |`,
  `| **Silent errors** (wrong but auto-accepted, share of all addresses) | **${overall.silentErrorRate}%** |`,
  `| Sent to human review | ${overall.reviewRate}% |`,
  `| Flagged as missing data | ${overall.needsDataRate}% |`,
  `| Errors caught by review or missing-data flags | ${overall.reviewCatchRate}% |`,
  `| Country / town / postcode accuracy | ${overall.countryAccuracy}% / ${overall.townAccuracy}% / ${overall.postcodeAccuracy}% |`,
  '',
  `Towns in the built-in list: ${known.cases} cases, ${known.autoRate}% auto, ${known.autoPrecision}% precision.  `,
  `Towns not in it: ${unknown.cases} cases, ${unknown.autoRate}% auto, ${unknown.autoPrecision}% precision.`,
  '',
  '| Variant | Cases | Auto | Precision | Silent errors |',
  '|---|---|---|---|---|',
  ...Object.entries(byVariant).map(([k, v]) => `| ${k} | ${v.cases} | ${v.autoRate}% | ${v.autoPrecision}% | ${v.silentErrorRate}% |`),
  '',
  '_Synthetic, labelled test set built from real place names and format-valid postcodes. It measures parsing and decision-making, not real-world postal validity. Measure again on anonymised client data before quoting accuracy to a buyer._',
];

mkdirSync(OUT, { recursive: true });
const suffix = `-${SET}${geo ? '-geonames' : ''}`;
writeFileSync(join(OUT, `benchmark${suffix}.json`), JSON.stringify(result, null, 2));
writeFileSync(join(OUT, `benchmark${suffix}.md`), md.join('\n') + '\n');
console.log(md.join('\n'));
if (silent.length) {
  console.log(`\nFirst silent errors:`);
  for (const e of result.silentErrors.slice(0, 8)) console.log(` - ${JSON.stringify(e.text)} expected ${JSON.stringify(e.expected)} got ${JSON.stringify(e.got)}`);
}
if (MIN_PRECISION && overall.autoPrecision < MIN_PRECISION * 100) {
  console.error(`\nQuality gate failed: auto-accept precision ${overall.autoPrecision}% is below ${MIN_PRECISION * 100}%`);
  process.exit(1);
}
