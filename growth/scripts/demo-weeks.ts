// The scripted demo weeks: what the people do in week 1 for each demo company.
// Shared by the samples (scripts/export-sample.ts) and the website's dashboard
// preview (scripts/build-site.ts), so both always show the same week.
import { closeWeek, decide, replyToLead, reviseTask, simulateLeads, startWeek } from '../src/core/orchestrator.ts';
import { AGENTS } from '../src/agents/index.ts';
import type { Company } from '../src/core/types.ts';

/** Chai & Crumb on Autopilot: the owner approves only what is risky. Returns what the people did. */
export async function autopilotWeek1(c: Company): Promise<string[]> {
  const events1: string[] = [];
  await startWeek(c);
  const w = () => c.tasks.filter((t) => t.week === c.week);
  const flagged = w().find((t) => t.flags.length);
  if (flagged) {
    events1.push(`The content guard flagged **${flagged.title}** (${flagged.flags.join('; ')}). ${c.owner.name} clicked *Ask ${AGENTS[flagged.agent].name} to fix*; the revised post passed the guard and went out automatically.`);
    await reviseTask(c, flagged.id, 'owner');
  }
  const tom = w().find((t) => t.title.includes('Tom'));
  if (tom) {
    await decide(c, tom.id, 'owner', 'reject', 'Too formal. Offer him a free chai next visit.');
    events1.push(`${c.owner.name} **rejected** the reply to Tom's 2★ review: "Too formal. Offer him a free chai next visit." This became a lesson in the brand brain.`);
  }
  for (const t of w().filter((x) => x.status === 'pending_approval' && x.agent !== 'web-cro')) {
    await decide(c, t.id, 'owner', 'approve');
    events1.push(`${c.owner.name} approved **${t.title}** → published.`);
  }
  events1.push(`The landing-page changes were left waiting (the owner wants to talk to her web developer first).`);
  const leads = simulateLeads(c);
  const autoReplied = leads.filter((l) => l.status === 'replied').length;
  for (const l of leads.filter((x) => x.grade === 'A')) replyToLead(c, l.id, 'owner');
  events1.push(`${leads.length} enquiries came in. ${autoReplied} got the auto-reply in a minute; ${c.owner.name} replied personally to the ${leads.filter((l) => l.grade === 'A').length} A-grade leads; the spam pitch was scored 0 and ignored.`);
  closeWeek(c);
  return events1;
}

/** Ledgerly on Copilot: each agent's work goes to the teammate who owns it. Returns what the people did. */
export async function copilotWeek1(c: Company): Promise<string[]> {
  const events: string[] = [];
  await startWeek(c);
  const w = () => c.tasks.filter((t) => t.week === c.week);
  const owner = (agent: string) => c.team.find((m) => m.reviews.includes(agent as never))!;
  const blog = w().find((t) => t.agent === 'content')!;
  await decide(c, blog.id, owner('content').id, 'approve');
  events.push(`${owner('content').name} (${owner('content').role}) approved the blog post → published.`);
  for (const t of w().filter((x) => x.agent === 'social' || x.agent === 'seo').filter((x) => x.status === 'pending_approval')) {
    await decide(c, t.id, owner('social').id, 'approve');
    events.push(`${owner('social').name} approved **${t.title}** → published.`);
  }
  const ad = w().find((t) => t.agent === 'ads')!;
  await decide(c, ad.id, owner('ads').id, 'approve');
  events.push(`${owner('ads').name} (${owner('ads').role}) approved the ${ad.meta.platform} campaign within the ${c.weeklyAdBudget} budget.`);
  const out = w().filter((t) => t.agent === 'sdr');
  if (out[0]) {
    await decide(c, out[0].id, owner('sdr').id, 'changes', 'Mention the Xero integration, it is what finance heads ask about.');
    events.push(`${owner('sdr').name} requested changes on the first outreach message: "Mention the Xero integration, it is what finance heads ask about."`);
  }
  if (out[1]) {
    await decide(c, out[1].id, owner('sdr').id, 'approve');
    events.push(`${owner('sdr').name} approved the second outreach message → sent.`);
  }
  events.push(`The newsletter and the lead sequence stayed in ${owner('email').name}'s queue for Monday.`);
  const leads = simulateLeads(c);
  const a = leads.find((l) => l.grade === 'A');
  if (a) replyToLead(c, a.id, owner('sdr').id);
  events.push(`${leads.length} leads came in and were routed to ${owner('sdr').name}; she replied to the A-grade demo request.`);
  closeWeek(c);
  return events;
}
