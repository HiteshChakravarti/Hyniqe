// Payment Data Repair report for the website and CLI (the engine has a fuller, audited Health Check).

import { esc, pct, reportPage } from '../../shared/html.ts';
import { addressLine, type RepairSummary } from './repair.ts';

export function renderRepairReport(opts: { summary: RepairSummary; client?: string; generatedAt?: Date }): string {
  const s = opts.summary;
  const readyAfter = s.compliantBefore + s.autoRepaired;
  const rows = (filter: (d: string) => boolean, limit: number): string =>
    s.records
      .filter((r) => filter(r.decision))
      .slice(0, limit)
      .map((r) => `<tr><td><code>${esc(r.id)}</code></td><td>${esc(r.name)}</td><td>${esc(r.original)}</td><td>${esc(addressLine(r.address))}</td><td>${esc([...r.issues, ...r.controls].join('; ') || '–')}</td></tr>`)
      .join('');
  const body = `
<h2>Summary</h2>
<p>${s.total} records checked. ${s.compliantBefore} (${pct(s.compliantBefore, s.total)}) were already structured. ${s.autoRepaired} more were repaired automatically with recorded evidence, taking readiness to <b>${pct(readyAfter, s.total)}</b>. ${s.review} need a human decision and ${s.needsData} are missing data only the vendor can supply. ${s.controlFlags} records have bank-detail warnings.</p>
<div class="tiles">
<div class="tile"><b>${pct(s.compliantBefore, s.total)}</b><span>ready before</span></div>
<div class="tile"><b>${pct(readyAfter, s.total)}</b><span>ready after automatic repair</span></div>
<div class="tile"><b>${s.review}</b><span>decisions for your team</span></div>
<div class="tile"><b>${s.needsData}</b><span>vendors missing data</span></div>
</div>
<h2>Repaired automatically</h2>
<table><tr><th>ID</th><th>Name</th><th>Before</th><th>Structured</th><th>Notes</th></tr>${rows((d) => d === 'auto', 100) || '<tr><td colspan="5">None.</td></tr>'}</table>
<h2>Needs a human decision</h2>
<table><tr><th>ID</th><th>Name</th><th>Before</th><th>Suggested</th><th>Why</th></tr>${rows((d) => d === 'review', 100) || '<tr><td colspan="5">None.</td></tr>'}</table>
<h2>Missing data</h2>
<table><tr><th>ID</th><th>Name</th><th>Before</th><th>Best effort</th><th>Missing</th></tr>${rows((d) => d === 'needs_data', 100) || '<tr><td colspan="5">None.</td></tr>'}</table>
<h2>How this was done</h2>
<p>Split ERP fields are mapped to structured address fields; free-text addresses are parsed with a rules engine that knows postcode formats for over 70 countries and a built-in gazetteer of cities. A record is repaired automatically only at 80% confidence or above with no open issue; everything else goes to review. Bank details are checked for IBAN validity and for consistency between bank, BIC and address countries.</p>`;
  return reportPage({ title: 'Payment Data Repair Report', subtitle: opts.client ? `Prepared for ${opts.client}` : 'Vendor and beneficiary data', body, generatedAt: opts.generatedAt });
}
