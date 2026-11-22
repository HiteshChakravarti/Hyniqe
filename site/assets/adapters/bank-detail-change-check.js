import { esc } from '../common.js';
import { parseCsv, toCsv } from '../../lib/solutions/shared/csv.js';
import { checkRun } from '../../lib/solutions/bank-detail-change-check/src/check.js';
import { renderCheckReport } from '../../lib/solutions/bank-detail-change-check/src/report.js';

const amt = (a) => Object.entries(a).map(([c, v]) => `${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`).join(', ');

export default {
  samples: ['payment-run.csv', 'payment-history.csv'],
  run({ main, second, sample }) {
    if (!second) throw new Error('Add your trusted bank details as the second file: a vendor master export or earlier payment runs.');
    const run = parseCsv(main);
    const trusted = parseCsv(second);
    if (!run.length) throw new Error('The payment run has no rows.');
    const r = checkRun(run, trusted, { today: sample ? new Date(Date.UTC(2026, 10, 20)) : new Date() });
    const order = { stop: 0, check: 1, ok: 2 };
    const flagged = r.payments.filter((p) => p.risk !== 'ok').sort((a, b) => order[a.risk] - order[b.risk]);
    const report = renderCheckReport(r);
    return {
      verdict: r.stop ? `Stop ${r.stop} payment${r.stop === 1 ? '' : 's'}${amt(r.atRisk) ? ` (${amt(r.atRisk)})` : ''} until the supplier confirms by phone. ${r.check} more need a quick check.` : r.check ? `Nothing to stop. ${r.check} payments need a quick check.` : `All ${r.payments.length} payments match the bank details you trust.`,
      stats: [[r.stop, 'stop and verify', r.stop ? 'bad' : 'good'], [r.check, 'check', r.check ? 'warn' : 'good'], [r.ok, 'look normal', 'good'], [r.trustedPayees, 'trusted payees']],
      table: `<tr><th></th><th>Payee</th><th>Amount</th><th>What we found</th></tr>${flagged.slice(0, 60).map((p) => `<tr><td><span class="sev ${p.risk === 'stop' ? 'error' : 'warning'}">${p.risk}</span></td><td>${esc(p.payee || p.payeeId)}<br><small>row ${p.row}</small></td><td>${p.amount === null ? '' : `${p.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} ${esc(p.currency)}`}</td><td>${p.findings.map((f) => esc(f.message)).join('<br>')}<br><small>${esc(p.findings[0].action)}</small></td></tr>`).join('') || '<tr><td><span class="sev ok">ok</span></td><td colspan="3">Nothing unusual found.</td></tr>'}`,
      note: flagged.length > 60 ? `Showing 60 of ${flagged.length}. The report and CSV have all of them.` : '',
      main: { label: 'Download report (HTML)', content: report, filename: 'bank-detail-check.html', type: 'text/html' },
      report,
      csv: toCsv(r.payments.map((p) => ({ row: p.row, risk: p.risk, payee: p.payee, payee_id: p.payeeId, account: p.account, amount: p.amount ?? '', currency: p.currency, findings: p.findings.map((f) => f.message).join(' | ') }))),
      name: 'bank-detail-check',
    };
  },
};
