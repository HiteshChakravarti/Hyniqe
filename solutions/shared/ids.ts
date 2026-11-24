// Identifier validators used across Hub solutions: IBAN, BIC, LEI, ISIN, currency and country codes.
// Pure functions; run in Node and the browser.

export const COUNTRIES = new Set(
  ("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ " +
    "DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
    "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ " +
    "OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
    "UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW").split(" "),
);

export const CURRENCIES = new Set(
  ("AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR " +
    "FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK " +
    "MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL " +
    "THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XAG XAU XCD XOF XPD XPF XPT YER ZAR ZMW ZWG").split(" "),
);

/** IBAN lengths for common countries (SWIFT IBAN registry). Unknown countries are checked by checksum only. */
const IBAN_LEN: Record<string, number> = {
  AD: 24, AE: 23, AT: 20, BE: 16, BG: 22, BH: 22, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18, EE: 20, ES: 24, FI: 18, FR: 27, GB: 22, GI: 23, GR: 27, HR: 21, HU: 28,
  IE: 22, IL: 23, IS: 26, IT: 27, KW: 30, KZ: 20, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31, NL: 18, NO: 15, PL: 28, PT: 25, QA: 29, RO: 24, SA: 24, SE: 24,
  SI: 19, SK: 24, SM: 27, TR: 26, UA: 29, VA: 22,
};
export const SEPA_COUNTRIES = new Set("AD AT BE BG CH CY CZ DE DK EE ES FI FR GB GI GR HR HU IE IS IT LI LT LU LV MC MT NL NO PL PT RO SE SI SK SM VA".split(" "));

export interface Check { ok: boolean; reason?: string }

function mod97(numeric: string): number {
  let rem = 0;
  for (let i = 0; i < numeric.length; i += 7) rem = Number(String(rem) + numeric.slice(i, i + 7)) % 97;
  return rem;
}
const lettersToDigits = (s: string) => s.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));

export function cleanIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function checkIban(raw: string): Check {
  const iban = cleanIban(raw);
  if (!iban) return { ok: false, reason: "empty" };
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(iban)) return { ok: false, reason: "wrong format" };
  const cc = iban.slice(0, 2);
  if (!COUNTRIES.has(cc)) return { ok: false, reason: `unknown country ${cc}` };
  if (IBAN_LEN[cc] && iban.length !== IBAN_LEN[cc]) return { ok: false, reason: `${cc} IBANs have ${IBAN_LEN[cc]} characters, this has ${iban.length}` };
  if (mod97(lettersToDigits(iban.slice(4) + iban.slice(0, 4))) !== 1) return { ok: false, reason: "check digits wrong (typo?)" };
  return { ok: true };
}

export function checkBic(raw: string): Check {
  const b = raw.trim().toUpperCase();
  if (!b) return { ok: false, reason: "empty" };
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(b)) return { ok: false, reason: "must be 8 or 11 characters: 4 letters, country, location (+ branch)" };
  if (!COUNTRIES.has(b.slice(4, 6))) return { ok: false, reason: `unknown country ${b.slice(4, 6)}` };
  if (b[7] === "0") return { ok: true, reason: "test BIC (location ends in 0)" };
  return { ok: true };
}

/** LEI: ISO 17442, 18 alphanumerics + 2 check digits, mod 97 = 1. */
export function checkLei(raw: string): Check {
  const l = raw.trim().toUpperCase();
  if (!l) return { ok: false, reason: "empty" };
  if (!/^[A-Z0-9]{18}\d{2}$/.test(l)) return { ok: false, reason: "must be 20 characters (18 letters/digits + 2 check digits)" };
  if (mod97(lettersToDigits(l)) !== 1) return { ok: false, reason: "check digits wrong (typo?)" };
  return { ok: true };
}

/** ISIN: ISO 6166, 2-letter country + 9 alphanumerics + Luhn check digit. */
export function checkIsin(raw: string): Check {
  const s = raw.trim().toUpperCase();
  if (!s) return { ok: false, reason: "empty" };
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(s)) return { ok: false, reason: "must be 12 characters: country + 9 + check digit" };
  if (!COUNTRIES.has(s.slice(0, 2)) && !["XS", "EU", "QS", "QT"].includes(s.slice(0, 2))) return { ok: false, reason: `unknown prefix ${s.slice(0, 2)}` };
  const digits = lettersToDigits(s.slice(0, 11));
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(s[11]) ? { ok: true } : { ok: false, reason: "check digit wrong (typo?)" };
}

export function checkCurrency(raw: string): Check {
  const c = raw.trim().toUpperCase();
  return CURRENCIES.has(c) ? { ok: true } : { ok: false, reason: c ? `${c} is not an ISO 4217 currency` : "empty" };
}

export function checkCountry(raw: string): Check {
  const c = raw.trim().toUpperCase();
  return COUNTRIES.has(c) ? { ok: true } : { ok: false, reason: c ? `${c} is not an ISO 3166 country code` : "empty" };
}

export const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

/** Build a valid LEI / IBAN check pair for tests and samples. */
export function leiWithCheck(base18: string): string {
  const r = 98 - mod97(lettersToDigits(base18.toUpperCase() + "00"));
  return base18.toUpperCase() + String(r).padStart(2, "0");
}
export function ibanWithCheck(country: string, bban: string): string {
  const r = 98 - mod97(lettersToDigits(bban.toUpperCase() + country.toUpperCase() + "00"));
  return country.toUpperCase() + String(r).padStart(2, "0") + bban.toUpperCase();
}
