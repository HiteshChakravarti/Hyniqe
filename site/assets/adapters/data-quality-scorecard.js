import { esc } from '../common.js';
import { parseCsv, toCsv } from '../../lib/solutions/shared/csv.js';
import { scorecard } from '../../lib/solutions/data-quality-scorecard/src/profile.js';
import { KIND_LABEL, renderScorecard } from '../../lib/solutions/data-quality-scorecard/src/report.js';

const p = (x) => (x === null ? '' : `${(100 * x).toFixed(1)}%`);

export default {
  samples: ['trades.csv'],
  run({ main, sample }) {
    const rows = parseCsv(main);
    if (!rows.length) throw new Error('The file has no rows. Use a CSV with a header row.');
    const s = scorecard(rows);
    const d = s.dimensions;
    const weakest = [...s.columns].sort((a, b) => a.score - b.score)[0];
    const report = renderScorecard(s, { fileName: sample ? 'trades.csv' : undefined });
    return {
      verdict: `Score ${s.score} out of 100 (grade ${s.grade}) for ${s.rows} rows and ${s.columns.length} columns.${weakest && weakest.score < 1 ? ` The weakest column is ${weakest.name}.` : ''}`,
      stats: [[p(d.completeness), 'complete'], [p(d.validity), 'valid', d.validity < 0.95 ? 'warn' : 'good'], [p(d.uniqueness), 'unique'], [p(d.consistency), 'consistent']],
      table: `<tr><th>Column</th><th>Holds</th><th>Filled</th><th>Valid</th><th>Consistent</th><th>Problems</th></tr>${s.columns.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td>${KIND_LABEL[c.kind]}</td><td>${p(c.completeness)}</td><td>${p(c.validity)}</td><td>${p(c.consistency)}</td><td>${[c.blank ? `${c.blank} blank` : '', c.invalid ? `${c.invalid} invalid, e.g. <code>${esc(c.invalidExamples[0])}</code>` : '', c.duplicates ? `${c.duplicates} repeated` : '', c.inconsistent ? `${c.inconsistent} written differently, e.g. <code>${esc(c.inconsistentExamples[0])}</code>` : ''].filter(Boolean).join('<br>') || 'None'}</td></tr>`).join('')}`,
      note: s.cross.map((c) => `${c.rule}: ${c.failed} of ${c.checked} rows fail.`).join(' '),
      main: { label: 'Download scorecard (HTML)', content: report, filename: 'scorecard.html', type: 'text/html' },
      report,
      csv: toCsv(s.columns.map((c) => ({ column: c.name, holds: KIND_LABEL[c.kind], blank: c.blank, invalid: c.invalid, repeated: c.duplicates, inconsistent: c.inconsistent, completeness: p(c.completeness), validity: p(c.validity), consistency: p(c.consistency) }))),
      name: 'scorecard',
    };
  },
};
