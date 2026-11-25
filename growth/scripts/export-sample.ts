// Writes growth/samples/*.md: a complete, readable record of two demo weeks for
// both demo companies, so anyone can see every output on GitHub without
// running anything.  Regenerate with:  npm run sample
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from '../src/core/store.ts';
import { seedDemo } from '../src/demo.ts';
import { closeWeek, decide, replyToLead, reviseTask, simulateLeads, startWeek } from '../src/core/orchestrator.ts';
import { personName } from '../src/core/team.ts';
import { AGENTS } from '../src/agents/index.ts';
import { MODES, TRUST } from '../src/core/modes.ts';
import { verifyAudit } from '../src/core/audit.ts';
import type { Company, Task } from '../src/core/types.ts';

process.env.GROWTH_DEMO = '1';
const OUT = fileURLToPath(new URL('../samples/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const st = (s: string) => s.replace('_', ' ');

function healthSection(c: Company): string {
  const h = c.health!;
  const rows = [...h.findings]
    .sort((a, b) => Number(a.passed) - Number(b.passed) || ['critical', 'warning', 'info'].indexOf(a.severity) - ['critical', 'warning', 'info'].indexOf(b.severity))
    .map((f) => `| ${f.passed ? '✅' : f.severity === 'critical' ? '🔴' : f.severity === 'warning' ? '🟠' : '⚪'} | ${f.title} | ${esc(f.evidence)} | ${f.passed ? '' : esc(f.fix)} | ${f.passed ? '' : AGENTS[f.agent].name} |`);
  return [
    `## 1. Marketing health check`,
    '',
    `**${h.verdict} · ${h.score}/100.** ${h.summary}`,
    '',
    '| | Check | What we found | Fix | Fixed by |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

function draftBlock(c: Company, t: Task): string {
  const who = t.decidedBy ? `Decided by: ${personName(c, t.decidedBy)}` : t.approver === 'auto' ? 'Decided by: auto' : `Waiting for: ${personName(c, t.approver)}`;
  return [
    `<details><summary><b>${t.day} · ${AGENTS[t.agent].name} (${AGENTS[t.agent].title})</b>: ${t.title} · <i>${st(t.status)}</i>${t.meta.flagged ? ' · ⚑ was flagged' : ''}</summary>`,
    '',
    `- Channel: \`${t.channel}\` · Action: \`${t.action}\` · Risk: **${t.risk}**`,
    `- Gate: ${t.approvalReason}`,
    `- ${who}${t.publishRef ? ` · Published as \`${t.publishRef}\`${t.publishDryRun ? ' (dry run)' : ''}` : ''}`,
    ...t.comments.map((x) => `- Comment from ${personName(c, x.by)}: "${x.text}"`),
    '',
    t.body.replace(/^#{1,3} (.*)$/gm, '**$1**'),
    '',
    '</details>',
  ].join('\n');
}

function weekSection(c: Company, week: number, title: string, events: string[], drafts = true): string {
  const tasks = c.tasks.filter((t) => t.week === week);
  const plan = c.plan!.week === week ? c.plan! : undefined;
  return [
    `## ${title}`,
    '',
    plan ? [`**Goal:** ${plan.goal}`, '', '**Focus:**', ...plan.focus.map((f) => `- ${f}`), '', '**Briefs:**', ...plan.assignments.map((a) => `- **${AGENTS[a.agent].name}** (${AGENTS[a.agent].title}): ${a.brief}`)].join('\n') : '',
    '',
    '### Everything the agents produced',
    '',
    '| Day | Agent | Item | Risk | Gate sent it to | Status |',
    '|---|---|---|---|---|---|',
    ...tasks.map((t) => `| ${t.day} | ${AGENTS[t.agent].name} | ${esc(t.title)}${t.meta.flagged ? ' ⚑' : ''} | ${t.risk} | ${t.approver === 'auto' ? 'auto' : personName(c, t.approver)} | ${st(t.status)} |`),
    '',
    events.length ? [drafts ? '### What the people did' : '### What changed', '', ...events.map((e) => `- ${e}`)].join('\n') : '',
    '',
    drafts ? '### Full drafts (click to open)' : '_Week 2 drafts follow the same pattern; run `npm run sample` or the dashboard to see them._',
    '',
    ...(drafts ? tasks.map((t) => draftBlock(c, t)) : []),
  ].join('\n');
}

function leadsSection(c: Company): string {
  return [
    '## Leads',
    '',
    '| Lead | Grade | Why | Routed to | First reply |',
    '|---|---|---|---|---|',
    ...c.leads.map((l) => `| ${esc(l.name || l.email)}${l.company ? `, ${esc(l.company)}` : ''}: "${esc(l.message)}" | **${l.grade}** (${l.score}) | ${esc(l.reasons.join(', '))} | ${personName(c, l.routeTo)} | ${l.firstResponseMinutes !== undefined ? `${l.firstResponseMinutes} min, ${l.repliedBy === 'auto' ? 'auto-reply' : `by ${personName(c, l.repliedBy ?? 'owner')}`}` : l.score === 0 ? 'ignored (spam)' : 'not yet'} |`),
    '',
    ...c.leads.filter((l) => l.score > 0).slice(0, 2).map((l) => `<details><summary>Reply drafted for ${l.name} (grade ${l.grade})</summary>\n\n\`\`\`\n${l.replyDraft}\n\`\`\`\n</details>`),
  ].join('\n');
}

async function runAutopilot(c: Company) {
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
  const week1 = weekSection(c, 1, '2. Week 1: plan, drafts and approvals', events1);
  const report1 = c.reports[0]!.body.replace(/^# /, '## 3. ');
  await startWeek(c);
  const week2 = weekSection(c, 2, '4. Week 2: the plan learns from week 1', [
    'The Friday report\'s lessons are now in the plan\'s focus list and in the brand brain, including Anika\'s comment on Tom\'s review.',
    'With `ANTHROPIC_API_KEY` set, those lessons go into every agent\'s instructions. The offline demo writer does not learn, so it wrote "best in town" again, and the content guard caught it again and sent it to Anika.',
  ], false);
  return [week1, leadsSection(c), report1, week2];
}

async function runCopilot(c: Company) {
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
  return [weekSection(c, 1, '2. Week 1: plan, drafts and team reviews', events), leadsSection(c), c.reports[0]!.body.replace(/^# /, '## 3. ')];
}

function header(c: Company): string {
  const m = MODES[c.mode];
  return [
    `# ${c.name}: ${m.label} (${m.forWho.toLowerCase()})`,
    '',
    `> Sample output from Hyniqe Growth, generated by \`npm run sample\` with the built-in demo writers (no API key). With \`ANTHROPIC_API_KEY\` set, Claude writes the copy instead. Publishing is dry-run. [Back to all samples](README.md)`,
    '',
    `**What it does:** ${c.brand.oneLiner}  `,
    `**Website:** ${c.website} · **Template:** ${c.template} · **Weekly ad budget:** ${c.weeklyAdBudget}  `,
    `**Mode:** ${m.label}. ${m.howItWorks}${c.mode === 'autopilot' ? `  \n**Trust level:** ${TRUST[c.trust].label}. ${TRUST[c.trust].description}` : ''}`,
    c.team.length ? `\n**Team:** ${c.team.map((t) => `${t.name} (${t.role}: reviews ${t.reviews.map((a) => AGENTS[a].name).join(', ')})`).join('; ')}` : '',
  ].join('\n');
}

const store = new Store(mkdtempSync(join(tmpdir(), 'growth-sample-')));
const [cafe, saas] = seedDemo(store);
const files: [string, Company, string[]][] = [
  ['chai-and-crumb-autopilot.md', cafe!, await runAutopilot(cafe!)],
  ['ledgerly-copilot.md', saas!, await runCopilot(saas!)],
];
for (const [name, c, sections] of files) {
  const v = verifyAudit(c.audit);
  const log = c.audit.slice(-12).map((e) => `| ${e.seq} | ${e.actor.startsWith('tm_') ? personName(c, e.actor) : e.actor} | ${e.action} | \`${e.hash.slice(0, 12)}…\` |`);
  const logTable = [`## Activity log (last 12 of ${c.audit.length} entries, chain ${v.ok ? 'verified ✅' : 'BROKEN'})`, '', '| # | Who | What | Hash |', '|---|---|---|---|', ...log].join('\n');
  const body = [header(c), healthSection(c), ...sections, logTable, ''].join('\n\n');
  writeFileSync(join(OUT, name), body.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
  console.log(`wrote samples/${name}`);
}

writeFileSync(
  join(OUT, 'README.md'),
  `# Hyniqe Growth: sample output

Everything the AI marketing department produced in demo weeks for two companies, so you can check every output without running anything. Regenerate with \`npm run sample\`.

| Sample | Mode | What to look at |
|---|---|---|
| [Chai & Crumb](chai-and-crumb-autopilot.md), a café in Pune | **Autopilot**: no marketing team | Health check of a weak website (24/100), the content guard catching "best in town", the owner approving only risky items, auto-replies to leads, the Friday report, and **week 2's plan changing because of week 1** |
| [Ledgerly](ledgerly-copilot.md), a B2B SaaS | **Copilot**: 3-person marketing team | Each agent's work routed to the teammate who owns it, review decisions (approve, request changes), outreach drafts, lead routing to sales |

Each sample contains: the health check with every finding and fix, the Marketing Lead's plan and briefs, every draft in full (blog, SEO brief and FAQ, social posts, creative pack, ad campaign, newsletter and lead sequence, outreach, landing-page fixes, review replies, tracking plan), every approval decision, scored leads with reply drafts, the Friday report, and the hash-chained activity log.

Back to [Hyniqe Growth](../README.md).
`,
);
console.log('wrote samples/README.md');
