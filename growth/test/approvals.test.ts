import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanCopy, scanTask } from '../src/checks/claims.ts';
import { route } from '../src/core/approvals.ts';
import type { Task } from '../src/core/types.ts';
import { demo } from './helpers.ts';

function task(p: Partial<Task>): Task {
  return { id: 't', week: 1, day: 'Mon', agent: 'social', title: 'x', channel: 'instagram', action: 'publish', body: 'hello', meta: {}, risk: 'medium', flags: [], status: 'pending_approval', approver: 'owner', approvalReason: '', comments: [], source: 'demo', createdAt: '', ...p };
}

test('content guard flags risky claims and banned phrases', () => {
  const c = demo('copilot');
  assert.ok(scanCopy('Guaranteed results, risk-free!', c.brand).length >= 2);
  assert.ok(scanCopy('We are the best in town', c.brand).length === 1);
  assert.ok(scanCopy('You will never chase an invoice again', c.brand).some((f) => f.includes('banned')));
  assert.equal(scanCopy('Send invoices and get paid faster.', c.brand).length, 0);
});

test('legal rules: emails need unsubscribe, outreach needs opt-out, ads stay in budget', () => {
  const c = demo('copilot');
  assert.ok(scanTask(task({ channel: 'email', action: 'send', body: 'Hi' }), c.brand, 100).some((f) => f.includes('unsubscribe')));
  assert.ok(scanTask(task({ channel: 'linkedin-dm', action: 'outreach', body: 'Hi' }), c.brand, 100).some((f) => f.includes('opt out')));
  assert.ok(scanTask(task({ channel: 'ads', action: 'spend', body: 'ad', meta: { budget: 500 } }), c.brand, 100).some((f) => f.includes('above the weekly limit')));
});

test('Autopilot: internal work is automatic, spend and flagged items need the owner', () => {
  const c = demo('autopilot');
  assert.equal(route(c, task({ action: 'internal', channel: 'internal' })).approver, 'auto');
  assert.equal(route(c, task({ action: 'publish' })).approver, 'auto'); // balanced
  assert.equal(route(c, task({ action: 'spend', channel: 'ads' })).approver, 'owner');
  assert.equal(route(c, task({ action: 'publish', flags: ['x'] })).approver, 'owner');
  c.trust = 'cautious';
  assert.equal(route(c, task({ action: 'publish' })).approver, 'owner');
  c.trust = 'hands-off';
  assert.equal(route(c, task({ action: 'send', channel: 'email' })).approver, 'auto');
  assert.equal(route(c, task({ action: 'outreach', channel: 'linkedin-dm' })).approver, 'owner');
});

test('Copilot: work goes to the teammate who owns that agent', () => {
  const c = demo('copilot');
  const jon = c.team.find((m) => m.reviews.includes('social'))!;
  const meera = c.team.find((m) => m.reviews.includes('sdr'))!;
  assert.equal(route(c, task({ agent: 'social' })).approver, jon.id);
  assert.equal(route(c, task({ agent: 'sdr', action: 'outreach' })).approver, meera.id);
  assert.equal(route(c, task({ agent: 'seo', action: 'internal', channel: 'internal' })).approver, 'auto');
});
