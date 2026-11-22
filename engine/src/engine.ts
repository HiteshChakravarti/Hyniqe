// The Hyniqe engine: a company of agents with an org chart, a task board with
// atomic checkout, per-agent budgets, heartbeats, human approvals and a
// hash-chained audit trail. Domain logic lives in skills (src/skills).

import { randomUUID } from 'node:crypto';
import { openDb, j, type DB } from './db.ts';
import { appendAudit, verifyAudit } from './audit.ts';

export interface AgentRow {
  id: string;
  company_id: string;
  name: string;
  title: string;
  role: string;
  reports_to: string | null;
  budget: number;
  spent: number;
  heartbeat_every: number;
  status: 'idle' | 'working' | 'out_of_budget' | 'paused';
  current_task: string | null;
  tasks_done: number;
  last_heartbeat: string | null;
}

export interface TaskRow {
  id: string;
  company_id: string;
  kind: string;
  role: string;
  title: string;
  payload: string;
  status: 'todo' | 'in_progress' | 'done' | 'failed';
  priority: number;
  assignee: string | null;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  result: string | null;
  error: string | null;
}

export interface ApprovalRow {
  id: string;
  company_id: string;
  kind: string;
  subject: string;
  payload: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  task_id: string | null;
  created_at: string;
  decided_by: string | null;
  decided_at: string | null;
  note: string | null;
}

export interface AgentDef {
  key: string;
  name: string;
  title: string;
  role: string;
  reportsTo?: string;
  budget: number;
  heartbeatEvery?: number;
}

export interface SkillContext {
  engine: Engine;
  agent: AgentRow;
  log(action: string, entity: string, entityId: string | null, details?: unknown): void;
  createTask(t: { kind: string; role: string; title: string; payload?: unknown; priority?: number; parentId?: string }): string;
  requestApproval(a: { kind: string; subject: string; payload?: unknown; taskId?: string }): string;
  /** Charge credits for extra work (e.g. an LLM call). Returns false if the budget is exhausted. */
  charge(credits: number, reason: string): boolean;
}

export interface Skill {
  role: string;
  /** Credits charged per completed task. */
  costPerTask: number;
  /** Max tasks one heartbeat may process. */
  perHeartbeat?: number;
  handle?(task: TaskRow, payload: any, ctx: SkillContext): Promise<unknown> | unknown;
  /** Managers run this on every heartbeat to plan and delegate work. */
  manage?(ctx: SkillContext): Promise<void> | void;
}

export type ApprovalHandler = (
  engine: Engine,
  approval: ApprovalRow,
  payload: any,
  decision: 'approved' | 'rejected',
  by: string,
) => void;

const now = () => new Date().toISOString();
const shortId = (prefix: string) => `${prefix}_${randomUUID().slice(0, 8)}`;

export class Engine {
  readonly db: DB;
  companyId = '';
  tickCount = 0;
  private skills = new Map<string, Skill>();
  private approvalHandlers = new Map<string, ApprovalHandler>();

  constructor(path = ':memory:') {
    this.db = openDb(path);
  }

  // ----- setup ---------------------------------------------------------

  registerSkill(skill: Skill): void {
    this.skills.set(skill.role, skill);
  }

  onApproval(kind: string, handler: ApprovalHandler): void {
    this.approvalHandlers.set(kind, handler);
  }

  createCompany(c: { name: string; mission: string; template: string; agents: AgentDef[] }): string {
    const id = shortId('co');
    this.companyId = id;
    this.db.prepare('INSERT INTO companies (id, name, mission, template, created_at) VALUES (?,?,?,?,?)').run(
      id, c.name, c.mission, c.template, now(),
    );
    this.audit('board', 'company.created', 'company', id, { name: c.name, mission: c.mission });
    const ids = new Map<string, string>();
    for (const a of c.agents) ids.set(a.key, shortId('ag'));
    for (const a of c.agents) {
      const agentId = ids.get(a.key)!;
      this.db.prepare(
        'INSERT INTO agents (id, company_id, name, title, role, reports_to, budget, heartbeat_every) VALUES (?,?,?,?,?,?,?,?)',
      ).run(agentId, id, a.name, a.title, a.role, a.reportsTo ? ids.get(a.reportsTo) ?? null : null, a.budget, a.heartbeatEvery ?? 1);
      this.audit('board', 'agent.hired', 'agent', agentId, { name: a.name, title: a.title, budget: a.budget });
    }
    return id;
  }

  // ----- queries -------------------------------------------------------

  agents(): AgentRow[] {
    return this.db.prepare('SELECT * FROM agents WHERE company_id = ? ORDER BY rowid').all(this.companyId) as unknown as AgentRow[];
  }

  agentByRole(role: string): AgentRow | undefined {
    return this.db.prepare('SELECT * FROM agents WHERE company_id = ? AND role = ? LIMIT 1').get(this.companyId, role) as unknown as AgentRow | undefined;
  }

  task(id: string): TaskRow | undefined {
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as TaskRow | undefined;
  }

  openTaskCount(kinds?: string[]): number {
    const rows = this.db.prepare(
      "SELECT kind, COUNT(*) n FROM tasks WHERE company_id = ? AND status IN ('todo','in_progress') GROUP BY kind",
    ).all(this.companyId) as { kind: string; n: number }[];
    return rows.filter((r) => !kinds || kinds.includes(r.kind)).reduce((s, r) => s + Number(r.n), 0);
  }

  taskCount(kind: string, status?: string): number {
    const row = status
      ? this.db.prepare('SELECT COUNT(*) n FROM tasks WHERE company_id = ? AND kind = ? AND status = ?').get(this.companyId, kind, status)
      : this.db.prepare('SELECT COUNT(*) n FROM tasks WHERE company_id = ? AND kind = ?').get(this.companyId, kind);
    return Number((row as { n: number }).n);
  }

  pendingApprovals(): ApprovalRow[] {
    return this.db.prepare("SELECT * FROM approvals WHERE company_id = ? AND status = 'pending' ORDER BY created_at").all(this.companyId) as unknown as ApprovalRow[];
  }

  // ----- task board ----------------------------------------------------

  createTask(t: { kind: string; role: string; title: string; payload?: unknown; priority?: number; parentId?: string; createdBy: string }): string {
    const id = shortId('tk');
    this.db.prepare(
      'INSERT INTO tasks (id, company_id, kind, role, title, payload, priority, parent_id, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ).run(id, this.companyId, t.kind, t.role, t.title, JSON.stringify(t.payload ?? {}), t.priority ?? 0, t.parentId ?? null, t.createdBy, now());
    this.audit(t.createdBy, 'task.created', 'task', id, { kind: t.kind, role: t.role, title: t.title });
    return id;
  }

  /**
   * Atomically claim the next task for a role. A single UPDATE ... RETURNING
   * means two agents can never check out the same task.
   */
  checkout(agent: AgentRow): TaskRow | undefined {
    const row = this.db.prepare(
      `UPDATE tasks SET status = 'in_progress', assignee = ?, started_at = ?
       WHERE id = (SELECT id FROM tasks WHERE company_id = ? AND role = ? AND status = 'todo'
                   ORDER BY priority DESC, created_at, rowid LIMIT 1)
       RETURNING *`,
    ).get(agent.id, now(), this.companyId, agent.role) as unknown as TaskRow | undefined;
    if (row) {
      this.db.prepare("UPDATE agents SET current_task = ?, status = 'working' WHERE id = ?").run(row.id, agent.id);
      this.audit(agent.name, 'task.checked_out', 'task', row.id, { kind: row.kind });
    }
    return row;
  }

  private finish(task: TaskRow, agent: AgentRow, ok: boolean, result: unknown, error?: string): void {
    this.db.prepare('UPDATE tasks SET status = ?, finished_at = ?, result = ?, error = ? WHERE id = ?').run(
      ok ? 'done' : 'failed', now(), JSON.stringify(result ?? null), error ?? null, task.id,
    );
    this.db.prepare('UPDATE agents SET current_task = NULL, tasks_done = tasks_done + ? WHERE id = ?').run(ok ? 1 : 0, agent.id);
    this.audit(agent.name, ok ? 'task.completed' : 'task.failed', 'task', task.id, ok ? { kind: task.kind, result } : { kind: task.kind, error });
  }

  // ----- budgets -------------------------------------------------------

  charge(agentId: string, credits: number, reason: string): boolean {
    const a = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as unknown as AgentRow;
    if (a.spent + credits > a.budget) {
      if (a.status !== 'out_of_budget') {
        this.db.prepare("UPDATE agents SET status = 'out_of_budget' WHERE id = ?").run(agentId);
        this.audit('engine', 'agent.budget_exhausted', 'agent', agentId, { spent: a.spent, budget: a.budget, needed: credits, reason });
        this.requestApproval({
          kind: 'budget_increase',
          subject: `${a.name} (${a.title}) has used ${a.spent} of ${a.budget} credits and is paused`,
          payload: { agentId, suggested: Math.max(credits * 50, Math.ceil(a.budget * 0.5)) },
          requestedBy: 'engine',
        });
      }
      return false;
    }
    this.db.prepare('UPDATE agents SET spent = spent + ? WHERE id = ?').run(credits, agentId);
    return true;
  }

  // ----- approvals -----------------------------------------------------

  requestApproval(a: { kind: string; subject: string; payload?: unknown; requestedBy: string; taskId?: string }): string {
    const id = shortId('ap');
    this.db.prepare(
      'INSERT INTO approvals (id, company_id, kind, subject, payload, requested_by, task_id, created_at) VALUES (?,?,?,?,?,?,?,?)',
    ).run(id, this.companyId, a.kind, a.subject, JSON.stringify(a.payload ?? {}), a.requestedBy, a.taskId ?? null, now());
    this.audit(a.requestedBy, 'approval.requested', 'approval', id, { kind: a.kind, subject: a.subject });
    return id;
  }

  decide(approvalId: string, decision: 'approved' | 'rejected', by: string, note?: string): ApprovalRow {
    const ap = this.db.prepare('SELECT * FROM approvals WHERE id = ?').get(approvalId) as unknown as ApprovalRow | undefined;
    if (!ap) throw new Error(`Approval ${approvalId} not found`);
    if (ap.status !== 'pending') throw new Error(`Approval ${approvalId} is already ${ap.status}`);
    this.db.prepare('UPDATE approvals SET status = ?, decided_by = ?, decided_at = ?, note = ? WHERE id = ?').run(
      decision, by, now(), note ?? null, approvalId,
    );
    this.audit(by, `approval.${decision}`, 'approval', approvalId, { kind: ap.kind, subject: ap.subject, note: note ?? null });
    const handler = this.approvalHandlers.get(ap.kind);
    if (handler) handler(this, ap, j(ap.payload, {}), decision, by);
    else if (ap.kind === 'budget_increase' && decision === 'approved') {
      const p = j<{ agentId: string; suggested: number }>(ap.payload, { agentId: '', suggested: 0 });
      this.db.prepare("UPDATE agents SET budget = budget + ?, status = 'idle' WHERE id = ?").run(p.suggested, p.agentId);
      this.audit(by, 'agent.budget_raised', 'agent', p.agentId, { added: p.suggested });
    }
    return { ...ap, status: decision, decided_by: by };
  }

  // ----- heartbeat -----------------------------------------------------

  private context(agent: AgentRow, task?: TaskRow): SkillContext {
    return {
      engine: this,
      agent,
      log: (action, entity, entityId, details) => this.audit(agent.name, action, entity, entityId, details),
      createTask: (t) => this.createTask({ ...t, parentId: t.parentId ?? task?.id, createdBy: agent.name }),
      requestApproval: (a) => this.requestApproval({ ...a, requestedBy: agent.name, taskId: a.taskId ?? task?.id }),
      charge: (credits, reason) => this.charge(agent.id, credits, reason),
    };
  }

  /** One heartbeat: every agent whose interval is due wakes up and works. */
  async tick(): Promise<number> {
    this.tickCount++;
    let worked = 0;
    for (const agent of this.agents()) {
      if (agent.status === 'out_of_budget' || agent.status === 'paused') continue;
      if (this.tickCount % agent.heartbeat_every !== 0) continue;
      const skill = this.skills.get(agent.role);
      if (!skill) continue;
      this.db.prepare('UPDATE agents SET last_heartbeat = ? WHERE id = ?').run(now(), agent.id);

      if (skill.manage) await skill.manage(this.context(agent));

      if (!skill.handle) continue;
      const limit = skill.perHeartbeat ?? 1;
      for (let i = 0; i < limit; i++) {
        const fresh = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(agent.id) as unknown as AgentRow;
        if (fresh.status === 'out_of_budget') break;
        if (fresh.spent + skill.costPerTask > fresh.budget) {
          this.charge(agent.id, skill.costPerTask, 'next task');
          break;
        }
        const task = this.checkout(fresh);
        if (!task) break;
        worked++;
        try {
          const result = await skill.handle(task, j(task.payload, {}), this.context(fresh, task));
          this.charge(agent.id, skill.costPerTask, `task ${task.kind}`);
          this.finish(task, fresh, true, result);
        } catch (err) {
          this.finish(task, fresh, false, null, err instanceof Error ? err.message : String(err));
        }
      }
      this.db.prepare("UPDATE agents SET status = CASE WHEN status = 'out_of_budget' THEN status ELSE 'idle' END WHERE id = ?").run(agent.id);
    }
    return worked;
  }

  /** Run heartbeats until nothing is left to do (or a safety limit). */
  async runUntilIdle(maxTicks = 500): Promise<number> {
    let idle = 0;
    for (let i = 0; i < maxTicks; i++) {
      const before = this.auditCount();
      const worked = await this.tick();
      idle = worked === 0 && this.auditCount() === before ? idle + 1 : 0;
      if (idle >= 3) return i + 1;
    }
    return maxTicks;
  }

  // ----- audit ---------------------------------------------------------

  audit(actor: string, action: string, entity: string, entityId: string | null, details?: unknown): void {
    appendAudit(this.db, { companyId: this.companyId, actor, action, entity, entityId, details });
  }

  auditCount(): number {
    return Number((this.db.prepare('SELECT COUNT(*) n FROM audit').get() as { n: number }).n);
  }

  verifyAudit() {
    return verifyAudit(this.db);
  }
}
