import { esc } from '../common.js';
import { toCsv } from '../../lib/solutions/shared/csv.js';
import { triage } from '../../lib/solutions/payment-returns-triage/src/triage.js';
import { renderTriageReport } from '../../lib/solutions/payment-returns-triage/src/report.js';

const amt = (a) => Object.entries(a).map(([c, v]) => `${v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`).join(', ');

export default {
  samples: ['status-report-pain002.xml'],
  run({ main }) {
    const r = triage(main);
    const n = r.items.length + r.fileLevel.length;
    const report = renderTriageReport(r);
    const top = r.groups[0];
    return {
      verdict: n ? `${n} payments were rejected or returned, for ${r.groups.length} root causes.${top ? ` The biggest is ${top.group.toLowerCase()} (${top.count}).` : ''}` : `Nothing was rejected or returned: ${r.accepted} accepted, ${r.pending} pending.`,
      stats: [[r.total, 'payments in the report'], [n, 'rejected or returned', n ? 'bad' : 'good'], [r.groups.length, 'root causes'], [r.repeats.length, 'beneficiaries hit twice or more', r.repeats.length ? 'warn' : 'good']],
      table: `<tr><th>Root cause</th><th>Payments</th><th>Amount</th><th>Codes</th><th>Who acts</th><th>What to do</th></tr>${r.groups.map((g) => `<tr><td><b>${esc(g.group)}</b></td><td>${g.count}</td><td>${esc(amt(g.amounts))}</td><td>${g.codes.map((c) => `<code>${esc(c)}</code>`).join(' ')}</td><td>${esc(g.who.join(', '))}</td><td>${esc(g.fix)}</td></tr>`).join('')}`,
      note: 'Every payment with its code explained is in the report and the CSV.',
      main: { label: 'Download report (HTML)', content: report, filename: 'returns.html', type: 'text/html' },
      report,
      csv: toCsv([...r.fileLevel, ...r.items], ['ref', 'name', 'iban', 'amount', 'currency', 'status', 'code', 'meaning', 'group', 'who', 'fix', 'info']),
      name: 'returns',
    };
  },
};
