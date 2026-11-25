import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreLead } from '../src/leads/scoring.ts';
import { receiveLead, replyToLead } from '../src/core/orchestrator.ts';
import { demo } from './helpers.ts';

test('high-intent decision-maker with a company email is grade A, with reasons', () => {
  const s = scoreLead({ email: 'cfo@acme.com', company: 'Acme', title: 'CFO', source: 'demo-request', message: 'Can we see pricing and book a demo this week?' });
  assert.equal(s.grade, 'A');
  assert.ok(s.reasons.includes('asked about price'));
});

test('free email with no intent is grade C; spam scores 0', () => {
  assert.equal(scoreLead({ email: 'x@gmail.com', company: '', title: '', source: 'newsletter', message: 'hi' }).grade, 'C');
  assert.equal(scoreLead({ email: 'x@seo.biz', company: '', title: '', source: 'contact-form', message: 'We sell backlinks' }).score, 0);
});

test('Autopilot auto-replies to B/C leads at once, but A leads wait for a person', () => {
  const c = demo('autopilot');
  const a = receiveLead(c, { email: 'boss@corp.com', company: 'Corp', title: 'Founder', source: 'referral', message: 'Need a catering quote for 100 people this week' });
  const b = receiveLead(c, { email: 'someone@gmail.com', source: 'social', message: 'Are you open Sunday?' });
  assert.equal(a.status, 'new');
  assert.ok(a.replyDraft.includes('15-minute'));
  assert.equal(b.status, 'replied');
  assert.equal(b.firstResponseMinutes, 1);
  replyToLead(c, a.id, 'owner');
  assert.equal(a.status, 'replied');
  assert.throws(() => replyToLead(c, a.id, 'owner'));
});

test('Copilot routes leads to the sales owner; bad email is rejected', () => {
  const c = demo('copilot');
  const sales = c.team.find((m) => m.reviews.includes('sdr'))!;
  const l = receiveLead(c, { email: 'ops@firm.co', company: 'Firm', title: 'COO', source: 'demo-request', message: 'pricing?' });
  assert.equal(l.routeTo, sales.id);
  assert.equal(l.status, 'new');
  assert.throws(() => receiveLead(c, { email: 'not-an-email' }));
});
