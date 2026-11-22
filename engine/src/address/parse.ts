// Deterministic address structurer for ISO 20022 PostalAddress24 (CBPR+).
// Every decision is recorded as evidence so a reviewer or auditor can see
// why a field was filled the way it was.

import { lookupCountry, isCountryCode } from './countries.ts';
import { findCityIn, norm, type City } from './gazetteer.ts';
import { POSTCODES, US_STATES, postcodeValid } from './postcodes.ts';

export interface PostalAddress {
  StrtNm?: string;
  BldgNb?: string;
  BldgNm?: string;
  Flr?: string;
  Room?: string;
  PstBx?: string;
  PstCd?: string;
  TwnNm?: string;
  CtrySubDvsn?: string;
  Ctry?: string;
  AdrLine?: string[];
}

export type IssueCode =
  | 'MISSING_COUNTRY'
  | 'MISSING_TOWN'
  | 'AMBIGUOUS_TOWN'
  | 'COUNTRY_INFERRED'
  | 'TOWN_INFERRED'
  | 'POSTCODE_FORMAT'
  | 'ADRLINE_OVERFLOW'
  | 'FIELD_TOO_LONG'
  | 'INVALID_COUNTRY';

export interface Issue {
  code: IssueCode;
  severity: 'block' | 'review' | 'info';
  message: string;
}

export interface ParseResult {
  address: PostalAddress;
  format: 'structured' | 'hybrid' | 'unresolved';
  confidence: number;
  evidence: string[];
  issues: Issue[];
}

export const MAX_LEN: Record<string, number> = {
  StrtNm: 70, BldgNb: 16, BldgNm: 35, Flr: 70, Room: 70, PstBx: 16,
  PstCd: 16, TwnNm: 35, CtrySubDvsn: 35, AdrLine: 70,
};

const STREET_WORDS = /\b(road|rd|street|st|avenue|ave|rue|strasse|straße|str|weg|laan|gracht|lane|ln|marg|boulevard|blvd|drive|dr|way|place|pl|square|sq|via|calle|avenida|rua|allee|gasse|platz|kade|straat|chaussee|quai|parade|terrace|crescent|close|highway|hwy)\b\.?/i;
const STREET_SUFFIX = /(strasse|straße|str\.|weg|gracht|straat|laan|gasse|platz|allee|vej|gatan|katu|kade|dijk|singel|plein|ring|damm|ufer)$/i;
const REGIONS: Record<string, Set<string>> = {
  US: US_STATES,
  AU: new Set(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']),
  CA: new Set(['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU']),
};
const BUILDING_WORDS = /\b(house|tower|towers|building|bldg|centre|center|plaza|complex|court|park|estate|chambers|hub|mall|wharf)\b/i;

/** Remove a gazetteer match (accent-insensitive) from a segment, preserving the rest. */
function removeWords(seg: string, key: string): string {
  const words = seg.split(/\s+/);
  const k = key.split(' ').length;
  for (let i = 0; i + k <= words.length; i++) {
    if (norm(words.slice(i, i + k).join(' ')) === key) {
      return [...words.slice(0, i), ...words.slice(i + k)].join(' ').trim();
    }
  }
  return seg;
}

function lastMatch(text: string, re: RegExp): RegExpMatchArray | null {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpMatchArray | null = null;
  for (const x of text.matchAll(g)) m = x;
  return m;
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/^[\s,;-]+|[\s,;-]+$/g, '').trim();
}

export function parseAddress(text: string, opts: { countryHint?: string | null } = {}): ParseResult {
  const evidence: string[] = [];
  const issues: Issue[] = [];
  const addr: PostalAddress = {};
  let conf = 1;

  let segs = text.split(/[\n,;]+/).map(clean).filter(Boolean);

  // 1. Country stated in the text (last line, or trailing words of the last line).
  let country: string | null = null;
  if (segs.length) {
    const last = segs[segs.length - 1];
    const whole = lookupCountry(last, { allowAlpha2: segs.length > 1 && !US_STATES.has(last.toUpperCase()) });
    if (whole) {
      country = whole;
      segs.pop();
      evidence.push(`Country "${last}" read from the address text`);
    } else {
      const words = last.split(/\s+/);
      for (let n = Math.min(4, words.length - 1); n >= 1 && !country; n--) {
        const tail = words.slice(-n).join(' ');
        const c = lookupCountry(tail, { allowAlpha2: n === 1 });
        if (c) {
          country = c;
          segs[segs.length - 1] = words.slice(0, -n).join(' ');
          evidence.push(`Country "${tail}" read from the address text`);
        }
      }
    }
  }
  segs = segs.map(clean).filter(Boolean);

  const hint = opts.countryHint && isCountryCode(opts.countryHint) ? opts.countryHint.toUpperCase() : null;
  if (!country && hint) {
    country = hint;
    conf -= 0.05;
    evidence.push(`Country ${hint} taken from the ERP country field`);
  }

  // 2. Town from the gazetteer (searching from the last line backwards).
  let cityHit: { city: City; match: string; idx: number } | null = null;
  for (let i = segs.length - 1; i >= 0 && !cityHit; i--) {
    const hit = findCityIn(segs[i]);
    if (!hit) continue;
    const fits = !country || hit.city.country === country || hit.city.alsoIn?.includes(country);
    if (fits) cityHit = { ...hit, idx: i };
  }

  if (cityHit) {
    const { city } = cityHit;
    // Settle an ambiguous town with hard evidence only: a postcode in a format
    // unique to one candidate country, or a state code written right after the town.
    const candidates = [city.country, ...(city.alsoIn ?? [])];
    const after = (() => {
      const at = text.toLowerCase().indexOf(cityHit.match.split(' ')[0]);
      if (at < 0) return null;
      const m = text.slice(at).match(/^[\p{L} .'-]+?[,\s]+([A-Z]{2,3})\b/u);
      return m ? m[1] : null;
    })();
    const byRegion = after ? candidates.filter((c) => REGIONS[c]?.has(after)) : [];
    const byPostcode = candidates.filter((c) => POSTCODES[c]?.distinctive && POSTCODES[c].re.test(text));
    const settled = byPostcode.length === 1 ? byPostcode : byRegion.length === 1 ? byRegion : [];
    if (!country && city.alsoIn?.length && settled.length === 1) {
      country = settled[0];
      conf -= 0.1;
      const how = byPostcode.length === 1 ? 'postcode format' : `state/province code "${after}"`;
      issues.push({ code: 'COUNTRY_INFERRED', severity: 'info', message: `Country ${country} inferred from town ${city.name} and its ${how}` });
      evidence.push(`Country ${country} inferred from "${city.name}" plus its ${how}`);
    }
    if (!country) {
      country = city.country;
      if (city.alsoIn?.length) {
        conf -= 0.35;
        issues.push({
          code: 'AMBIGUOUS_TOWN',
          severity: 'review',
          message: `"${city.name}" exists in ${[city.country, ...city.alsoIn].join(', ')} and no country was given`,
        });
      } else {
        conf -= 0.1;
        issues.push({ code: 'COUNTRY_INFERRED', severity: 'info', message: `Country ${city.country} inferred from town ${city.name}` });
      }
      evidence.push(`Country ${city.country} inferred from town "${city.name}"`);
    }
    addr.TwnNm = city.name;
    if (city.needsRegion && !(after && REGIONS[city.country]?.has(after))) {
      conf -= 0.3;
      issues.push({ code: 'AMBIGUOUS_TOWN', severity: 'review', message: `"${city.name}" exists in several states; state is needed` });
    }
    evidence.push(`Town "${addr.TwnNm}" matched in the gazetteer`);
    segs[cityHit.idx] = removeWords(segs[cityHit.idx], cityHit.match);
  }

  // 3. Postcode (last match wins so building numbers are not mistaken for codes).
  const joined = segs.join(' | ');
  let pcCountry = country;
  let pcMatch: RegExpMatchArray | null = null;
  if (country && POSTCODES[country]) {
    pcMatch = lastMatch(joined, POSTCODES[country].re);
  } else if (!country) {
    for (const [c, f] of Object.entries(POSTCODES)) {
      if (!f.distinctive) continue;
      const m = lastMatch(joined, f.re);
      if (m) { pcMatch = m; pcCountry = c; break; }
    }
    if (pcMatch && pcCountry) {
      country = pcCountry;
      conf -= 0.2;
      issues.push({ code: 'COUNTRY_INFERRED', severity: 'review', message: `Country ${pcCountry} inferred from postcode format only` });
      evidence.push(`Country ${pcCountry} inferred from postcode "${pcMatch[0]}"`);
    }
  }

  if (pcMatch) {
    const raw = pcMatch[0];
    addr.PstCd = raw.toUpperCase().replace(/\s+/g, ' ').replace(/^L-/, '');
    const segIdx = segs.findIndex((s) => s.includes(raw));
    if (segIdx >= 0) {
      let seg = segs[segIdx].replace(raw, ' ');
      const regions = country ? REGIONS[country] : undefined;
      if (regions) {
        const st = seg.match(/\b([A-Z]{2,3})\s*$/);
        if (st && regions.has(st[1])) {
          addr.CtrySubDvsn = st[1];
          seg = seg.replace(/\b[A-Z]{2,3}\s*$/, '');
          evidence.push(`State/province "${st[1]}" read before the postcode`);
        }
      }
      seg = clean(seg);
      // Town written next to the postcode but not in the gazetteer ("10115 Berlin").
      if (!addr.TwnNm && seg && /^[\p{L}][\p{L}' .-]{1,34}$/u.test(seg) && seg.split(' ').length <= 3 && !STREET_WORDS.test(seg)) {
        addr.TwnNm = seg;
        seg = '';
        conf -= 0.15;
        issues.push({ code: 'TOWN_INFERRED', severity: 'info', message: `Town "${addr.TwnNm}" taken from the text beside the postcode` });
        evidence.push(`Town "${addr.TwnNm}" taken from beside the postcode`);
      }
      segs[segIdx] = seg;
    }
    evidence.push(`Postcode "${addr.PstCd}" matched the ${pcCountry} format`);
  }
  segs = segs.map(clean).filter(Boolean);

  // 4. Last resort for town: a short alphabetic last line.
  if (!addr.TwnNm && country && segs.length >= 2) {
    const cand = segs[segs.length - 1];
    if (/^[\p{L}][\p{L}' .-]{1,34}$/u.test(cand) && cand.split(' ').length <= 3 && !STREET_WORDS.test(cand) && !BUILDING_WORDS.test(cand)) {
      addr.TwnNm = cand;
      segs.pop();
      conf -= 0.25;
      issues.push({ code: 'TOWN_INFERRED', severity: 'review', message: `Town "${cand}" assumed from the last address line` });
      evidence.push(`Town "${cand}" assumed from the last line`);
    }
  }

  // 5. PO Box, floor and unit.
  segs = segs.map((s) => {
    let seg = s;
    const pb = seg.match(/\b(?:P\.?\s?O\.?\s?Box|Post\s?Box|Postfach|Apartado|Casilla|B\.?P\.?)\s*(?:No\.?\s*)?([\w-]+)/i);
    if (pb && !addr.PstBx) { addr.PstBx = pb[1]; seg = seg.replace(pb[0], ' '); evidence.push(`PO Box "${pb[1]}" extracted`); }
    const sg = seg.match(/#(\d{1,3})-(\d{1,5})\b/);
    if (sg) { addr.Flr = sg[1]; addr.Room = sg[2]; seg = seg.replace(sg[0], ' '); evidence.push(`Unit "${sg[0]}" split into floor ${sg[1]} and room ${sg[2]}`); }
    const fl = seg.match(/\b(?:floor|flr|level|lvl)\s*(\d{1,3})\b|\b(\d{1,3})(?:st|nd|rd|th)\s+floor\b/i);
    if (fl && !addr.Flr) { addr.Flr = fl[1] ?? fl[2]; seg = seg.replace(fl[0], ' '); evidence.push(`Floor "${addr.Flr}" extracted`); }
    const rm = seg.match(/\b(?:unit|flat|suite|ste|apt|apartment|room|office|plot|shop|lot)\s*(?:no\.?\s*)?#?\s*([\w-]{1,10})\b/i);
    if (rm && !addr.Room) { addr.Room = rm[0].trim(); seg = seg.replace(rm[0], ' '); evidence.push(`Unit "${addr.Room}" extracted`); }
    return clean(seg);
  }).filter(Boolean);

  // 6. Street and building number.
  const used = new Set<number>();
  for (let i = 0; i < segs.length && !addr.StrtNm; i++) {
    const s = segs[i];
    let m = s.match(/^(\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)?)\s+(\D.*)$/);
    if (m && /\p{L}{2,}/u.test(m[2])) {
      addr.BldgNb = m[1]; addr.StrtNm = clean(m[2]); used.add(i);
      evidence.push(`Building number "${m[1]}" and street "${addr.StrtNm}" split (number first)`);
      break;
    }
    m = s.match(/^(\D*\p{L}{2,}\D*?)\s+(\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)?)$/u);
    if (m && (STREET_WORDS.test(m[1]) || STREET_SUFFIX.test(m[1].split(' ').pop() ?? ''))) {
      addr.StrtNm = clean(m[1]); addr.BldgNb = m[2]; used.add(i);
      evidence.push(`Street "${addr.StrtNm}" and building number "${m[2]}" split (number last)`);
      break;
    }
  }
  if (!addr.StrtNm) {
    const i = segs.findIndex((s, idx) => !used.has(idx) && STREET_WORDS.test(s) && !/\d/.test(s));
    if (i >= 0) { addr.StrtNm = segs[i]; used.add(i); evidence.push(`Street "${segs[i]}" recognised by street keyword`); }
  }
  const b = segs.findIndex((s, idx) => !used.has(idx) && BUILDING_WORDS.test(s) && s.length <= MAX_LEN.BldgNm);
  if (b >= 0) { addr.BldgNm = segs[b]; used.add(b); evidence.push(`Building name "${segs[b]}" recognised`); }

  // 7. Whatever is left becomes address lines (hybrid format).
  const rest = segs.filter((_, i) => !used.has(i)).map(clean).filter(Boolean);
  if (rest.length) {
    const lines: string[] = [];
    let cur = '';
    for (const r of rest) {
      const next = cur ? `${cur}, ${r}` : r;
      if (next.length <= MAX_LEN.AdrLine) cur = next;
      else { if (cur) lines.push(cur); cur = r; }
    }
    if (cur) lines.push(cur);
    if (lines.length > 2 || lines.some((l) => l.length > MAX_LEN.AdrLine)) {
      issues.push({ code: 'ADRLINE_OVERFLOW', severity: 'review', message: 'Leftover text does not fit two 70-character address lines' });
      conf -= 0.2;
    }
    addr.AdrLine = lines.slice(0, 2).map((l) => l.slice(0, MAX_LEN.AdrLine));
    evidence.push(`${lines.length} unparsed fragment line(s) kept as AdrLine (hybrid)`);
  }

  if (country) addr.Ctry = country;
  const v = validateAddress(addr);
  issues.push(...v.filter((x) => !issues.some((y) => y.code === x.code)));

  const blocked = issues.some((i) => i.severity === 'block');
  return {
    address: addr,
    format: blocked ? 'unresolved' : addr.AdrLine?.length ? 'hybrid' : 'structured',
    confidence: blocked ? 0 : Math.max(0, Math.round(conf * 100) / 100),
    evidence,
    issues,
  };
}

/** CBPR+ checks shared by the parser and by profiling of already-structured records. */
export function validateAddress(a: PostalAddress): Issue[] {
  const out: Issue[] = [];
  if (!a.Ctry) out.push({ code: 'MISSING_COUNTRY', severity: 'block', message: 'Country is mandatory and could not be determined' });
  else if (!isCountryCode(a.Ctry)) out.push({ code: 'INVALID_COUNTRY', severity: 'block', message: `"${a.Ctry}" is not an ISO 3166 country code` });
  if (!a.TwnNm) out.push({ code: 'MISSING_TOWN', severity: 'block', message: 'Town is mandatory and could not be determined' });
  if (a.PstCd && a.Ctry && postcodeValid(a.PstCd, a.Ctry) === false) {
    out.push({ code: 'POSTCODE_FORMAT', severity: 'review', message: `Postcode "${a.PstCd}" does not match the ${a.Ctry} format` });
  }
  for (const [k, max] of Object.entries(MAX_LEN)) {
    const val = (a as Record<string, unknown>)[k];
    if (typeof val === 'string' && val.length > max) {
      out.push({ code: 'FIELD_TOO_LONG', severity: 'review', message: `${k} is longer than ${max} characters` });
    }
  }
  return out;
}
