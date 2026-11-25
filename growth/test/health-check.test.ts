import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runHealthCheck, RULES } from '../src/checks/health-check.ts';
import { site } from './helpers.ts';

test('a weak site is "Leaking leads" and every failure has a fix and an owner agent', () => {
  const h = runHealthCheck({ url: 'https://cafe.example', html: site('chai-and-crumb.html') });
  assert.equal(h.verdict, 'Leaking leads');
  const failed = h.findings.filter((f) => !f.passed);
  assert.ok(failed.some((f) => f.id === 'cta'));
  assert.ok(failed.some((f) => f.id === 'title'));
  assert.ok(failed.some((f) => f.id === 'form-length'));
  for (const f of failed) {
    assert.ok(f.fix.length > 20);
    assert.ok(f.agent);
  }
});

test('a good site is "Healthy"', () => {
  const h = runHealthCheck({ url: 'https://ledgerly.example', html: site('ledgerly.html') });
  assert.equal(h.verdict, 'Healthy');
  assert.ok(h.score >= 80);
  assert.ok(h.findings.find((f) => f.id === 'cta')!.passed);
  assert.ok(h.findings.find((f) => f.id === 'analytics-tag')!.passed);
});

test('plain HTTP and no lead capture are critical', () => {
  const h = runHealthCheck({ url: 'http://x.example', html: '<html><title>A plumber in Leeds, open today</title><h1>Hi</h1></html>' });
  const crit = h.findings.filter((f) => !f.passed && f.severity === 'critical').map((f) => f.id);
  assert.deepEqual(crit.sort(), ['cta', 'https', 'lead-capture']);
});

test('every rule is evaluated', () => {
  const h = runHealthCheck({ url: 'https://a.example', html: '' });
  assert.equal(h.findings.length, RULES.length);
  assert.ok(h.findings.every((f) => f.evidence !== 'Not checked.'));
});
