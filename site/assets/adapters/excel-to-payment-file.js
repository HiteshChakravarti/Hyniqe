import { esc } from '../common.js';
import { parseCsv } from '../../lib/solutions/shared/csv.js';
import { buildFromRows } from '../../lib/solutions/excel-to-payment-file/src/convert.js';

function nextBusinessDay() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  while ([0, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default {
  samples: ['payments-to-send.csv'],
  run({ main, fields }) {
    const rows = parseCsv(main);
    if (!rows.length) throw new Error('The file has no rows. Save your sheet as CSV with a header row: payee, iban, amount, reference.');
    const payer = { name: fields.name || '', iban: (fields.iban || '').replace(/\s+/g, '').toUpperCase(), date: fields.date || nextBusinessDay() };
    if (!payer.name || !payer.iban) throw new Error('Enter your company name and IBAN above; they go into the file as the payer.');
    const r = buildFromRows(rows, payer);
    if (!r.xml && r.problems.length) throw new Error(r.problems.join(' '));
    const left = r.rows.filter((x) => x.status !== 'included');
    return {
      verdict: left.length ? `${r.included} payments are in the file. ${left.length} ${left.length === 1 ? "was" : "were"} left out because of the problems shown below.` : `All ${r.included} payments are in the file, ready to upload to your bank.`,
      stats: [[r.included, 'payments in the file', 'good'], [r.total, 'total'], [left.length, 'left out', left.length ? 'bad' : 'good'], [payer.date, 'payment date']],
      table: `<tr><th>Row</th><th>Payee</th><th>Amount</th><th>Status</th><th>Notes</th></tr>${r.rows.map((x) => `<tr><td>${x.row}</td><td>${esc(x.payee)}</td><td>${esc(x.amount)}</td><td><span class="sev ${x.status === 'included' ? 'info' : 'error'}">${x.status}</span></td><td>${esc(x.notes.join(' '))}</td></tr>`).join('')}`,
      note: r.problems.join(' '),
      main: r.xml ? { label: 'Download payment file (pain.001 XML)', content: r.xml, filename: 'payments-pain001.xml', type: 'application/xml' } : null,
      report: null,
      csv: null,
      name: 'payments',
    };
  },
};
