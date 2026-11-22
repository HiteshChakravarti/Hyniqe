// Pre-payment bank detail check report.
import { esc, reportPage } from '../../shared/html.ts';
import type { CheckResult } from './check.ts';

const amt = (a: Record<string, number>): string => Object.entries(a).map(([c, v]) => `${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`).join(', ');

export function renderCheckReport(r: CheckResult, opts: { generatedAt?: Date } = {}): string {
  const order = { stop: 0, check: 1, ok: 2 };
  const flagged = r.payments.filter((p) => p.risk !== 'ok').sort((a, b) => order[a.risk] - order[b.risk]);
  const body = `
<h2>Summary</h2>
<p>${r.payments.length} payments checked against ${r.trustedPayees} trusted payees. <b>${r.stop} should be stopped until verified</b>${amt(r.atRisk) ? ` (${amt(r.atRisk)})` : ''}, ${r.check} need a quick check, ${r.ok} look normal.</p>
<div class="tiles"><div class="tile"><b>${r.stop}</b><span>stop and verify</span></div><div class="tile"><b>${r.check}</b><span>check</span></div><div class="tile"><b>${r.ok}</b><span>look normal</span></div></div>
<h2>Payments to look at</h2>
<table><tr><th></th><th>Row</th><th>Payee</th><th>Amount</th><th>What we found</th><th>What to do</th></tr>
${flagged.map((p) => `<tr><td><span class="pill ${p.risk === 'stop' ? 'error' : 'review'}">${p.risk}</span></td><td>${p.row}</td><td>${esc(p.payee || p.payeeId)}</td><td>${p.amount === null ? '' : `${p.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} ${esc(p.currency)}`}</td><td>${p.findings.map((f) => esc(f.message)).join('<br>')}</td><td>${[...new Set(p.findings.map((f) => f.action))].map(esc).join('<br>')}</td></tr>`).join('') || '<tr><td colspan="6">Nothing unusual found.</td></tr>'}</table>
<h2>How this was done</h2>
<p>Each payee in the run is matched to your trusted records by payee ID, or by name when there is no ID (legal forms, case and punctuation are ignored). The account in the run is then compared with every account that payee has been paid to before, and with every other payee's accounts. New payees, recently changed details and unusually large amounts are also flagged. The verification that matters is a call-back on a phone number you already hold; this check tells you which payments need one.</p>`;
  return reportPage({ title: 'Bank detail change check', subtitle: 'Payment run before release', body, generatedAt: opts.generatedAt });
}
