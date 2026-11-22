// Small built-in gazetteer of commercial cities. Enough for the demo and for
// tests; in production this is swapped for a full GeoNames load or Swift's
// open-source address structuring model behind the same interface.

export interface City {
  name: string;
  country: string;
  /** Other countries with a well-known city of the same name. */
  alsoIn?: string[];
  aliases?: string[];
  /** Name is shared by many places inside the country; a state/region is needed. */
  needsRegion?: boolean;
  /** Where the entry came from. GeoNames names are broad, so they need corroboration. */
  source?: 'built-in' | 'geonames';
}

export const CITIES: City[] = [
  // United Kingdom & Ireland
  { name: 'London', country: 'GB', alsoIn: ['CA'] },
  { name: 'Manchester', country: 'GB', alsoIn: ['US'] },
  { name: 'Birmingham', country: 'GB', alsoIn: ['US'] },
  { name: 'Leeds', country: 'GB' }, { name: 'Glasgow', country: 'GB' },
  { name: 'Edinburgh', country: 'GB' }, { name: 'Bristol', country: 'GB' },
  { name: 'Liverpool', country: 'GB' }, { name: 'Cambridge', country: 'GB', alsoIn: ['US'] },
  { name: 'Dublin', country: 'IE', alsoIn: ['US'] }, { name: 'Cork', country: 'IE' },
  // Western Europe
  { name: 'Berlin', country: 'DE' }, { name: 'Hamburg', country: 'DE' },
  { name: 'Munich', country: 'DE', aliases: ['München', 'Muenchen'] },
  { name: 'Frankfurt am Main', country: 'DE', aliases: ['Frankfurt'] },
  { name: 'Cologne', country: 'DE', aliases: ['Köln', 'Koeln'] }, { name: 'Stuttgart', country: 'DE' },
  { name: 'Düsseldorf', country: 'DE', aliases: ['Dusseldorf', 'Duesseldorf'] },
  { name: 'Paris', country: 'FR', alsoIn: ['US'] }, { name: 'Lyon', country: 'FR' },
  { name: 'Marseille', country: 'FR' }, { name: 'Toulouse', country: 'FR' }, { name: 'Lille', country: 'FR' },
  { name: 'Amsterdam', country: 'NL' }, { name: 'Rotterdam', country: 'NL' },
  { name: 'The Hague', country: 'NL', aliases: ['Den Haag'] }, { name: 'Utrecht', country: 'NL' },
  { name: 'Eindhoven', country: 'NL' },
  { name: 'Brussels', country: 'BE', aliases: ['Bruxelles', 'Brussel'] }, { name: 'Antwerp', country: 'BE', aliases: ['Antwerpen'] },
  { name: 'Luxembourg', country: 'LU' },
  { name: 'Zurich', country: 'CH', aliases: ['Zürich'] }, { name: 'Geneva', country: 'CH', aliases: ['Genève', 'Geneve'] },
  { name: 'Basel', country: 'CH' },
  { name: 'Vienna', country: 'AT', alsoIn: ['US'], aliases: ['Wien'] },
  { name: 'Madrid', country: 'ES' }, { name: 'Barcelona', country: 'ES' },
  { name: 'Valencia', country: 'ES', alsoIn: ['VE'] }, { name: 'Lisbon', country: 'PT', aliases: ['Lisboa'] },
  { name: 'Porto', country: 'PT' }, { name: 'Milan', country: 'IT', aliases: ['Milano'] },
  { name: 'Rome', country: 'IT', alsoIn: ['US'], aliases: ['Roma'] }, { name: 'Turin', country: 'IT', aliases: ['Torino'] },
  // Nordics & CEE
  { name: 'Stockholm', country: 'SE' }, { name: 'Gothenburg', country: 'SE', aliases: ['Göteborg'] },
  { name: 'Oslo', country: 'NO' }, { name: 'Copenhagen', country: 'DK', aliases: ['København'] },
  { name: 'Helsinki', country: 'FI' }, { name: 'Warsaw', country: 'PL', aliases: ['Warszawa'] },
  { name: 'Krakow', country: 'PL', aliases: ['Kraków'] }, { name: 'Prague', country: 'CZ', aliases: ['Praha'] },
  { name: 'Budapest', country: 'HU' }, { name: 'Bucharest', country: 'RO' },
  // Americas
  { name: 'New York', country: 'US', aliases: ['New York City', 'NYC'] },
  { name: 'Chicago', country: 'US' }, { name: 'Boston', country: 'US' }, { name: 'San Francisco', country: 'US' },
  { name: 'Los Angeles', country: 'US' }, { name: 'Seattle', country: 'US' }, { name: 'Austin', country: 'US' },
  { name: 'Dallas', country: 'US' }, { name: 'Houston', country: 'US' }, { name: 'Miami', country: 'US' },
  { name: 'Atlanta', country: 'US' }, { name: 'Charlotte', country: 'US' }, { name: 'Newark', country: 'US', alsoIn: ['GB'] },
  { name: 'Springfield', country: 'US', needsRegion: true },
  { name: 'Toronto', country: 'CA' }, { name: 'Montreal', country: 'CA', aliases: ['Montréal'] },
  { name: 'Vancouver', country: 'CA', alsoIn: ['US'] }, { name: 'Calgary', country: 'CA' },
  { name: 'Mexico City', country: 'MX', aliases: ['Ciudad de México'] }, { name: 'Monterrey', country: 'MX' },
  { name: 'São Paulo', country: 'BR', aliases: ['Sao Paulo'] }, { name: 'Rio de Janeiro', country: 'BR' },
  { name: 'Buenos Aires', country: 'AR' }, { name: 'Santiago', country: 'CL', alsoIn: ['ES', 'DO'] },
  { name: 'Bogotá', country: 'CO', aliases: ['Bogota'] }, { name: 'Lima', country: 'PE', alsoIn: ['US'] },
  // Middle East & Africa
  { name: 'Dubai', country: 'AE' }, { name: 'Abu Dhabi', country: 'AE' }, { name: 'Sharjah', country: 'AE' },
  { name: 'Riyadh', country: 'SA' }, { name: 'Jeddah', country: 'SA' }, { name: 'Doha', country: 'QA' },
  { name: 'Manama', country: 'BH' }, { name: 'Muscat', country: 'OM' }, { name: 'Kuwait City', country: 'KW' },
  { name: 'Tel Aviv', country: 'IL' }, { name: 'Istanbul', country: 'TR' }, { name: 'Cairo', country: 'EG' },
  { name: 'Johannesburg', country: 'ZA' }, { name: 'Cape Town', country: 'ZA' }, { name: 'Lagos', country: 'NG' },
  { name: 'Nairobi', country: 'KE' }, { name: 'Casablanca', country: 'MA' },
  // Asia Pacific
  { name: 'Mumbai', country: 'IN', aliases: ['Bombay'] }, { name: 'New Delhi', country: 'IN', aliases: ['Delhi'] },
  { name: 'Bengaluru', country: 'IN', aliases: ['Bangalore'] }, { name: 'Pune', country: 'IN' },
  { name: 'Chennai', country: 'IN', aliases: ['Madras'] }, { name: 'Hyderabad', country: 'IN', alsoIn: ['PK'] },
  { name: 'Kolkata', country: 'IN', aliases: ['Calcutta'] }, { name: 'Gurugram', country: 'IN', aliases: ['Gurgaon'] },
  { name: 'Noida', country: 'IN' }, { name: 'Ahmedabad', country: 'IN' },
  { name: 'Karachi', country: 'PK' }, { name: 'Lahore', country: 'PK' }, { name: 'Dhaka', country: 'BD' },
  { name: 'Colombo', country: 'LK' },
  { name: 'Singapore', country: 'SG' }, { name: 'Kuala Lumpur', country: 'MY' }, { name: 'Bangkok', country: 'TH' },
  { name: 'Jakarta', country: 'ID' }, { name: 'Manila', country: 'PH' }, { name: 'Ho Chi Minh City', country: 'VN' },
  { name: 'Hanoi', country: 'VN' }, { name: 'Hong Kong', country: 'HK' }, { name: 'Shanghai', country: 'CN' },
  { name: 'Beijing', country: 'CN' }, { name: 'Shenzhen', country: 'CN' }, { name: 'Guangzhou', country: 'CN' },
  { name: 'Taipei', country: 'TW' }, { name: 'Seoul', country: 'KR' }, { name: 'Tokyo', country: 'JP' },
  { name: 'Osaka', country: 'JP' }, { name: 'Sydney', country: 'AU', alsoIn: ['CA'] },
  { name: 'Melbourne', country: 'AU', alsoIn: ['US'] }, { name: 'Brisbane', country: 'AU' },
  { name: 'Perth', country: 'AU', alsoIn: ['GB'] }, { name: 'Auckland', country: 'NZ' }, { name: 'Wellington', country: 'NZ' },
];

const INDEX = new Map<string, City>();
const BUILT_IN = new Set<string>();
for (const c of CITIES) {
  for (const k of [c.name, ...(c.aliases ?? [])]) {
    INDEX.set(norm(k), c);
    BUILT_IN.add(norm(k));
  }
}
let longestKey = 4;

export function norm(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function lookupCity(text: string): City | null {
  return INDEX.get(norm(text)) ?? null;
}

/** Find the longest known city name contained in `text` (word-bounded), by n-gram lookup. */
export function findCityIn(text: string): { city: City; match: string } | null {
  const words = norm(text).split(' ').filter(Boolean);
  for (let len = Math.min(longestKey, words.length); len >= 1; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      const key = words.slice(i, i + len).join(' ');
      const city = INDEX.get(key);
      if (city) return { city, match: key };
    }
  }
  return null;
}

export function gazetteerSize(): { names: number; builtIn: number } {
  return { names: INDEX.size, builtIn: BUILT_IN.size };
}

/**
 * Extend the gazetteer with a GeoNames cities file (e.g. cities15000.txt from
 * download.geonames.org). Built-in entries always win. A name is treated as
 * ambiguous across countries when another country has a place of that name
 * with at least `ambiguousPopulation` people, and as needing a state/region
 * when one country has several such places.
 */
export function loadGeoNames(tsv: string, opts: { minPopulation?: number; ambiguousPopulation?: number } = {}): number {
  const minPop = opts.minPopulation ?? 15000;
  const ambPop = opts.ambiguousPopulation ?? 100000;
  const byKey = new Map<string, { name: string; country: string; pop: number }[]>();
  for (const line of tsv.split('\n')) {
    if (!line) continue;
    const f = line.split('\t');
    if (f.length < 15) continue;
    const [name, ascii, country, pop] = [f[1], f[2], f[8], Number(f[14]) || 0];
    if (!name || !country || pop < minPop) continue;
    for (const k of new Set([norm(name), norm(ascii)])) {
      if (!k || BUILT_IN.has(k)) continue;
      const list = byKey.get(k) ?? [];
      list.push({ name, country, pop });
      byKey.set(k, list);
    }
  }
  let added = 0;
  for (const [key, list] of byKey) {
    list.sort((a, b) => b.pop - a.pop);
    const top = list[0];
    const otherCountries = [...new Set(list.filter((x) => x.country !== top.country && x.pop >= ambPop).map((x) => x.country))];
    const sameCountryBig = list.filter((x) => x.country === top.country && x.pop >= ambPop / 2).length;
    INDEX.set(key, {
      name: top.name,
      country: top.country,
      ...(otherCountries.length ? { alsoIn: otherCountries } : {}),
      ...(sameCountryBig > 1 ? { needsRegion: true } : {}),
      source: 'geonames',
    });
    longestKey = Math.max(longestKey, key.split(' ').length);
    added++;
  }
  return added;
}
