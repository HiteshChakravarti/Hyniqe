import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAddress } from '../src/address/parse.ts';
import { ibanValid, makeIban, ibanCountry, bicCountry } from '../src/address/iban.ts';
import { lookupCountry } from '../src/address/countries.ts';
import { toPstlAdrXml } from '../src/address/xml.ts';

const cases: { text: string; hint?: string; ctry?: string; town?: string; format: string; review?: boolean }[] = [
  { text: 'Unit 4, 12 Canary Wharf Road, London E14 5AB, United Kingdom', ctry: 'GB', town: 'London', format: 'structured' },
  { text: 'Hauptstrasse 15\n10115 Berlin\nGermany', ctry: 'DE', town: 'Berlin', format: 'structured' },
  { text: '15 rue de Rivoli 75001 Paris FR', ctry: 'FR', town: 'Paris', format: 'structured' },
  { text: '1 Raffles Place #20-61, Singapore 048616', ctry: 'SG', town: 'Singapore', format: 'structured' },
  { text: '350 Fifth Avenue, New York, NY 10118, USA', ctry: 'US', town: 'New York', format: 'structured' },
  { text: 'PO Box 1234 Dubai UAE', ctry: 'AE', town: 'Dubai', format: 'structured' },
  { text: 'Keizersgracht 123, 1015 CJ Amsterdam', ctry: 'NL', town: 'Amsterdam', format: 'structured' },
  { text: 'Plot 12, Hinjewadi Phase 2, Pune 411057', hint: 'IN', ctry: 'IN', town: 'Pune', format: 'hybrid' },
  { text: 'Level 3, 88 Phillip Street, Sydney NSW 2000, Australia', ctry: 'AU', town: 'Sydney', format: 'structured' },
  { text: '45 Victoria Road, London E14 5AB', ctry: 'GB', town: 'London', format: 'structured' },
  { text: '100 King Street W, London ON N6A 1A1', ctry: 'CA', town: 'London', format: 'structured' },
  { text: '12 rue de la République 75001 Paris', ctry: 'FR', town: 'Paris', format: 'structured', review: true },
  { text: '221 Elm Street, Springfield', ctry: 'US', town: 'Springfield', format: 'structured', review: true },
  { text: 'Main street 5', format: 'unresolved' },
];

for (const c of cases) {
  test(`parses: ${c.text.replace(/\n/g, ' / ')}`, () => {
    const r = parseAddress(c.text, { countryHint: c.hint ?? null });
    assert.equal(r.format, c.format);
    if (c.ctry) assert.equal(r.address.Ctry, c.ctry);
    if (c.town) assert.equal(r.address.TwnNm, c.town);
    assert.equal(r.issues.some((i) => i.severity === 'review'), !!c.review, JSON.stringify(r.issues));
    assert.ok(r.evidence.length > 0, 'every result carries evidence');
  });
}

test('unresolved addresses have zero confidence and blocking issues', () => {
  const r = parseAddress('Warehouse 3, Near Central Station');
  assert.equal(r.confidence, 0);
  assert.ok(r.issues.some((i) => i.code === 'MISSING_COUNTRY'));
});

test('stray letters never decide a country (AB in a UK postcode is not Alberta)', () => {
  assert.equal(parseAddress('9 Mill Lane, London SE1 2AB').address.Ctry, 'GB');
});

test('country lookup handles names, aliases, alpha-3 and rejects deprecated codes', () => {
  assert.equal(lookupCountry('Deutschland'), 'DE');
  assert.equal(lookupCountry('UK'), 'GB');
  assert.equal(lookupCountry('USA'), 'US');
  assert.equal(lookupCountry('United Kingdom'), 'GB');
  assert.equal(lookupCountry('IN', { allowAlpha2: true }), 'IN');
  assert.equal(lookupCountry('IN'), null);
});

test('IBAN checksum and country helpers', () => {
  assert.ok(ibanValid('GB82 WEST 1234 5698 7654 32'));
  assert.ok(!ibanValid('GB82 WEST 1234 5698 7654 33'));
  const built = makeIban('DE', '370400440532013000');
  assert.equal(built, 'DE89370400440532013000');
  assert.ok(ibanValid(built));
  assert.equal(ibanCountry(built), 'DE');
  assert.equal(bicCountry('DEUTDEFF'), 'DE');
  assert.equal(bicCountry('nope'), null);
});

test('renders a PstlAdr block with escaped values', () => {
  const xml = toPstlAdrXml({ StrtNm: 'Rue A & B', TwnNm: 'Paris', Ctry: 'FR', AdrLine: ['Bât <C>'] });
  assert.match(xml, /<StrtNm>Rue A &amp; B<\/StrtNm>/);
  assert.match(xml, /<AdrLine>Bât &lt;C&gt;<\/AdrLine>/);
  assert.ok(xml.indexOf('<TwnNm>') < xml.indexOf('<Ctry>'));
});
