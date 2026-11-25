import type { AgentId, Company, Plan } from '../core/types.ts';
import { now } from '../core/util.ts';
import type { Agent } from './base.ts';
import { AREA } from '../core/approvals.ts';

export const marketingLead: Agent = {
  id: 'marketing-lead',
  name: 'Nova',
  title: 'Head of Marketing',
  replaces: 'Head of marketing / marketing strategist',
  does: 'Sets the week\'s goal from your targets, the health check and last week\'s results, then briefs every specialist.',
  async produce(ctx) {
    const p = ctx.company.plan;
    if (!p) return [];
    const body = [
      `## Week ${p.week} goal`,
      p.goal,
      '',
      '## Focus',
      ...p.focus.map((f) => `- ${f}`),
      '',
      '## Briefs',
      ...p.assignments.map((a) => `- **${AREA[a.agent]}**: ${a.brief}`),
    ].join('\n');
    return [{ day: 'Mon', title: `Week ${p.week} marketing plan`, channel: 'internal', action: 'internal', body, source: 'demo' }];
  },
};

/** The Marketing Lead's planning step: who works on what this week, and why. */
export function makePlan(c: Company): Plan {
  const week = c.week;
  const failed = (c.health?.findings ?? []).filter((f) => !f.passed);
  const critical = failed.filter((f) => f.severity === 'critical');
  const last = c.reports.at(-1);
  const goal = c.goals[0] ?? 'Grow qualified leads';

  const focus: string[] = [];
  if (critical.length) focus.push(`Fix ${critical.length} critical website leak${critical.length > 1 ? 's' : ''} found by the health check first.`);
  if (last?.nextWeek.length) focus.push(...last.nextWeek.slice(0, 2));
  focus.push(`Publish consistently on ${c.brand.channels.slice(0, 3).join(', ')}.`);
  focus.push('Reply to every new lead within 5 minutes.');

  const active: { agent: AgentId; brief: string }[] = [
    { agent: 'seo', brief: `Pick this week's keywords and fix on-page problems. Main keyword: ${c.brand.keywords[(week - 1) % Math.max(1, c.brand.keywords.length)] ?? c.industry}.` },
    { agent: 'content', brief: 'Write one blog post on the main keyword that answers a real customer question.' },
    { agent: 'social', brief: 'Three posts: one pain, one tip linking the blog, one offer.' },
    { agent: 'design', brief: 'Creative pack for the posts and ads.' },
    { agent: 'email', brief: 'Newsletter on the blog post, and keep the new-lead sequence running.' },
  ];
  if (c.weeklyAdBudget > 0) active.push({ agent: 'ads', brief: `One lead campaign within the ${c.weeklyAdBudget} weekly budget.` });
  if (c.template !== 'local-business') active.push({ agent: 'sdr', brief: 'Two personal first messages to ideal-customer accounts.' });
  if (failed.some((f) => f.agent === 'web-cro') || !c.health) active.push({ agent: 'web-cro', brief: 'Fix the website leaks from the health check.' });
  if (c.template === 'local-business' || c.brand.channels.includes('reviews')) active.push({ agent: 'reputation', brief: 'Reply to new reviews and ask happy customers for one.' });
  active.push({ agent: 'analytics', brief: 'Check tracking on Monday; write the Friday report.' });

  return { week, at: now(), goal, focus, assignments: active };
}
