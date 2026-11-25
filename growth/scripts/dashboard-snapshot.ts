// A snapshot of the real dashboard after week 1 for both demo companies, for the
// website's "See the dashboard" preview. It runs the same scripted week as the
// samples (scripts/demo-weeks.ts) with the built-in demo writers, then keeps only
// what the preview shows: no ids, timestamps or hashes, so the output repeats exactly.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/core/store.ts';
import { seedDemo } from '../src/demo.ts';
import { personName } from '../src/core/team.ts';
import { AGENTS } from '../src/agents/index.ts';
import { MODES, TRUST } from '../src/core/modes.ts';
import { verifyAudit } from '../src/core/audit.ts';
import type { Company } from '../src/core/types.ts';
import { autopilotWeek1, copilotWeek1 } from './demo-weeks.ts';

const excerpt = (body: string, n = 320) => {
  const text = body.replace(/^#{1,3} /gm, '').replace(/\*\*/g, '').trim();
  return text.length > n ? text.slice(0, text.lastIndexOf(' ', n)) + ' …' : text;
};

function snapshot(c: Company, events: string[]) {
  const who = (id: string) => personName(c, id);
  const h = c.health!;
  const r = c.reports[0]!;
  const v = verifyAudit(c.audit);
  return {
    name: c.name,
    oneLiner: c.brand.oneLiner,
    website: c.website,
    owner: c.owner.name,
    mode: MODES[c.mode].label,
    modeHow: MODES[c.mode].howItWorks,
    trust: c.mode === 'autopilot' ? TRUST[c.trust].label : '',
    weeklyAdBudget: c.weeklyAdBudget,
    team: c.team.map((m) => ({ name: m.name, role: m.role, reviews: m.reviews.map((a) => AGENTS[a].name) })),
    health: {
      score: h.score,
      verdict: h.verdict,
      summary: h.summary,
      leaks: h.findings
        .filter((f) => !f.passed)
        .sort((a, b) => ['critical', 'warning', 'info'].indexOf(a.severity) - ['critical', 'warning', 'info'].indexOf(b.severity))
        .map((f) => ({ title: f.title, severity: f.severity, fix: f.fix, agent: AGENTS[f.agent].name })),
      passed: h.findings.filter((f) => f.passed).length,
    },
    plan: { goal: c.plan!.goal, focus: c.plan!.focus },
    tasks: c.tasks
      .filter((t) => t.week === 1)
      .map((t) => ({
        day: t.day,
        agent: AGENTS[t.agent].name,
        agentTitle: AGENTS[t.agent].title,
        title: t.title,
        channel: t.channel,
        risk: t.risk,
        status: t.status,
        flagged: Boolean(t.meta.flagged || t.flags.length),
        flags: t.flags,
        gate: t.approvalReason,
        approver: t.approver === 'auto' ? 'Auto' : who(t.approver),
        decidedBy: t.decidedBy ? who(t.decidedBy) : '',
        comments: t.comments.map((x) => ({ by: who(x.by), text: x.text })),
        excerpt: excerpt(t.body),
      })),
    leads: c.leads.map((l) => ({
      name: l.name,
      company: l.company,
      title: l.title,
      source: l.source,
      message: l.message,
      grade: l.grade,
      score: l.score,
      reasons: l.reasons,
      routeTo: who(l.routeTo),
      status: l.status,
      reply: l.firstResponseMinutes !== undefined ? `${l.firstResponseMinutes} min, ${l.repliedBy === 'auto' ? 'auto-reply' : `by ${who(l.repliedBy ?? 'owner')}`}` : l.score === 0 ? 'Ignored (spam)' : 'Not yet',
      replyDraft: l.replyDraft,
    })),
    report: { metrics: r.metrics, wins: r.wins, problems: r.problems, nextWeek: r.nextWeek },
    events,
    audit: { entries: c.audit.length, verified: v.ok },
  };
}

export type DashboardSnapshot = ReturnType<typeof snapshot>;

export async function dashboardSnapshot(): Promise<DashboardSnapshot[]> {
  const before = process.env.GROWTH_DEMO;
  process.env.GROWTH_DEMO = '1';
  const dir = mkdtempSync(join(tmpdir(), 'growth-site-'));
  try {
    const [cafe, saas] = seedDemo(new Store(dir));
    return [snapshot(cafe!, await autopilotWeek1(cafe!)), snapshot(saas!, await copilotWeek1(saas!))];
  } finally {
    rmSync(dir, { recursive: true, force: true });
    if (before === undefined) delete process.env.GROWTH_DEMO;
    else process.env.GROWTH_DEMO = before;
  }
}
