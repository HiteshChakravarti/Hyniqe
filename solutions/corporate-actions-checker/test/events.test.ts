import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkEvents, isinValid } from '../src/events.ts';
import { renderEventsReport } from '../src/report.ts';
import { generateNotices, isinWithCheck } from '../src/sample.ts';

const today = new Date(Date.UTC(2026, 10, 22));
const isin = isinWithCheck('GB000000001');
const base = { isin, event_type: 'DVCA', mandatory_voluntary: 'MAND', ex_date: '2026-12-03', record_date: '2026-12-04', pay_date: '2026-12-18', rate: '0.1250', currency: 'GBP' };

test('ISIN check digit', () => {
  assert.ok(isinValid('US0378331005'));
  assert.ok(!isinValid('US0378331006'));
});

test('agreeing sources with different formats are not flagged', () => {
  const r = checkEvents([{ ...base, source: 'A' }, { ...base, source: 'B', ex_date: '03/12/2026', rate: '0.125' }], { today });
  assert.equal(r.events.length, 1);
  assert.equal(r.events[0].status, 'agree');
  assert.equal(r.findings.length, 0);
});

test('a different rate and an impossible date order are flagged', () => {
  const r = checkEvents([{ ...base, source: 'A' }, { ...base, source: 'B', rate: '0.135', pay_date: '2026-12-01' }], { today });
  const codes = r.findings.map((f) => `${f.code}:${f.field}`);
  assert.ok(codes.includes('DISAGREE:rate'));
  assert.ok(codes.includes('DATE_ORDER:dates'));
  assert.match(renderEventsReport(r), /Corporate actions comparison/);
});

test('quarterly dividends on the same security stay separate events', () => {
  const r = checkEvents([{ ...base, source: 'A' }, { ...base, source: 'A', ex_date: '2027-03-04', record_date: '2027-03-05', pay_date: '2027-03-19' }], { today });
  assert.equal(r.events.length, 2);
});

test('voluntary event deadlines', () => {
  const tend = { ...base, event_type: 'TEND', mandatory_voluntary: 'VOLU', rate: '', currency: '' };
  assert.ok(checkEvents([{ ...tend, source: 'A' }], { today }).findings.some((f) => f.code === 'NO_DEADLINE'));
  assert.ok(checkEvents([{ ...tend, source: 'A', election_deadline: '2026-11-23' }], { today }).findings.some((f) => f.code === 'DEADLINE_SOON'));
  assert.ok(checkEvents([{ ...tend, source: 'A', election_deadline: '2026-12-10', market_deadline: '2026-12-08' }], { today }).findings.some((f) => f.code === 'DEADLINE_AFTER_MARKET'));
});

test('every injected problem is found on generated data', () => {
  const g = generateNotices({ seed: 21, events: 50 });
  const r = checkEvents(g.rows, { today });
  assert.equal(r.events.length, 50);
  for (const ev of r.events) {
    const fs = r.findings.filter((f) => f.eventKey === ev.key && f.severity !== 'info');
    assert.equal(fs.length > 0, g.labels.has(`${ev.isin}|${ev.eventType}`), ev.key);
  }
});
