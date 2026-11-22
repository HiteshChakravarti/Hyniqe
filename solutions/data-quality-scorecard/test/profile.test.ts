import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectKind, profileColumn, scorecard } from '../src/profile.ts';
import { renderScorecard } from '../src/report.ts';
import { generateTable } from '../src/sample.ts';

test('column types are recognised from values', () => {
  assert.equal(detectKind('col1', ['DE89370400440532013000', 'FR1420041010050500013M02606']), 'iban');
  assert.equal(detectKind('ccy', ['EUR', 'USD', 'GBP']), 'currency');
  assert.equal(detectKind('when', ['2026-01-02', '2026-03-04', '2026-05-06']), 'date');
  assert.equal(detectKind('id', ['A1', 'A2', 'A3', 'A4', 'A5']), 'id');
  assert.equal(detectKind('comment', ['hello', 'world']), 'text');
});

test('validity uses check digits and real dates', () => {
  const c = profileColumn('settle_date', ['2026-02-28', '2026-02-30', '', '01/03/2026']);
  assert.equal(c.blank, 1);
  assert.equal(c.invalid, 1);
  assert.equal(c.inconsistent, 1);
});

test('every injected defect is counted exactly', () => {
  const g = generateTable({ seed: 71, rows: 300 });
  const s = scorecard(g.rows);
  for (const c of s.columns) {
    assert.equal(c.blank, g.truth.blank[c.name], `${c.name} blank`);
    assert.equal(c.invalid, g.truth.invalid[c.name], `${c.name} invalid`);
    assert.equal(c.inconsistent, g.truth.inconsistent[c.name], `${c.name} inconsistent`);
  }
  assert.equal(s.duplicateRows, g.truth.duplicateRows);
  assert.match(renderScorecard(s), /Data quality scorecard/);
});
