// Runs one full week for both demo companies in the terminal, no browser needed:
//   npm run demo
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/core/store.ts';
import { seedDemo } from '../src/demo.ts';
import { closeWeek, simulateLeads, startWeek } from '../src/core/orchestrator.ts';
import { personName } from '../src/core/team.ts';
import { AGENTS } from '../src/agents/index.ts';

const store = new Store(mkdtempSync(join(tmpdir(), 'growth-demo-')));
for (const c of seedDemo(store)) {
  console.log(`\n━━ ${c.name} · ${c.mode === 'autopilot' ? 'Autopilot (no marketing team)' : 'Copilot (has a marketing team)'}`);
  console.log(`Health check: ${c.health!.score}/100 · ${c.health!.verdict}`);
  const tasks = await startWeek(c);
  console.log(`Plan: ${c.plan!.goal}`);
  for (const t of tasks) {
    const who = t.approver === 'auto' ? 'auto' : `→ ${personName(c, t.approver)}`;
    console.log(`  ${t.day}  ${AGENTS[t.agent].name.padEnd(6)} ${t.status.replace('_', ' ').padEnd(17)} ${who.padEnd(26)} ${t.title}${t.flags.length ? `  ⚑ ${t.flags.join('; ')}` : ''}`);
  }
  for (const l of simulateLeads(c)) console.log(`  lead ${l.grade} (${l.score}) ${l.email.padEnd(28)} ${l.status === 'replied' ? 'auto-replied in 1 min' : `→ ${personName(c, l.routeTo)}`}`);
  closeWeek(c);
  console.log('\n' + c.reports.at(-1)!.body.split('\n').map((l) => '  ' + l).join('\n'));
}
