import { parseCsv, toCsv } from '../../lib/solutions/shared/csv.js';
import { esc, pct } from '../common.js';
import { repairRecords, addressLine } from '../../lib/solutions/payment-data-repair/src/repair.js';
import { renderRepairReport } from '../../lib/solutions/payment-data-repair/src/report.js';

const LABEL = { auto: 'repaired', compliant: 'already ok', review: 'review', needs_data: 'missing data' };
const CLS = { auto: 'auto', compliant: 'compliant', review: 'review', needs_data: 'error' };

export default {
  samples: ['vendors.csv'],
  run({ main, sample }) {
    const s = repairRecords(parseCsv(main));
    if (!s.total) throw new Error('The file has no data rows. Check that it is a CSV with a header row.');
    const after = s.compliantBefore + s.autoRepaired;
    const order = { review: 0, needs_data: 1, auto: 2, compliant: 3 };
    const list = [...s.records].sort((a, b) => order[a.decision] - order[b.decision]).slice(0, 25);
    const csv = toCsv(s.records.map((r) => ({ id: r.id, name: r.name, status: r.decision, confidence: r.confidence.toFixed(2), ...r.address, AdrLine: (r.address.AdrLine || []).join(' | '), issues: [...r.issues, ...r.controls].join('; ') })));
    return {
      verdict: `Structured-address readiness goes from ${pct(s.compliantBefore, s.total)} to ${pct(after, s.total)}. ${s.review} records need a decision and ${s.needsData} need data from the vendor.`,
      stats: [[pct(s.compliantBefore, s.total), 'ready before'], [pct(after, s.total), 'ready after repair', 'good'], [s.review, 'need a decision', 'warn'], [s.needsData, 'missing data', 'bad']],
      table: `<tr><th>ID</th><th>Name</th><th>Before</th><th>Structured</th><th>Status</th><th>Notes</th></tr>${list.map((r) => `<tr><td><code>${esc(r.id)}</code></td><td>${esc(r.name)}</td><td>${esc(r.original)}</td><td>${esc(addressLine(r.address))}</td><td><span class="sev ${CLS[r.decision]}">${LABEL[r.decision]}</span></td><td>${esc([...r.issues, ...r.controls].join('; ') || '–')}</td></tr>`).join('')}`,
      note: s.total > 25 ? `Showing 25 of ${s.total} records, those needing attention first.` : '',
      main: { label: 'Download structured addresses (CSV)', content: csv, filename: 'structured-addresses.csv', type: 'text/csv' },
      report: renderRepairReport({ summary: s, client: sample ? 'Sample data' : undefined }),
      csv: null,
      name: 'payment-data-repair',
    };
  },
};
