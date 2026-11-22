// Postcode formats for the countries most common in vendor masters.
// `distinctive` means the format alone is a strong hint about the country.

export interface PostcodeFormat {
  re: RegExp;
  distinctive: boolean;
}

export const POSTCODES: Record<string, PostcodeFormat> = {
  GB: { re: /\b([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})\b/i, distinctive: true },
  NL: { re: /\b(\d{4} ?[A-Z]{2})\b/, distinctive: true },
  CA: { re: /\b([A-Z]\d[A-Z] ?\d[A-Z]\d)\b/i, distinctive: true },
  JP: { re: /\b(\d{3}-\d{4})\b/, distinctive: true },
  PL: { re: /\b(\d{2}-\d{3})\b/, distinctive: true },
  BR: { re: /\b(\d{5}-\d{3})\b/, distinctive: true },
  IE: { re: /\b([AC-FHKNPRTV-Y]\d{2}|D6W) ?([0-9AC-FHKNPRTV-Y]{4})\b/i, distinctive: true },
  US: { re: /\b(\d{5}(?:-\d{4})?)\b/, distinctive: false },
  DE: { re: /\b(\d{5})\b/, distinctive: false },
  FR: { re: /\b(\d{5})\b/, distinctive: false },
  ES: { re: /\b(\d{5})\b/, distinctive: false },
  IT: { re: /\b(\d{5})\b/, distinctive: false },
  MX: { re: /\b(\d{5})\b/, distinctive: false },
  IN: { re: /\b(\d{3} ?\d{3})\b/, distinctive: false },
  SG: { re: /\b(\d{6})\b/, distinctive: false },
  CN: { re: /\b(\d{6})\b/, distinctive: false },
  CH: { re: /\b(\d{4})\b/, distinctive: false },
  AT: { re: /\b(\d{4})\b/, distinctive: false },
  BE: { re: /\b(\d{4})\b/, distinctive: false },
  LU: { re: /\b(?:L-)?(\d{4})\b/, distinctive: false },
  DK: { re: /\b(\d{4})\b/, distinctive: false },
  NO: { re: /\b(\d{4})\b/, distinctive: false },
  AU: { re: /\b(\d{4})\b/, distinctive: false },
  SE: { re: /\b(\d{3} ?\d{2})\b/, distinctive: false },
  PT: { re: /\b(\d{4}-\d{3})\b/, distinctive: true },
  FI: { re: /\b(\d{5})\b/, distinctive: false },
  TR: { re: /\b(\d{5})\b/, distinctive: false },
  KR: { re: /\b(\d{5})\b/, distinctive: false },
  TH: { re: /\b(\d{5})\b/, distinctive: false },
  MY: { re: /\b(\d{5})\b/, distinctive: false },
  ID: { re: /\b(\d{5})\b/, distinctive: false },
  KE: { re: /\b(\d{5})\b/, distinctive: false },
  EG: { re: /\b(\d{5})\b/, distinctive: false },
  SA: { re: /\b(\d{5})(?:-\d{4})?\b/, distinctive: false },
  PK: { re: /\b(\d{5})\b/, distinctive: false },
  LK: { re: /\b(\d{5})\b/, distinctive: false },
  HR: { re: /\b(\d{5})\b/, distinctive: false },
  EE: { re: /\b(\d{5})\b/, distinctive: false },
  UA: { re: /\b(\d{5})\b/, distinctive: false },
  ZA: { re: /\b(\d{4})\b/, distinctive: false },
  NZ: { re: /\b(\d{4})\b/, distinctive: false },
  PH: { re: /\b(\d{4})\b/, distinctive: false },
  HU: { re: /\b(\d{4})\b/, distinctive: false },
  BD: { re: /\b(\d{4})\b/, distinctive: false },
  SI: { re: /\b(\d{4})\b/, distinctive: false },
  BG: { re: /\b(\d{4})\b/, distinctive: false },
  VN: { re: /\b(\d{6})\b/, distinctive: false },
  RU: { re: /\b(\d{6})\b/, distinctive: false },
  RO: { re: /\b(\d{6})\b/, distinctive: false },
  CO: { re: /\b(\d{6})\b/, distinctive: false },
  CZ: { re: /\b(\d{3} ?\d{2})\b/, distinctive: false },
  SK: { re: /\b(\d{3} ?\d{2})\b/, distinctive: false },
  GR: { re: /\b(\d{3} ?\d{2})\b/, distinctive: false },
  IL: { re: /\b(\d{7})\b/, distinctive: false },
  CL: { re: /\b(\d{7})\b/, distinctive: false },
  AR: { re: /\b([A-Z]\d{4}[A-Z]{3}|\d{4})\b/, distinctive: false },
  LV: { re: /\b(LV-\d{4})\b/, distinctive: true },
  LT: { re: /\b(LT-\d{5})\b/, distinctive: true },
};

export function findPostcode(text: string, country: string | null): { code: string; country: string } | null {
  if (country) {
    const f = POSTCODES[country];
    if (!f) return null;
    const m = text.match(f.re);
    return m ? { code: m[0].toUpperCase().replace(/\s+/g, ' '), country } : null;
  }
  for (const [c, f] of Object.entries(POSTCODES)) {
    if (!f.distinctive) continue;
    const m = text.match(f.re);
    if (m) return { code: m[0].toUpperCase().replace(/\s+/g, ' '), country: c };
  }
  return null;
}

export function postcodeValid(code: string, country: string): boolean | null {
  const f = POSTCODES[country];
  if (!f) return null; // unknown format: cannot judge
  const anchored = new RegExp(`^${f.re.source.replace(/^\\b|\\b$/g, '')}$`, f.re.flags);
  return anchored.test(code.trim());
}

export const US_STATES = new Set(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '),
);
