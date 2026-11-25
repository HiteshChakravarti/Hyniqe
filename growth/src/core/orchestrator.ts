// The weekly loop that makes this a marketing *department*, not a set of tools:
//
//   Monday   plan     the Marketing Lead sets the goal and briefs each agent
//   Mon-Fri  create   specialists write drafts
//            guard    every draft is scanned for risky claims and legal gaps
//            approve  the gate routes each draft: auto / owner / teammate
//            publish  approved work goes out through a connector
//   Friday   measure  the analyst writes the report
//            learn    the report's lessons go into the brand brain
//            replan   next Monday's plan starts from those lessons

import { readFileSync } from 'node:fs';
import type { AgentId, Company, HealthCheck, Lead, Mode, Task, Teammate, TrustLevel } from './types.ts';
import { AGENTS } from '../agents/index.ts';
import type { Draft } from '../agents/base.ts';
import { makePlan } from '../agents/marketing-lead.ts';
import { buildReport } from '../agents/analytics.ts';
import { scanTask } from '../checks/claims.ts';
import { connectorFor } from '../connectors/index.ts';
import { captureLead, markReplied, type LeadInput } from '../leads/capture.ts';
import { audit } from './audit.ts';
import { canDecide, riskOf, route, type Decision } from './approvals.ts';
import { brandFrom, loadTemplate, teamFrom } from './brand-brain.ts';
import { write } from './llm.ts';
import { id, now, seeded, slug } from './util.ts';
import type { BrandBrain } from './types.ts';

// ---------- onboarding ----------

export interface NewCompany {
  name: string;
  website: string;
  template: string;
  mode: Mode;
  trust?: TrustLevel;
  owner: { name: string; email?: string };
  weeklyAdBudget?: number;
  goals?: string[];
  brand?: Partial<BrandBrain>;
  team?: Omit<Teammate, 'id'>[];
}

export function createCompany(input: NewCompany): Company {
  if (!input.name?.trim()) throw new Error('Company name is required.');
  if (input.mode !== 'autopilot' && input.mode !== 'copilot') throw new Error('Mode must be autopilot or copilot.');
  const t = loadTemplate(input.template);
  const c: Company = {
    id: `${slug(input.name) || 'company'}-${id('c').slice(2, 7)}`,
    name: input.name.trim(),
    website: (input.website ?? '').trim(),
    industry: t.industry,
    template: t.id,
    mode: input.mode,
    trust: input.trust ?? t.trust,
    weeklyAdBudget: Math.max(0, Number(input.weeklyAdBudget ?? t.weeklyAdBudget) || 0),
    owner: { name: input.owner?.name?.trim() || 'Owner', ...(input.owner?.email ? { email: input.owner.email } : {}) },
    goals: input.goals?.length ? input.goals : [...t.goals],
    brand: brandFrom(t, input.brand),
    team: teamFrom(t, input.mode, input.team),
    week: 1,
    weekState: 'not_started',
    tasks: [],
    leads: [],
    reports: [],
    audit: [],
    createdAt: now(),
  };
  audit(c, 'owner', 'company.created', c.id, { template: t.id, mode: c.mode, trust: c.trust });
  return c;
}

export function setMode(c: Company, mode: Mode, by = 'owner'): void {
  if (mode !== 'autopilot' && mode !== 'copilot') throw new Error('Mode must be autopilot or copilot.');
  if (mode === 'copilot' && !c.team.length) c.team = teamFrom(loadTemplate(c.template), 'copilot');
  c.mode = mode;
  // Re-route open items under the new mode's rules.
  for (const t of c.tasks) {
    if (t.status === 'pending_approval' || t.status === 'changes_requested') {
      const r = route(c, t);
      t.approver = r.approver === 'auto' ? 'owner' : r.approver;
      t.approvalReason = r.reason;
    }
  }
  audit(c, by, 'mode.changed', c.id, { mode });
}

export function setTrust(c: Company, trust: TrustLevel, by = 'owner'): void {
  if (!['cautious', 'balanced', 'hands-off'].includes(trust)) throw new Error('Unknown trust level.');
  c.trust = trust;
  audit(c, by, 'trust.changed', c.id, { trust });
}

export function recordHealth(c: Company, h: HealthCheck, by = 'health-check'): void {
  c.health = h;
  audit(c, by, 'health.checked', h.url, { score: h.score, verdict: h.verdict });
}

// ---------- the week ----------

function toTask(c: Company, agent: AgentId, d: Draft): Task {
  const t: Task = {
    id: id('task'),
    week: c.week,
    day: d.day,
    agent,
    title: d.title,
    channel: d.channel,
    action: d.action,
    body: d.body,
    meta: d.meta ?? {},
    risk: 'low',
    flags: [],
    status: 'pending_approval',
    approver: 'owner',
    approvalReason: '',
    comments: [],
    source: d.source,
    createdAt: now(),
  };
  guardAndRoute(c, t);
  return t;
}

function guardAndRoute(c: Company, t: Task): void {
  t.flags = t.action === 'internal' ? [] : scanTask(t, c.brand, c.weeklyAdBudget);
  if (t.flags.length) t.meta.flagged = t.flags.length;
  t.risk = riskOf(t.action, t.flags);
  const r = route(c, t);
  t.approver = r.approver;
  t.approvalReason = r.reason;
  t.status = r.approver === 'auto' ? 'approved' : 'pending_approval';
}

async function publish(c: Company, t: Task, by: string): Promise<void> {
  if (t.status !== 'approved') throw new Error('Only approved work can be published.');
  if (t.action === 'internal') {
    t.status = 'done';
    audit(c, by, 'task.done', t.id, { title: t.title });
    return;
  }
  const k = connectorFor(t);
  const res = await k.publish(c, t);
  t.status = 'published';
  t.publishedAt = now();
  t.publishRef = res.ref;
  t.publishDryRun = res.dryRun;
  audit(c, k.id, 'task.published', t.id, { channel: t.channel, ref: res.ref, dryRun: res.dryRun });
}

/** Monday: plan, then every assigned agent drafts its work for the week. */
export async function startWeek(c: Company): Promise<Task[]> {
  if (c.weekState === 'running') throw new Error(`Week ${c.week} is already running. Close it first.`);
  if (c.weekState === 'closed') c.week += 1;
  c.plan = makePlan(c);
  c.weekState = 'running';
  audit(c, 'marketing-lead', 'week.planned', `week-${c.week}`, { goal: c.plan.goal, agents: c.plan.assignments.map((a) => a.agent) });

  const created: Task[] = [];
  const order: AgentId[] = ['marketing-lead', ...c.plan.assignments.map((a) => a.agent)];
  for (const agentId of order) {
    const agent = AGENTS[agentId];
    const brief = c.plan.assignments.find((a) => a.agent === agentId)?.brief ?? c.plan.goal;
    const drafts = await agent.produce({ company: c, week: c.week, brief, health: c.health, rand: seeded(`${c.id}:${c.week}:${agentId}`) });
    for (const d of drafts) {
      const t = toTask(c, agentId, d);
      c.tasks.push(t);
      created.push(t);
      audit(c, agentId, 'task.drafted', t.id, { title: t.title, risk: t.risk, approver: t.approver, flags: t.flags });
    }
  }
  for (const t of created) if (t.status === 'approved') await publish(c, t, 'auto');
  return created;
}

export async function decide(c: Company, taskId: string, by: string, decision: Decision, comment?: string): Promise<Task> {
  const t = c.tasks.find((x) => x.id === taskId);
  if (!t) throw new Error('No such task.');
  if (!canDecide(c, t, by)) throw new Error(t.status === 'pending_approval' ? 'You are not the reviewer for this item.' : `This item is already ${t.status.replace('_', ' ')}.`);
  if (comment?.trim()) t.comments.push({ by, text: comment.trim().slice(0, 2000), at: now() });
  t.decidedAt = now();
  t.decidedBy = by;
  if (decision === 'approve') {
    t.status = 'approved';
    audit(c, by, 'task.approved', t.id, { flagsAccepted: t.flags });
    await publish(c, t, by);
  } else if (decision === 'reject') {
    t.status = 'rejected';
    audit(c, by, 'task.rejected', t.id, { comment });
    if (comment?.trim()) c.brand.learnings.push({ week: c.week, note: `Rejected "${t.title}": ${comment.trim()}` });
  } else if (decision === 'changes') {
    t.status = 'changes_requested';
    audit(c, by, 'task.changes_requested', t.id, { comment });
  } else {
    throw new Error('Decision must be approve, reject or changes.');
  }
  return t;
}

/** A person edits the copy themselves; it goes back through the guard and gate. */
export async function editTask(c: Company, taskId: string, by: string, body: string): Promise<Task> {
  const t = c.tasks.find((x) => x.id === taskId);
  if (!t) throw new Error('No such task.');
  if (t.status === 'published' || t.status === 'done') throw new Error('This item has already gone out.');
  t.body = body.slice(0, 20000);
  guardAndRoute(c, t);
  audit(c, by, 'task.edited', t.id, { risk: t.risk, flags: t.flags });
  if (t.status === 'approved') await publish(c, t, 'auto');
  return t;
}

const SOFTEN: [RegExp, string][] = [
  [/voted us (the )?best in (the )?(town|city|area)/gi, 'keep coming back'],
  [/(voted us |we're |we are )?(the )?best in (the )?(town|city|world|market|industry)/gi, 'a local favourite'],
  [/\bguaranteed?\b/gi, 'designed to deliver'],
  [/\b(risk[- ]free|no risk)\b/gi, 'low-commitment'],
  [/\b(#1|number one)\b/gi, 'trusted'],
  [/\b100 ?%/gi, 'fully'],
];

/** Ask the agent that wrote it to fix it, using the reviewer's comments and the flags. */
export async function reviseTask(c: Company, taskId: string, by: string): Promise<Task> {
  const t = c.tasks.find((x) => x.id === taskId);
  if (!t) throw new Error('No such task.');
  if (t.status === 'published' || t.status === 'done') throw new Error('This item has already gone out.');
  const notes = [...t.flags, ...t.comments.map((x) => x.text)];
  const r = await write(
    `You are the ${AGENTS[t.agent].title} for ${c.name}. Revise your draft. Keep the voice: ${c.brand.voice}. Return only the revised copy.`,
    `Draft:\n${t.body}\n\nFix these points:\n- ${notes.join('\n- ') || 'tighten it'}`,
    () => {
      let b = t.body;
      for (const [re, to] of SOFTEN) b = b.replace(re, to);
      if (t.channel === 'email' && !/unsubscribe/i.test(b)) b += `\n\n—\nUnsubscribe any time: {{unsubscribe_link}}`;
      if (t.action === 'outreach' && !/stop/i.test(b)) b += `\n\nReply "stop" and I won't follow up.`;
      return b;
    },
  );
  t.body = r.text;
  t.source = r.source;
  guardAndRoute(c, t);
  audit(c, t.agent, 'task.revised', t.id, { requestedBy: by, flags: t.flags });
  if (t.status === 'approved') await publish(c, t, 'auto');
  return t;
}

export function reassign(c: Company, taskId: string, to: string, by: string): Task {
  const t = c.tasks.find((x) => x.id === taskId);
  if (!t) throw new Error('No such task.');
  if (to !== 'owner' && !c.team.some((m) => m.id === to)) throw new Error('No such teammate.');
  if (t.status !== 'pending_approval' && t.status !== 'changes_requested') throw new Error('Only open items can be reassigned.');
  t.approver = to;
  t.approvalReason = `Reassigned by ${by === 'owner' ? c.owner.name : (c.team.find((m) => m.id === by)?.name ?? by)}.`;
  audit(c, by, 'task.reassigned', t.id, { to });
  return t;
}

export function addComment(c: Company, taskId: string, by: string, text: string): Task {
  const t = c.tasks.find((x) => x.id === taskId);
  if (!t) throw new Error('No such task.');
  if (!text.trim()) throw new Error('Comment is empty.');
  t.comments.push({ by, text: text.trim().slice(0, 2000), at: now() });
  audit(c, by, 'task.commented', t.id);
  return t;
}

/** Friday: measure, write the report, feed lessons into the brand brain. */
export function closeWeek(c: Company): void {
  if (c.weekState !== 'running') throw new Error('There is no running week to close.');
  const report = buildReport(c, seeded(`${c.id}:report:${c.week}`));
  c.reports.push(report);
  for (const n of report.nextWeek.slice(0, 2)) c.brand.learnings.push({ week: c.week, note: n });
  c.brand.learnings = c.brand.learnings.slice(-20);
  c.weekState = 'closed';
  audit(c, 'analytics', 'week.closed', `week-${c.week}`, report.metrics);
}

// ---------- leads ----------

export function receiveLead(c: Company, input: LeadInput): Lead {
  const lead = captureLead(c, input);
  // Speed-to-lead: in Autopilot, B and C leads get the approved auto-reply at once
  // (unless the owner chose Cautious). A-grade leads always get a human.
  if (c.mode === 'autopilot' && c.trust !== 'cautious' && lead.grade !== 'A' && lead.score > 0) {
    markReplied(c, lead, 'auto', 1);
  }
  return lead;
}

export function replyToLead(c: Company, leadId: string, by: string): Lead {
  const l = c.leads.find((x) => x.id === leadId);
  if (!l) throw new Error('No such lead.');
  if (l.status !== 'new') throw new Error('This lead already has a reply.');
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(l.receivedAt)) / 60000));
  markReplied(c, l, by, minutes);
  return l;
}

const SAMPLE_LEADS: Record<string, LeadInput[]> = JSON.parse(readFileSync(new URL('../../data/demo/leads.json', import.meta.url), 'utf8'));

/** Demo only: simulate this week's inbound leads from sample enquiries. */
export function simulateLeads(c: Company): Lead[] {
  const pool = SAMPLE_LEADS[c.template] ?? SAMPLE_LEADS.saas!;
  const seen = new Set(c.leads.map((l) => l.email));
  return pool.map((p) => {
    const email = seen.has(p.email!.toLowerCase()) ? p.email!.replace('@', `+w${c.week}@`) : p.email!;
    return receiveLead(c, { ...p, email });
  });
}
