// Country reference data built from the runtime's ICU data (no external download).
// Gives every ISO 3166-1 alpha-2 code with its English name, plus common aliases
// and alpha-3 codes that show up in ERP vendor masters.

const NON_ISO = new Set(['AC', 'CP', 'DG', 'EA', 'EU', 'EZ', 'IC', 'QO', 'TA', 'UN', 'XA', 'XB', 'ZZ']);

const display = new Intl.DisplayNames(['en'], { type: 'region' });

export const COUNTRY_NAMES: Record<string, string> = {};
for (let a = 65; a <= 90; a++) {
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b);
    if (NON_ISO.has(code)) continue;
    let name: string | undefined;
    try {
      name = display.of(code);
    } catch {
      continue;
    }
    if (!name || name === code || name === 'Unknown Region') continue;
    // Skip deprecated codes (UK, SU, YU...) that ICU maps onto a current code.
    if (new Intl.Locale('und', { region: code }).region !== code) continue;
    COUNTRY_NAMES[code] = name;
  }
}

const ALIASES: Record<string, string> = {
  'usa': 'US', 'u.s.a.': 'US', 'u.s.': 'US', 'united states of america': 'US', 'america': 'US',
  'uk': 'GB', 'u.k.': 'GB', 'great britain': 'GB', 'britain': 'GB', 'england': 'GB',
  'scotland': 'GB', 'wales': 'GB', 'northern ireland': 'GB',
  'uae': 'AE', 'u.a.e.': 'AE', 'emirates': 'AE',
  'holland': 'NL', 'the netherlands': 'NL', 'deutschland': 'DE', 'brd': 'DE',
  'south korea': 'KR', 'republic of korea': 'KR', 'korea': 'KR',
  'hong kong sar': 'HK', 'hong kong sar china': 'HK', 'czech republic': 'CZ',
  'turkey': 'TR', 'türkiye': 'TR', 'russia': 'RU', 'vietnam': 'VN', 'viet nam': 'VN',
  'ivory coast': 'CI', 'schweiz': 'CH', 'suisse': 'CH', 'españa': 'ES', 'italia': 'IT',
  'österreich': 'AT', 'oesterreich': 'AT', 'belgique': 'BE', 'belgie': 'BE', 'nederland': 'NL',
  'sverige': 'SE', 'norge': 'NO', 'danmark': 'DK', 'polska': 'PL', 'brasil': 'BR',
  'méxico': 'MX', 'prc': 'CN', "people's republic of china": 'CN', 'mainland china': 'CN',
  'ksa': 'SA', 'kingdom of saudi arabia': 'SA', 'republic of ireland': 'IE', 'eire': 'IE',
};

const ALPHA3: Record<string, string> = {
  USA: 'US', GBR: 'GB', DEU: 'DE', FRA: 'FR', IND: 'IN', SGP: 'SG', ARE: 'AE', NLD: 'NL',
  CHE: 'CH', JPN: 'JP', CHN: 'CN', HKG: 'HK', AUS: 'AU', CAN: 'CA', ESP: 'ES', ITA: 'IT',
  IRL: 'IE', BEL: 'BE', LUX: 'LU', SWE: 'SE', NOR: 'NO', DNK: 'DK', POL: 'PL', BRA: 'BR',
  MEX: 'MX', ZAF: 'ZA', SAU: 'SA', AUT: 'AT', PRT: 'PT', FIN: 'FI', NZL: 'NZ', KOR: 'KR',
};

const BY_NAME = new Map<string, string>();
for (const [code, name] of Object.entries(COUNTRY_NAMES)) BY_NAME.set(name.toLowerCase(), code);
for (const [alias, code] of Object.entries(ALIASES)) BY_NAME.set(alias, code);

export function isCountryCode(code: string | undefined | null): boolean {
  return !!code && Object.prototype.hasOwnProperty.call(COUNTRY_NAMES, code.toUpperCase());
}

export function countryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

/**
 * Resolve a free-text token to an ISO alpha-2 code.
 * `allowAlpha2` is off by default because two-letter tokens collide with
 * US state codes (CA, IN, DE...) and building suffixes.
 */
export function lookupCountry(token: string, opts: { allowAlpha2?: boolean } = {}): string | null {
  const t = token.trim().replace(/\.$/, '').trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  const byName = BY_NAME.get(lower);
  if (byName) return byName;
  const upper = t.toUpperCase();
  if (/^[A-Z]{3}$/.test(upper) && ALPHA3[upper]) return ALPHA3[upper];
  if (opts.allowAlpha2 && /^[A-Za-z]{2}$/.test(t) && isCountryCode(upper)) return upper;
  return null;
}
