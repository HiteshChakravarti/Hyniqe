import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Engine } from '../src/engine.ts';
import { installPaymentDataOps, loadVendorMaster } from '../src/skills/payment-data-ops.ts';
import { allRecords } from '../src/records.ts';
import { metrics } from '../src/metrics.ts';
import { validateAtSource, allRules } from '../src/rules.ts';
import { suggestAddress } from '../src/llm.ts';
import { generate } from '../scripts/seed.ts';

test('the payment data team cleans a vendor master end to end', async () => {
  const e = new Engine();
  installPaymentDataOps(e);
  loadVendorMaster(e, generate(240));
  await e.runUntilIdle();

  const m = metrics(e);
  assert.equal(m.total, 240);
  assert.ok(m.qualityNow >= 80, `quality ${m.qualityNow}`);
  assert.ok(m.qualityNow > m.qualityBefore);
  assert.equal(m.inFlight, 0, 'every record reaches a final state');

  const pending = e.pendingApprovals();
  const reviewIds = new Set(pending.filter((a) => a.kind === 'record_review').map((a) => JSON.parse(a.payload).recordId));
  for (const r of allRecords(e)) {
    if (r.status === 'in_review') assert.ok(reviewIds.has(r.id), `${r.source_id} in review without a decision request`);
    if (r.status === 'repaired' || r.status === 'compliant') {
      assert.ok(r.address?.TwnNm && r.address?.Ctry, `${r.source_id} marked done without town/country`);
      assert.ok(r.evidence.length > 0, `${r.source_id} has no evidence`);
    }
  }
  assert.ok(pending.some((a) => a.kind === 'outreach_send'), 'outreach drafted for missing data');
  assert.ok(allRules(e).length >= 2, 'rule engineer proposed rules');
  assert.ok(e.verifyAudit().ok);
  const report = JSON.parse((e.db.prepare('SELECT report FROM companies').get() as { report: string }).report);
  assert.match(report.summary, /Compliance moved from/);
});

test('approved rules block bad vendors at onboarding', async () => {
  const e = new Engine();
  installPaymentDataOps(e);
  loadVendorMaster(e, generate(120));
  await e.runUntilIdle();
  for (const ap of e.pendingApprovals().filter((a) => a.kind === 'rule_activation')) e.decide(ap.id, 'approved', 'board');
  const bad = validateAtSource(e, { vendor_id: 'NEW-1', name: 'New Co', country: 'Deutschland' });
  assert.equal(bad.accepted, false);
  const good = validateAtSource(e, { vendor_id: 'NEW-2', name: 'New Co', town: 'Berlin', country: 'DE', postcode: '10117' });
  assert.equal(good.accepted, true, JSON.stringify(good.violations));
});

test('a human approval moves a record to repaired and is audited', async () => {
  const e = new Engine();
  installPaymentDataOps(e);
  loadVendorMaster(e, generate(120));
  await e.runUntilIdle();
  const ap = e.pendingApprovals().find((a) => a.kind === 'record_review')!;
  const { recordId } = JSON.parse(ap.payload);
  e.decide(ap.id, 'approved', 'priya', 'checked with vendor');
  const r = allRecords(e).find((x) => x.id === recordId)!;
  assert.ok(r.status === 'repaired' || r.status === 'compliant');
  assert.equal(r.resolved_by, 'human:priya');
  assert.ok(e.verifyAudit().ok);
});

test('Claude suggestions are parsed and capped below auto-accept', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  try {
    const fake = (async () =>
      new Response(JSON.stringify({ content: [{ type: 'text', text: '{"address":{"TwnNm":"Pune","Ctry":"IN"},"confidence":0.97,"reasoning":"PIN code"}' }] }), { status: 200 })) as typeof fetch;
    const s = await suggestAddress({ text: 'Plot 4, MIDC, 411057' }, fake);
    assert.equal(s?.address.TwnNm, 'Pune');
    assert.ok(s!.confidence < 0.8, 'AI output can never be auto-accepted');
  } finally {
    delete process.env.ANTHROPIC_API_KEY;
  }
});
