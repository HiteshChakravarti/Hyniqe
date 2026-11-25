import type { Company, WeekReport } from '../core/types.ts';
import { now } from '../core/util.ts';
import type { Agent } from './base.ts';

export const analytics: Agent = {
  id: 'analytics',
  name: 'Quinn',
  title: 'Marketing Analyst',
  replaces: 'Marketing analyst',
  does: 'Checks tracking works, measures every channel and writes the Friday report that feeds next week\'s plan.',
  async produce(ctx) {
    const tracked = ctx.health?.findings.find((f) => f.id === 'analytics-tag');
    const body = [
      '## Tracking check',
      tracked ? `- Website analytics: ${tracked.passed ? 'found' : 'MISSING. ' + tracked.fix}` : '- Website analytics: run a health check to verify.',
      '- Every link in this week\'s posts and emails gets UTM tags (utm_source, utm_medium=social|email|cpc, utm_campaign=week-' + ctx.week + ').',
      '- Lead form submissions are recorded as conversions.',
    ].join('\n');
    return [{ day: 'Mon', title: 'Tracking check and UTM plan', channel: 'internal', action: 'internal', body, source: 'demo' }];
  },
};

/**
 * Friday report. In the demo, channel numbers are simulated from what was
 * actually published this week (more and better-approved work → better
 * numbers); with the GA4 / ads connectors they come from real data.
 */
export function buildReport(c: Company, rand: () => number): WeekReport {
  const week = c.tasks.filter((t) => t.week === c.week);
  const published = week.filter((t) => t.status === 'published');
  const waiting = week.filter((t) => t.status === 'pending_approval' || t.status === 'changes_requested');
  const rejected = week.filter((t) => t.status === 'rejected');
  const flagged = week.filter((t) => t.flags.length || t.meta.flagged);
  const leads = c.leads.filter((l) => l.receivedAt >= (c.plan?.at ?? ''));
  const replied = leads.filter((l) => l.firstResponseMinutes !== undefined);
  const fast = replied.filter((l) => (l.firstResponseMinutes ?? 99) <= 5);

  const posts = published.filter((t) => t.action === 'publish').length;
  const visits = Math.round(180 + posts * (90 + rand() * 60) + (c.week - 1) * 40);
  const metrics: Record<string, number> = {
    'Published': published.length,
    'Waiting for approval': waiting.length,
    'Flagged by content guard': flagged.length,
    'Website visits': visits,
    'New leads': leads.length,
    'A-grade leads': leads.filter((l) => l.grade === 'A').length,
    'Replied within 5 min': fast.length,
    'Conversion rate %': visits ? Math.round((leads.length / visits) * 1000) / 10 : 0,
  };
  const spend = published.find((t) => t.action === 'spend');
  if (spend) {
    metrics['Ad spend'] = Number(spend.meta.budget ?? 0);
    metrics['Cost per lead'] = leads.length ? Math.round((metrics['Ad spend']! / Math.max(1, leads.length)) * 10) / 10 : 0;
  }

  const wins: string[] = [];
  const problems: string[] = [];
  const next: string[] = [];
  if (posts >= 3) wins.push(`Kept a steady rhythm: ${posts} pieces of content went live.`);
  const real = leads.filter((l) => l.score > 0);
  if (real.length && fast.length >= real.length) wins.push('Every lead got a reply within 5 minutes.');
  else if (real.length > fast.length) {
    problems.push(`${real.length - fast.length} lead(s) waited more than 5 minutes for a reply or have none yet.`);
    next.push('Reply to new leads within 5 minutes: it is the single biggest lever on conversion.');
  }
  if (leads.some((l) => l.grade === 'A')) wins.push(`${metrics['A-grade leads']} high-intent lead(s) came in. Follow up personally.`);
  if (waiting.length) {
    problems.push(`${waiting.length} item(s) are still waiting for approval, so they never went out.`);
    next.push('Clear the approvals inbox by Tuesday so the full plan ships.');
  }
  if (flagged.length) {
    problems.push(`The content guard flagged ${flagged.length} item(s) for risky claims.`);
    next.push('Keep claims factual: no "best", "#1" or guarantees without proof.');
  }
  if (rejected.length) problems.push(`${rejected.length} item(s) were rejected; the agents will learn from the comments.`);
  const openCritical = (c.health?.findings ?? []).filter((f) => !f.passed && f.severity === 'critical');
  if (openCritical.length) next.push(`Re-run the health check after the website fixes (${openCritical.length} critical issue(s) open).`);
  if (!leads.length) next.push('Add a lead magnet or a clearer call to action; no leads came in this week.');
  if (!next.length) next.push('Double down on the best-performing channel next week.');

  const body = [
    `# Friday report: week ${c.week}`,
    '',
    ...Object.entries(metrics).map(([k, v]) => `- ${k}: **${v}**`),
    '',
    '## What went well',
    ...(wins.length ? wins.map((w) => `- ${w}`) : ['- A quiet week. The foundations are in place.']),
    '',
    '## What got in the way',
    ...(problems.length ? problems.map((p) => `- ${p}`) : ['- Nothing blocked the plan.']),
    '',
    '## Next week',
    ...next.map((n) => `- ${n}`),
  ].join('\n');

  return { week: c.week, at: now(), metrics, wins, problems, nextWeek: next, body };
}
