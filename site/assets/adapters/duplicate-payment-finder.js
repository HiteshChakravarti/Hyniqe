import { parseCsv, toCsv } from '../../lib/solutions/shared/csv.js';
import { esc, money } from '../common.js';
import { findDuplicates } from '../../lib/solutions/duplicate-payments/src/duplicates.js';
import { renderDuplicateReport, clustersToRows } from '../../lib/solutions/duplicate-payments/src/report.js';

export default {
  samples: ['payments.csv'],
  run({ main, sample }) {
    const r = findDuplicates(parseCsv(main));
    if (!r.payments.length) throw new Error('No payments with an amount were found. See "Columns it understands" for the names we recognise.');
    const high = r.clusters.filter((c) => c.confidence === 'high');
    const medium = r.clusters.filter((c) => c.confidence === 'medium');
    const dup = high.reduce((n, c) => n + c.duplicates.length, 0);
    const atRisk = Object.entries(r.exposure).map(([cur, c]) => money(c, cur)).join(' + ') || '0.00';
    const line = (p) => `<code>${esc(p.id)}</code> ${esc(p.vendor)}<br>${esc(p.invoice)}, ${esc(p.paymentDate)}, ${esc(money(p.cents, p.currency))}`;
    const report = renderDuplicateReport({ result: r, client: sample ? 'Sample data' : undefined });
    return {
      verdict: dup ? `${dup} payment${dup === 1 ? ' looks' : 's look'} like ${dup === 1 ? 'a duplicate' : 'duplicates'}, putting ${atRisk} at risk.` : 'No high-confidence duplicates found.',
      stats: [[dup, 'likely duplicate payments', 'bad'], [atRisk, 'at risk', 'bad'], [medium.length, 'worth a second look', 'warn'], [r.payments.length, 'payments checked']],
      table: `<tr><th>Group</th><th>Confidence</th><th>Original</th><th>Suspected duplicate</th><th>Why</th></tr>${[...high, ...medium].slice(0, 30).map((c) => `<tr><td>${esc(c.id)}</td><td><span class="sev ${c.confidence}">${c.confidence}</span></td><td>${line(c.original)}</td><td>${c.duplicates.map(line).join('<br><br>')}</td><td>${esc(c.reasons.join('; '))}</td></tr>`).join('')}`,
      note: r.recurringVendors ? `${r.recurringVendors} recurring payment series (rent, subscriptions) were recognised and not flagged.` : '',
      main: { label: 'Download report (HTML)', content: report, filename: 'duplicate-payments.html', type: 'text/html' },
      report,
      csv: toCsv(clustersToRows(r)),
      name: 'duplicate-payments',
    };
  },
};
