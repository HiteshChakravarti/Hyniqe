import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Engine, type Skill } from '../src/engine.ts';

function company(agents: { key: string; role: string; budget: number }[]) {
  const e = new Engine();
  e.createCompany({
    name: 'Test Co', mission: 'test', template: 'test',
    agents: agents.map((a) => ({ ...a, name: a.key, title: a.role })),
  });
  return e;
}

test('checkout is atomic: two agents never receive the same task', () => {
  const e = company([{ key: 'w1', role: 'worker', budget: 100 }, { key: 'w2', role: 'worker', budget: 100 }]);
  for (let i = 0; i < 7; i++) e.createTask({ kind: 'job', role: 'worker', title: `job ${i}`, createdBy: 'test' });
  const [a, b] = e.agents();
  const seen = new Set<string>();
  for (let i = 0; i < 10; i++) {
    for (const ag of [a, b]) {
      const t = e.checkout(ag);
      if (t) {
        assert.ok(!seen.has(t.id), 'task handed out twice');
        seen.add(t.id);
      }
    }
  }
  assert.equal(seen.size, 7);
});

test('budgets stop an agent and ask the board for more', async () => {
  const e = company([{ key: 'w', role: 'worker', budget: 10 }]);
  const skill: Skill = { role: 'worker', costPerTask: 4, handle: () => ({ ok: true }) };
  e.registerSkill(skill);
  for (let i = 0; i < 5; i++) e.createTask({ kind: 'job', role: 'worker', title: `job ${i}`, createdBy: 'test' });
  await e.runUntilIdle(20);
  const [w] = e.agents();
  assert.equal(w.status, 'out_of_budget');
  assert.equal(w.tasks_done, 2);
  assert.ok(w.spent <= w.budget);
  const [ap] = e.pendingApprovals();
  assert.equal(ap.kind, 'budget_increase');
  e.decide(ap.id, 'approved', 'board');
  await e.runUntilIdle(20);
  assert.equal(e.agents()[0].tasks_done, 5);
});

test('failed tasks are recorded, not lost', async () => {
  const e = company([{ key: 'w', role: 'worker', budget: 100 }]);
  e.registerSkill({ role: 'worker', costPerTask: 1, handle: () => { throw new Error('boom'); } });
  const id = e.createTask({ kind: 'job', role: 'worker', title: 'fails', createdBy: 'test' });
  await e.runUntilIdle(5);
  const t = e.task(id)!;
  assert.equal(t.status, 'failed');
  assert.equal(t.error, 'boom');
});

test('audit chain detects tampering', () => {
  const e = company([{ key: 'w', role: 'worker', budget: 100 }]);
  e.createTask({ kind: 'job', role: 'worker', title: 'x', createdBy: 'test' });
  assert.equal(e.verifyAudit().ok, true);
  e.db.prepare("UPDATE audit SET details = '{\"edited\":true}' WHERE seq = 2").run();
  const v = e.verifyAudit();
  assert.equal(v.ok, false);
  assert.equal(v.brokenAt, 2);
});

test('approvals cannot be decided twice', () => {
  const e = company([{ key: 'w', role: 'worker', budget: 100 }]);
  const id = e.requestApproval({ kind: 'x', subject: 's', requestedBy: 'test' });
  e.decide(id, 'approved', 'board');
  assert.throws(() => e.decide(id, 'rejected', 'board'), /already approved/);
});
