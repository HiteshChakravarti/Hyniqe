import { esc } from '../common.js';
import { parseCsv, toCsv } from '../../lib/solutions/shared/csv.js';
import { checkEvents, typeName } from '../../lib/solutions/corporate-actions-checker/src/events.js';
import { renderEventsReport } from '../../lib/solutions/corporate-actions-checker/src/report.js';

export default {
  samples: ['corporate-actions.csv'],
  run({ main, sample }) {
    const rows = parseCsv(main);
    if (!rows.length) throw new Error('The file has no rows. Use one row per event per source.');
    const r = checkEvents(rows, { today: sample ? new Date(Date.UTC(2026, 10, 22)) : new Date() });
    if (!r.events.length) throw new Error('No events were found. The file needs at least an ISIN and an event type column.');
    const disagree = r.events.filter((e) => e.status === 'disagree').length;
    const urgent = r.findings.filter((f) => f.code.startsWith('DEADLINE') || f.code === 'NO_DEADLINE').length;
    const rank = { error: 0, review: 1, info: 2 };
    const fs = [...r.findings].sort((a, b) => rank[a.severity] - rank[b.severity]);
    const report = renderEventsReport(r);
    return {
      verdict: `${r.events.length} events from ${r.notices} notices. ${disagree} have sources that disagree${urgent ? ` and ${urgent} need attention because of the election deadline` : ''}.`,
      stats: [[r.events.length, 'events'], [disagree, 'sources disagree', disagree ? 'bad' : 'good'], [urgent, 'deadline issues', urgent ? 'warn' : 'good'], [r.events.length - disagree, 'agree', 'good']],
      table: `<tr><th>Security</th><th>Event</th><th>Problem</th><th>What to do</th></tr>${fs.filter((f) => f.severity !== 'info').slice(0, 40).map((f) => `<tr><td><code>${esc(f.isin)}</code></td><td>${esc(typeName(f.eventType))}</td><td><span class="sev ${f.severity}">${f.severity}</span> ${esc(f.message)}</td><td>${esc(f.action)}</td></tr>`).join('')}`,
      note: fs.length > 40 ? `Showing the 40 most serious of ${fs.length} findings. The report has all of them.` : '',
      main: { label: 'Download report (HTML)', content: report, filename: 'corporate-actions.html', type: 'text/html' },
      report,
      csv: toCsv(r.findings, ['isin', 'eventType', 'field', 'severity', 'code', 'message', 'action']),
      name: 'corporate-actions-findings',
    };
  },
};
