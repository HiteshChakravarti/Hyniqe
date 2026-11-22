// Payment File Doctor report: what was wrong, what was fixed, what still needs a person.
import { esc, reportPage } from '../../shared/html.ts';
import type { DoctorResult } from './doctor.ts';

export function renderDoctorReport(r: DoctorResult, opts: { fileName?: string; generatedAt?: Date } = {}): string {
  const fixed = r.findings.filter((f) => f.fixed);
  const open = r.findings.filter((f) => !f.fixed);
  const rows = (fs: typeof r.findings): string =>
    fs.map((f) => `<tr><td><span class="pill ${f.fixed ? 'ok' : f.level === 'error' ? 'error' : 'review'}">${f.fixed ? 'fixed' : f.level}</span></td><td>${esc(f.where)}</td><td>${esc(f.message)}</td><td>${esc(f.action)}</td></tr>`).join('');
  const body = `
<h2>Summary</h2>
<p>${r.totals.count} payments totalling ${esc(r.totals.currency)} ${esc(r.totals.sum)}. The file was version ${Number(r.versionFound) || 'unknown'}${r.versionFound !== r.versionOut ? ` and has been converted to version ${Number(r.versionOut)}` : ''}. <b>${r.fixedCount} problems were fixed automatically</b>${r.errorsLeft ? `; <b>${r.errorsLeft} still need you</b> before the bank will accept every payment` : ' and nothing else blocks the file'}.</p>
<div class="tiles">
<div class="tile"><b>${r.totals.count}</b><span>payments</span></div>
<div class="tile"><b>${r.fixedCount}</b><span>fixed automatically</span></div>
<div class="tile"><b>${r.errorsLeft}</b><span>errors left for you</span></div>
<div class="tile"><b>${open.filter((f) => f.level === 'warning').length}</b><span>warnings</span></div>
</div>
<h2>Still needs you</h2>
${open.length ? `<table><tr><th></th><th>Where</th><th>Problem</th><th>What to do</th></tr>${rows(open)}</table>` : '<p>Nothing. The corrected file is ready to send.</p>'}
<h2>Fixed automatically</h2>
${fixed.length ? `<table><tr><th></th><th>Where</th><th>Problem</th><th>What changed</th></tr>${rows(fixed)}</table>` : '<p>No changes were needed.</p>'}
<h2>How this was done</h2>
<p>The file was read element by element and checked against the rules banks most often reject on: file version, header counts and control totals, IBAN check digits, BIC format, amounts and currency, characters outside the SEPA character set, field lengths, execution date and structured addresses. One-line addresses were split with the same address rules as the Hyniqe Payment Data Repair tool, and only when the town and country were identified with confidence. Your bank may have extra rules of its own: test the corrected file before a large run.</p>`;
  return reportPage({ title: 'Payment File Doctor report', subtitle: opts.fileName ?? 'Credit transfer file', body, generatedAt: opts.generatedAt });
}
