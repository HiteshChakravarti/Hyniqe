import { parseCsv, toCsv } from '../../lib/solutions/shared/csv.js';
import { esc, pct } from '../common.js';
import { checkSsis, compareSsis } from '../../lib/solutions/ssi-checker/src/ssi.js';
import { renderSsiReport, label } from '../../lib/solutions/ssi-checker/src/report.js';

export default {
  samples: ['ssi-ours.csv', 'ssi-golden-source.csv'],
  run({ main, second, sample }) {
    const rows = parseCsv(main);
    if (!rows.length) throw new Error('The file has no data rows. Check that it is a CSV with a header row.');
    const asOf = sample ? new Date(Date.UTC(2026, 10, 1)) : new Date();
    const check = checkSsis(rows, { asOf });
    if (!check.ssis.some((s) => s.pset || s.agentBic)) throw new Error('No place-of-settlement or agent BIC column was found. See "Columns it understands" for the names we recognise.');
    const golden = second ? parseCsv(second) : null;
    const compare = golden?.length ? compareSsis(rows, golden) : null;
    const findings = [...check.findings, ...(compare?.findings ?? [])];
    const blocking = new Set(findings.filter((f) => f.severity !== 'info').map((f) => f.ssiId));
    const errors = new Set(findings.filter((f) => f.severity === 'error').map((f) => f.ssiId)).size;
    const ready = check.ssis.length - blocking.size;
    const order = { error: 0, review: 1, info: 2 };
    const top = [...findings].sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 25);
    const report = renderSsiReport({ check, compare, asOf, client: sample ? 'Sample data' : undefined });
    return {
      verdict: `${pct(ready, check.ssis.length)} of your ${check.ssis.length} SSIs are ready for T+1. ${errors} would cause a failed or unmatched settlement.`,
      stats: [[pct(ready, check.ssis.length), 'ready for T+1', 'good'], [errors, 'would fail', 'bad'], [blocking.size - errors, 'need review', 'warn'], ...(compare ? [[`${compare.matched}/${compare.compared}`, 'match the golden source']] : [])],
      table: `<tr><th>SSI</th><th>Counterparty</th><th>Market</th><th>Issue</th><th>What to do</th></tr>${top.map((f) => `<tr><td><code>${esc(f.ssiId)}</code></td><td>${esc(f.counterparty)}</td><td>${esc(f.market)}</td><td><span class="sev ${f.severity}">${f.severity}</span> ${esc(label(f.code))}<br>${esc(f.message)}</td><td>${esc(f.fix)}</td></tr>`).join('')}`,
      note: findings.length > 25 ? `Showing the 25 most serious of ${findings.length} findings. The full list is in the report and the CSV.` : '',
      main: { label: 'Download report (HTML)', content: report, filename: 'ssi-readiness.html', type: 'text/html' },
      report,
      csv: toCsv(findings, ['ssiId', 'counterparty', 'market', 'field', 'severity', 'code', 'message', 'fix']),
      name: 'ssi-readiness',
    };
  },
};
