import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Engine } from '../src/engine.ts';
import { installPaymentDataOps, loadVendorMaster, decide } from '../src/skills/payment-data-ops.ts';
import { renderHealthCheck } from '../src/report/healthcheck.ts';
import { parseAddress } from '../src/address/parse.ts';
import { generate } from '../scripts/seed.ts';

test('the health check report covers findings, decisions, rules and the audit seal', async () => {
  const e = new Engine();
  installPaymentDataOps(e);
  loadVendorMaster(e, generate(120));
  await e.runUntilIdle();
  const html = renderHealthCheck(e, { client: 'Acme <Ltd>' });
  assert.match(html, /Payment Data Health Check/);
  assert.match(html, /Acme &lt;Ltd&gt;/, 'client name is escaped');
  for (const section of ['What we found', 'Readiness by country', 'Decisions for your team', 'Vendors missing information', 'recommended rules', 'Audit seal']) {
    assert.ok(html.includes(section), `missing section: ${section}`);
  }
  const head = (e.db.prepare('SELECT hash FROM audit ORDER BY seq DESC LIMIT 1').get() as { hash: string }).hash;
  assert.ok(html.includes(head), 'report carries the audit chain head hash');
});

test('the decision rule never auto-accepts unresolved or flagged addresses', () => {
  assert.equal(decide(parseAddress('Main street 5')), 'needs_data');
  assert.equal(decide(parseAddress('221 Elm Street, Springfield')), 'review');
  assert.equal(decide(parseAddress('Hauptstrasse 15, 10115 Berlin, Germany')), 'auto');
  assert.equal(decide(parseAddress('90 Colombo Street, Christchurch 8011')).toString() === 'auto' && parseAddress('90 Colombo Street, Christchurch 8011').address.TwnNm === 'Colombo', false, 'street names are never read as towns');
});

test('the benchmark runs end to end and meets its quality gate', () => {
  const out = mkdtempSync(join(tmpdir(), 'bench-'));
  const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', 'scripts/benchmark.ts', '--set', 'holdout', '--per-place', '4', '--out', out, '--min-precision', '0.95'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const result = JSON.parse(readFileSync(join(out, 'benchmark-holdout.json'), 'utf8'));
  assert.equal(result.overall.cases, 4 * 42);
  assert.ok(result.overall.autoPrecision >= 95);
});
