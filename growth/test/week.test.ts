import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { closeWeek, decide, editTask, reassign, reviseTask, setMode, simulateLeads, startWeek } from '../src/core/orchestrator.ts';
import { verifyAudit } from '../src/core/audit.ts';
import { Store } from '../src/core/store.ts';
import { seedDemo } from '../src/demo.ts';
import { demo } from './helpers.ts';

test('a full Autopilot week: plan → drafts → guard → gate → publish → report → learn', async () => {
  const c = demo('autopilot');
  const tasks = await startWeek(c);
  assert.ok(c.plan);
  const agents = new Set(tasks.map((t) => t.agent));
  for (const a of ['marketing-lead', 'seo', 'content', 'social', 'design', 'email', 'analytics', 'ads', 'web-cro', 'reputation']) assert.ok(agents.has(a as never), `missing ${a}`);
  assert.ok(!agents.has('sdr'), 'local businesses get no cold outreach');
  // Nothing un-approved went out.
  for (const t of tasks) if (t.status === 'published') assert.equal(t.approver, 'auto');
  assert.ok(tasks.filter((t) => t.status === 'published').every((t) => t.publishDryRun && t.publishRef));
  // The flagged social post waits for the owner; the agent can fix it.
  const flagged = tasks.find((t) => t.flags.length)!;
  assert.equal(flagged.status, 'pending_approval');
  await reviseTask(c, flagged.id, 'owner');
  assert.equal(flagged.flags.length, 0);
  // The owner approves the ad: it publishes.
  const ad = tasks.find((t) => t.action === 'spend')!;
  await decide(c, ad.id, 'owner', 'approve');
  assert.equal(ad.status, 'published');
  // A rejection with a reason becomes a learning.
  const rv = tasks.find((t) => t.agent === 'reputation' && t.status === 'pending_approval')!;
  await decide(c, rv.id, 'owner', 'reject', 'Too formal, sound like Anika');
  assert.ok(c.brand.learnings.some((l) => l.note.includes('Too formal')));
  await assert.rejects(decide(c, rv.id, 'owner', 'approve'));

  simulateLeads(c);
  closeWeek(c);
  const r = c.reports[0]!;
  assert.equal(r.metrics['New leads'], 4);
  assert.ok(r.nextWeek.length);
  // Next week starts from the lessons.
  await startWeek(c);
  assert.equal(c.week, 2);
  assert.ok(c.plan!.focus.some((f) => r.nextWeek.includes(f)));
  assert.ok(verifyAudit(c.audit).ok);
});

test('Copilot: only the reviewer (or the owner) can decide; reassign and edit work', async () => {
  const c = demo('copilot');
  const tasks = await startWeek(c);
  const blog = tasks.find((t) => t.agent === 'content')!;
  const jon = c.team.find((m) => m.reviews.includes('content'))!;
  const meera = c.team.find((m) => m.reviews.includes('sdr'))!;
  assert.equal(blog.approver, jon.id);
  await assert.rejects(decide(c, blog.id, meera.id, 'approve'), /not the reviewer/);
  reassign(c, blog.id, meera.id, jon.id);
  await decide(c, blog.id, meera.id, 'changes', 'Shorter intro');
  assert.equal(blog.status, 'changes_requested');
  await editTask(c, blog.id, meera.id, 'This is our guaranteed #1 method');
  assert.ok(blog.flags.length >= 2);
  assert.equal(blog.risk, 'high');
  await editTask(c, blog.id, meera.id, 'A short, factual guide.');
  assert.equal(blog.flags.length, 0);
  await decide(c, blog.id, 'owner', 'approve');
  assert.equal(blog.status, 'published');
  assert.ok(verifyAudit(c.audit).ok);
});

test('switching mode re-routes open work; the audit log detects tampering', async () => {
  const c = demo('copilot');
  await startWeek(c);
  setMode(c, 'autopilot');
  for (const t of c.tasks.filter((t) => t.status === 'pending_approval')) assert.equal(t.approver, 'owner');
  assert.ok(verifyAudit(c.audit).ok);
  c.audit[2]!.details = '{"edited":true}';
  assert.equal(verifyAudit(c.audit).ok, false);
});

test('store round-trips the demo companies', () => {
  const s = new Store(mkdtempSync(join(tmpdir(), 'growth-')));
  const seeded = seedDemo(s);
  assert.equal(seeded.length, 2);
  const again = new Store(s.dir);
  assert.deepEqual(again.list().map((c) => c.name).sort(), ['Chai & Crumb', 'Ledgerly']);
});
