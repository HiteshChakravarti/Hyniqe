// Writes growth/samples/*.md: a complete, readable record of two demo weeks for
// both demo companies, so anyone can see every output on GitHub without
// running anything.  Regenerate with:  npm run sample
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from '../src/core/store.ts';
import { seedDemo } from '../src/demo.ts';
import { startWeek } from '../src/core/orchestrator.ts';
import { autopilotWeek1, copilotWeek1 } from './demo-weeks.ts';
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
  const events1 = await autopilotWeek1(c);
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
  const events = await copilotWeek1(c);
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
