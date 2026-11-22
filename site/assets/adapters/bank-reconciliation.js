import { esc } from '../common.js';
import { toCsv } from '../../lib/solutions/shared/csv.js';
import { money, reconcile, KIND_WORDS } from '../../lib/solutions/bank-reconciliation/src/recon.js';
import { matchRows, renderReconReport } from '../../lib/solutions/bank-reconciliation/src/report.js';

const who = (l) => esc(l.name || l.text.slice(0, 50));

export default {
  samples: ['bank-statement-november.xml', 'cash-ledger-november.csv'],
  run({ main, second }) {
    if (!second) throw new Error('Add your cash ledger as the second file: the bank account’s entries exported from your accounting system (.csv).');
    const r = reconcile(main, second);
    const t = r.totals;
    const report = renderReconReport(r);
    const open = [
      ...r.openBank.map((o) => ({ o, l: r.bank[o.line], where: 'Bank only' })),
      ...r.matches.filter((m) => m.difference).map((m) => ({ o: { reason: m.why, action: 'Post the difference to bank charges or FX', candidates: [] }, l: { ...r.bank[m.bank[0]], cents: m.difference }, where: 'Difference' })),
      ...r.openLedger.map((o) => ({ o, l: r.ledger[o.line], where: 'Ledger only' })),
    ];
    const matched = r.bank.length - r.openBank.length;
    return {
      verdict: `${matched} of ${r.bank.length} bank lines matched (${Math.round(r.matchedShare * 100)}%). ${r.openBank.length ? `${r.openBank.length} to post (${money(t.openBank)}), ` : ''}${r.openLedger.length ? `${r.openLedger.length} ledger entries not on the statement yet (${money(t.openLedger)}). ` : ''}${t.unexplained === 0 ? 'The difference is fully explained.' : `${money(t.unexplained)} is still unexplained.`}`,
      stats: [[`${matched}/${r.bank.length}`, 'bank lines matched', r.matchedShare >= 0.9 ? 'good' : 'warn'], [r.openBank.length, 'to post', r.openBank.length ? 'warn' : 'good'], [r.openLedger.length, 'not on statement', r.openLedger.length ? 'warn' : 'good'], [money(t.unexplained), 'unexplained', t.unexplained ? 'bad' : 'good']],
      table: `<tr><th></th><th>Date</th><th>Item</th><th>Amount</th><th>What to do</th></tr>${open.slice(0, 60).map(({ o, l, where }) => `<tr><td><span class="sev ${where === 'Ledger only' ? 'info' : 'warning'}">${where}</span></td><td style="white-space:nowrap">${esc(l.date)}</td><td>${who(l)}<br><small>${esc(o.reason)}</small></td><td style="white-space:nowrap;text-align:right">${money(l.cents)}</td><td>${esc(o.action)}${o.candidates?.length ? `<br><small>Possible: ${o.candidates.map((c) => esc(r.ledger[c].id)).join(', ')}</small>` : ''}</td></tr>`).join('') || '<tr><td><span class="sev ok">ok</span></td><td colspan="4">Everything matched.</td></tr>'}`,
      note: `${r.warnings.join(' ')} ${Object.entries(r.matches.reduce((a, m) => ((a[KIND_WORDS[m.kind]] = (a[KIND_WORDS[m.kind]] ?? 0) + m.bank.length), a), {})).map(([k, v]) => `${k}: ${v}`).join(' · ')}${open.length > 60 ? ` · Showing 60 of ${open.length} open items; the report and CSV have all of them.` : ''}`.trim(),
      main: { label: 'Download reconciliation (HTML)', content: report, filename: 'bank-reconciliation.html', type: 'text/html' },
      report,
      csv: toCsv(matchRows(r)),
      name: 'bank-reconciliation',
    };
  },
};
