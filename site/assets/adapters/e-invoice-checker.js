import { esc } from '../common.js';
import { toCsv } from '../../lib/solutions/shared/csv.js';
import { checkFile } from '../../lib/solutions/e-invoice-checker/src/check.js';
import { renderInvoiceReport } from '../../lib/solutions/e-invoice-checker/src/report.js';

const m = (n, c) => (n === null || n === undefined ? '' : `${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`);

export default {
  binary: true,
  samples: ['e-invoice-peppol.xml'],
  async run({ main }) {
    const r = await checkFile(main);
    const i = r.invoice;
    const report = renderInvoiceReport(r);
    const rows = r.findings.length
      ? r.findings.map((f) => `<tr><td><span class="sev ${f.level}">${f.level}</span></td><td><code>${esc(f.rule)}</code><br><small>${esc(f.title)}</small></td><td>${esc(f.message)}</td></tr>`).join('')
      : '<tr><td><span class="sev ok">ok</span></td><td colspan="2">Every checked rule passed.</td></tr>';
    return {
      verdict: r.errors ? `${i.kind === 'CreditNote' ? 'Credit note' : 'Invoice'} ${i.number} from ${i.seller.name || 'the seller'} breaks ${r.errors} rule${r.errors === 1 ? '' : 's'}${r.errors ? ' and is likely to be rejected' : ''}.` : `${i.kind === 'CreditNote' ? 'Credit note' : 'Invoice'} ${i.number} from ${i.seller.name || 'the seller'} passes every checked rule.`,
      stats: [[m(i.totals.payable, i.currency), 'amount due'], [i.lines.length, 'lines'], [r.errors, 'rules broken', r.errors ? 'bad' : 'good'], [r.standard.split(' (')[0], r.fromPdf ? 'read from the PDF' : 'standard']],
      table: `<tr><th></th><th>Rule</th><th>What is wrong</th></tr>${rows}`,
      note: 'Open the full report to see the invoice laid out for reading and printing.',
      main: { label: 'Download readable invoice (HTML)', content: report, filename: `${i.number || 'invoice'}.html`, type: 'text/html' },
      report,
      csv: toCsv(i.lines.map((l) => ({ line: l.id, item: l.name, quantity: l.quantity ?? '', unit: l.unit, price: l.price ?? '', vat_category: l.category, vat_rate: l.rate ?? '', net: l.net ?? '' }))),
      name: `${i.number || 'invoice'}-lines`,
    };
  },
};
