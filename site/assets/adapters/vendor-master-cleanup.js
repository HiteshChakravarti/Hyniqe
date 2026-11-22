import { esc } from '../common.js';
import { parseCsv, toCsv } from '../../lib/solutions/shared/csv.js';
import { cleanupVendors } from '../../lib/solutions/vendor-master-cleanup/src/vendors.js';
import { codeTitle, renderVendorReport } from '../../lib/solutions/vendor-master-cleanup/src/report.js';

export default {
  samples: ['vendor-master.csv'],
  run({ main }) {
    const rows = parseCsv(main);
    if (!rows.length) throw new Error('The file has no rows. Use a CSV with a header row.');
    const r = cleanupVendors(rows);
    if (!r.vendors.some((v) => v.name)) throw new Error('No supplier name column was found. Name it name, vendor_name or supplier_name.');
    const shared = r.findings.filter((f) => f.code === 'SHARED_IBAN').length;
    const fs = r.findings.filter((f) => f.severity !== 'info');
    const order = { DUPLICATE_VENDOR: 0, SHARED_IBAN: 1 };
    fs.sort((a, b) => (order[a.code] ?? 2) - (order[b.code] ?? 2));
    const report = renderVendorReport(r);
    return {
      verdict: `${r.affected} of ${r.vendors.length} supplier records need attention. ${r.clusters.length} suppliers are set up more than once and ${shared} bank accounts are shared by different suppliers.`,
      stats: [[r.vendors.length, 'records'], [r.clusters.length, 'duplicate suppliers', r.clusters.length ? 'bad' : 'good'], [shared, 'shared bank accounts', shared ? 'warn' : 'good'], [r.affected, 'records to fix', r.affected ? 'warn' : 'good']],
      table: `<tr><th>Problem</th><th>Records</th><th>Detail</th><th>What to do</th></tr>${fs.slice(0, 40).map((f) => `<tr><td><span class="sev ${f.severity}">${f.severity}</span> ${esc(codeTitle(f.code))}</td><td>${f.ids.map((i) => `<code>${esc(i)}</code>`).join(' ')}</td><td>${esc(f.message)}</td><td>${esc(f.action)}</td></tr>`).join('')}`,
      note: fs.length > 40 ? `Showing 40 of ${fs.length} findings. The report and CSV have all of them.` : '',
      main: { label: 'Download report (HTML)', content: report, filename: 'vendor-cleanup.html', type: 'text/html' },
      report,
      csv: toCsv(r.findings.map((f) => ({ severity: f.severity, problem: codeTitle(f.code), records: f.ids.join(' '), detail: f.message, action: f.action }))),
      name: 'vendor-findings',
    };
  },
};
