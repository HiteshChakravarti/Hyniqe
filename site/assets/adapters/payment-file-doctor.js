import { esc } from '../common.js';
import { diagnose } from '../../lib/solutions/payment-file-doctor/src/doctor.js';
import { renderDoctorReport } from '../../lib/solutions/payment-file-doctor/src/report.js';
import { toCsv } from '../../lib/solutions/shared/csv.js';

export default {
  samples: ['payment-file-v03.xml'],
  run({ main, sample }) {
    const r = diagnose(main, { target: '09', today: sample ? new Date(Date.UTC(2026, 10, 18)) : new Date() });
    if (!r.fixedXml && r.findings.some((f) => f.code === 'NOT_XML' || f.code === 'NOT_CREDIT_TRANSFER')) throw new Error(r.findings[0].message);
    const left = r.errorsLeft;
    const verdict = left
      ? `${r.fixedCount} problems fixed automatically. ${left} still need you: they are listed first below.`
      : r.fixedCount
        ? `Fixed. ${r.fixedCount} problems corrected; the new file is ready to upload to your bank.`
        : 'No problems found. The file meets the checks your bank applies.';
    const rank = (f) => (f.fixed ? 2 : f.level === 'error' ? 0 : 1);
    const fs = [...r.findings].sort((a, b) => rank(a) - rank(b));
    const report = renderDoctorReport(r, { fileName: sample ? 'payment-file-v03.xml' : undefined });
    return {
      verdict,
      stats: [[r.totals.count, `payments, ${r.totals.sum} ${r.totals.currency}`], [r.fixedCount, 'fixed for you', 'good'], [left, 'need you', left ? 'bad' : 'good'], [`${r.versionFound || '?'} → ${r.versionOut}`, 'format version']],
      table: `<tr><th>Where</th><th>Problem</th><th>What happened</th></tr>${fs.slice(0, 40).map((f) => `<tr><td>${esc(f.where)}</td><td><span class="sev ${f.fixed ? 'info' : f.level === 'error' ? 'error' : 'review'}">${f.fixed ? 'fixed' : f.level}</span> ${esc(f.message)}</td><td>${esc(f.action)}</td></tr>`).join('')}`,
      note: fs.length > 40 ? `Showing 40 of ${fs.length} findings. All of them are in the report.` : '',
      main: r.fixedXml ? { label: 'Download fixed file (XML)', content: r.fixedXml, filename: 'payment-file-fixed.xml', type: 'application/xml' } : null,
      report,
      csv: toCsv(r.findings, ['level', 'code', 'where', 'message', 'action', 'fixed']),
      name: 'payment-file-findings',
    };
  },
};
