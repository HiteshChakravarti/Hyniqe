// Corporate actions comparison report.
import { esc, reportPage } from '../../shared/html.ts';
import { typeName, type CheckResult } from './events.ts';

export function renderEventsReport(r: CheckResult, opts: { generatedAt?: Date } = {}): string {
  const disagree = r.events.filter((e) => e.status === 'disagree').length;
  const single = r.events.filter((e) => e.status === 'single source').length;
  const urgent = r.findings.filter((f) => f.code.startsWith('DEADLINE') || f.code === 'NO_DEADLINE');
  const rank: Record<string, number> = { error: 0, review: 1, info: 2 };
  const fs = [...r.findings].sort((a, b) => rank[a.severity] - rank[b.severity]);
  const body = `
<h2>Summary</h2>
<p>${r.notices} notices describe ${r.events.length} events. <b>${disagree} events have sources that disagree</b>, ${urgent.length} need attention because of an election deadline, and ${single} are reported by one source only.</p>
<div class="tiles"><div class="tile"><b>${r.events.length}</b><span>events</span></div><div class="tile"><b>${disagree}</b><span>sources disagree</span></div><div class="tile"><b>${urgent.length}</b><span>deadline issues</span></div><div class="tile"><b>${single}</b><span>single source</span></div></div>
<h2>Findings</h2>
<table><tr><th></th><th>Security</th><th>Event</th><th>Problem</th><th>What to do</th></tr>
${fs.map((f) => `<tr><td><span class="pill ${f.severity}">${f.severity}</span></td><td><code>${esc(f.isin)}</code></td><td>${esc(typeName(f.eventType))}</td><td>${esc(f.message)}</td><td>${esc(f.action)}</td></tr>`).join('') || '<tr><td colspan="5">No findings.</td></tr>'}</table>
<h2>How this was done</h2>
<p>Notices with the same ISIN and event type, and dates within a month of each other, are treated as one event. Dates, rates, currencies, ratios, options, the mandatory or voluntary flag and election deadlines are compared across sources, ignoring format differences such as 03/12/2026 against 2026-12-03 or "2 for 1" against "2:1". Each source's own dates are checked for an impossible order, and voluntary events are checked for a missing or close deadline.</p>`;
  return reportPage({ title: 'Corporate actions comparison', subtitle: 'Notices from several sources', body, generatedAt: opts.generatedAt });
}
