import { esc } from '../common.js';
import { convertStatement } from '../../lib/solutions/bank-statement-converter/src/statement.js';
import { renderStatementReport, toSpreadsheet } from '../../lib/solutions/bank-statement-converter/src/report.js';

const fmt = (n) => (n === null || n === undefined ? '' : n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

export default {
  samples: ['statement-camt053.xml'],
  run({ main, sample }) {
    const r = convertStatement(main);
    if (!r.transactions.length && !r.statements.length) throw new Error('No statement was found in this file. Use a camt.052, camt.053, camt.054, MT940 or MT942 file.');
    const off = r.statements.filter((s) => s.difference !== null && Math.abs(s.difference) >= 0.005);
    const inSum = r.transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
    const outSum = r.transactions.filter((t) => t.amount < 0).reduce((a, t) => a - t.amount, 0);
    const cur = r.statements[0]?.currency ?? '';
    const csv = toSpreadsheet(r);
    return {
      verdict: `${r.transactions.length} transactions from ${r.statements.length} ${r.format} statement${r.statements.length === 1 ? '' : 's'} are ready as a spreadsheet. ${off.length ? `${off.length} statement${off.length === 1 ? '' : 's'} do not add up to the closing balance.` : 'Opening balance plus movements equals the closing balance.'}`,
      stats: [[r.transactions.length, 'transactions'], [`${fmt(inSum)} ${cur}`, 'money in', 'good'], [`${fmt(outSum)} ${cur}`, 'money out'], [off.length ? off.length : 'Yes', off.length ? 'statements off balance' : 'balances add up', off.length ? 'bad' : 'good']],
      table: `<tr><th>Date</th><th>In / out</th><th>Amount</th><th>Counterparty</th><th>Reference</th><th>Type</th></tr>${r.transactions.slice(0, 50).map((t) => `<tr><td>${esc(t.bookingDate)}</td><td>${t.direction}</td><td>${fmt(t.amount)} ${esc(t.currency)}</td><td>${esc(t.counterparty)}<br><small>${esc(t.counterpartyAccount)}</small></td><td>${esc(t.reference)}</td><td>${esc(t.type)}</td></tr>`).join('')}`,
      note: [r.transactions.length > 50 ? `Showing 50 of ${r.transactions.length} transactions. The spreadsheet has all of them.` : '', ...r.warnings].filter(Boolean).join(' '),
      main: { label: 'Download spreadsheet (CSV, opens in Excel)', content: csv, filename: 'statement.csv', type: 'text/csv' },
      report: renderStatementReport(r, { fileName: sample ? 'statement-camt053.xml' : undefined }),
      csv: null,
      name: 'statement',
    };
  },
};
