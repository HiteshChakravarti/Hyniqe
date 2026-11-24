// Name normalisation and fuzzy matching shared by Hub solutions.

const LEGAL_FORMS = [
  "limited", "ltd", "llc", "l l c", "inc", "incorporated", "plc", "corp", "corporation", "co", "company", "gmbh", "mbh", "ag", "kg", "ohg", "ug", "e k", "ek", "sa", "s a", "sas", "sarl", "s a r l",
  "srl", "s r l", "spa", "s p a", "bv", "b v", "nv", "n v", "oy", "ab", "as", "a s", "aps", "sl", "s l", "sp z o o", "spzoo", "pvt", "private", "pte", "pty", "kft", "zrt", "doo", "d o o", "se",
];
const LEGAL_RE = new RegExp(`\\b(${LEGAL_FORMS.map((f) => f.replace(/ /g, "\\s?")).join("|")})\\b`, "g");

export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/æ/g, "ae").replace(/ø/g, "o").replace(/œ/g, "oe").replace(/ł/g, "l");
}

/** Lower-case, strip accents, punctuation and (optionally) legal forms. */
export function normName(s: string, dropLegalForms = true): string {
  let t = stripAccents(s.toLowerCase()).replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  if (dropLegalForms) t = t.replace(LEGAL_RE, " ").replace(/\s+/g, " ").trim();
  return t.replace(/^the /, "");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

export function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

export function tokenSet(s: string): Set<string> {
  return new Set(s.split(" ").filter(Boolean));
}

/** Same words in a different order? */
export function sameTokens(a: string, b: string): boolean {
  const x = tokenSet(a), y = tokenSet(b);
  return x.size === y.size && [...x].every((t) => y.has(t));
}
