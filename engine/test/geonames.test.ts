import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGeoNames, lookupCity } from '../src/address/gazetteer.ts';
import { parseAddress } from '../src/address/parse.ts';

// Rows in GeoNames cities15000 format (19 tab-separated columns; population is column 15).
const row = (id: number, name: string, country: string, pop: number) =>
  [id, name, name, '', '0', '0', 'P', 'PPL', country, '', '', '', '', '', pop, '', '0', 'UTC', '2024-01-01'].join('\t');

const TSV = [
  row(1, 'Brno', 'CZ', 380000),
  row(2, 'Valladolid', 'ES', 300000),
  row(3, 'Riverside', 'US', 314000),
  row(4, 'London', 'CA', 383000), // must not override the built-in London entry
  row(5, 'Tinytown', 'GB', 900), // below the population floor
].join('\n');

test('GeoNames rows extend the gazetteer without overriding built-in entries', () => {
  const added = loadGeoNames(TSV);
  assert.equal(added, 3);
  assert.equal(lookupCity('Brno')?.country, 'CZ');
  assert.equal(lookupCity('Brno')?.source, 'geonames');
  assert.equal(lookupCity('London')?.country, 'GB');
  assert.equal(lookupCity('Tinytown'), null);
});

test('a GeoNames town confirms an explicit country and is auto-safe', () => {
  const r = parseAddress('Masarykova 82, 602 00 Brno, Czechia');
  assert.equal(r.address.Ctry, 'CZ');
  assert.equal(r.address.TwnNm, 'Brno');
  assert.ok(!r.issues.some((i) => i.severity === 'review'), JSON.stringify(r.issues));
});

test('a country guessed only from a GeoNames town goes to a human', () => {
  const r = parseAddress('Unit 12, Riverside Business Park');
  assert.ok(r.issues.some((i) => i.severity === 'review' || i.severity === 'block'), JSON.stringify(r.issues));
});
