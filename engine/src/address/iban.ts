// IBAN / BIC helpers used by the controls agent to cross-check address country.

export function ibanValid(iban: string): boolean {
  const s = iban.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}

export function ibanCountry(iban: string | null | undefined): string | null {
  if (!iban) return null;
  const s = iban.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{2}/.test(s) ? s.slice(0, 2) : null;
}

/** Build a checksum-valid IBAN from a country code and BBAN (used by the seed script). */
export function makeIban(country: string, bban: string): string {
  const raw = bban + country.toUpperCase() + '00';
  let rem = 0;
  for (const ch of raw) {
    const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  const check = String(98 - rem).padStart(2, '0');
  return `${country.toUpperCase()}${check}${bban}`;
}

export function bicCountry(bic: string | null | undefined): string | null {
  if (!bic) return null;
  const s = bic.trim().toUpperCase();
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s) ? s.slice(4, 6) : null;
}
