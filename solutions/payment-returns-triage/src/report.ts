// Returns and rejects triage report.
import { esc, reportPage } from '../../shared/html.ts';
import type { TriageResult } from './triage.ts';

const amounts = (a: Record<string, number>): string => Object.entries(a).map(([c, v]) => `${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`).join(', ') || '';

export function renderTriageReport(r: TriageResult, opts: { generatedAt?: Date } = {}): string {
  const total: Record<string, number> = {};
  for (const g of r.groups) for (const [c, v] of Object.entries(g.amounts)) total[c] = (total[c] ?? 0) + v;
  const body = `
<h2>Summary</h2>
<p>${esc(r.format)}. ${r.total} payments, <b>${r.items.length} rejected or returned</b>${amounts(total) ? ` (${amounts(total)})` : ''}, ${r.accepted} accepted, ${r.pending} pending.${r.fileLevel.length ? ` ${r.fileLevel.length} rejections apply to a whole file or batch.` : ''}</p>
<div class="tiles"><div class="tile"><b>${r.items.length}</b><span>returned or rejected</span></div><div class="tile"><b>${r.groups.length}</b><span>root causes</span></div><div class="tile"><b>${r.repeats.length}</b><span>beneficiaries hit more than once</span></div></div>
<h2>By root cause</h2>
<table><tr><th>Root cause</th><th>Payments</th><th>Amount</th><th>Codes</th><th>Who acts</th><th>What to do</th></tr>
${r.groups.map((g) => `<tr><td><b>${esc(g.group)}</b></td><td>${g.count}</td><td>${esc(amounts(g.amounts))}</td><td>${g.codes.map((c) => `<code>${esc(c)}</code>`).join(' ')}</td><td>${esc(g.who.join(', '))}</td><td>${esc(g.fix)}</td></tr>`).join('') || '<tr><td colspan="6">Nothing was rejected or returned.</td></tr>'}</table>
${r.repeats.length ? `<h2>Beneficiaries returned more than once</h2><p>Fix these records in the vendor master first; they will keep failing.</p><table><tr><th>Beneficiary</th><th>Account</th><th>Times</th><th>Codes</th></tr>${r.repeats.map((x) => `<tr><td>${esc(x.name)}</td><td><code>${esc(x.key)}</code></td><td>${x.count}</td><td>${x.codes.map((c) => `<code>${esc(c)}</code>`).join(' ')}</td></tr>`).join('')}</table>` : ''}
<h2>Every payment</h2>
<table><tr><th>Reference</th><th>Beneficiary</th><th>Amount</th><th>Code</th><th>What it means</th><th>What to do</th></tr>
${[...r.fileLevel, ...r.items].map((i) => `<tr><td><code>${esc(i.ref)}</code></td><td>${esc(i.name)}</td><td>${i.amount === null ? '' : `${i.amount.toFixed(2)} ${esc(i.currency)}`}</td><td><code>${esc(i.code)}</code></td><td>${esc(i.meaning)}${i.info ? `<br><small>${esc(i.info)}</small>` : ''}</td><td>${esc(i.fix)}</td></tr>`).join('')}</table>`;
  return reportPage({ title: 'Returned and rejected payments', subtitle: r.format, body, generatedAt: opts.generatedAt });
}
