// Bank reconciliation report: the proof that the difference adds up, then what to post and what to chase.
import { esc, reportPage } from '../../shared/html.ts';
import { KIND_WORDS, money, type Line, type ReconResult } from './recon.ts';

const amt = (c: number): string => `<span class="${c < 0 ? 'neg' : ''}">${money(c)}</span>`;
const who = (l: Line): string => esc(l.name || l.text.slice(0, 60));

export function matchRows(r: ReconResult): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  r.matches.forEach((m, i) => {
    for (const b of m.bank) rows.push({ group: i + 1, status: 'matched', how: KIND_WORDS[m.kind], confidence: m.confidence, side: 'bank', date: r.bank[b].date, id: r.bank[b].id, party: r.bank[b].name, text: r.bank[b].text, amount: (r.bank[b].cents / 100).toFixed(2), difference: m.difference ? (m.difference / 100).toFixed(2) : '', note: m.why });
    for (const l of m.ledger) rows.push({ group: i + 1, status: 'matched', how: KIND_WORDS[m.kind], confidence: m.confidence, side: 'ledger', date: r.ledger[l].date, id: r.ledger[l].id, party: r.ledger[l].name, text: r.ledger[l].text, amount: (r.ledger[l].cents / 100).toFixed(2), difference: '', note: m.why });
  });
  for (const o of [...r.openBank, ...r.openLedger]) {
    const l = o.side === 'bank' ? r.bank[o.line] : r.ledger[o.line];
    rows.push({ group: '', status: 'open', how: o.reason, confidence: '', side: o.side, date: l.date, id: l.id, party: l.name, text: l.text, amount: (l.cents / 100).toFixed(2), difference: '', note: o.action + (o.candidates.length ? ` (possible: ${o.candidates.map((c) => r.ledger[c].id).join(', ')})` : '') });
  }
  return rows;
}

export function renderReconReport(r: ReconResult, opts: { generatedAt?: Date } = {}): string {
  const t = r.totals;
  const byKind = Object.entries(r.matches.reduce<Record<string, number>>((a, m) => ((a[KIND_WORDS[m.kind]] = (a[KIND_WORDS[m.kind]] ?? 0) + m.bank.length), a), {}));
  const diffs = r.matches.filter((m) => m.difference);
  const body = `<style>.num{text-align:right;white-space:nowrap}.neg{color:#b42318}p.warn{border-left:3px solid #b54708;padding-left:.6em}</style>
<h2>Summary</h2>
<p>${r.bank.length} bank lines (${esc(r.bankFormat)}) and ${r.ledger.length} ledger entries. <b>${r.bank.length - r.openBank.length} bank lines matched (${Math.round(r.matchedShare * 100)}%)</b>, ${r.openBank.length} to post or investigate, ${r.openLedger.length} ledger entries not on the statement.</p>
${r.warnings.map((w) => `<p class="warn">${esc(w)}</p>`).join('')}
<h2>Reconciliation</h2>
<table>
<tr><td>Movements on the bank statement</td><td class="num">${amt(t.bank)}</td></tr>
<tr><td>Movements in the ledger</td><td class="num">${amt(t.ledger)}</td></tr>
<tr><th>Difference to explain</th><th class="num">${amt(t.bank - t.ledger)}</th></tr>
<tr><td>On the statement, not yet in the ledger (${r.openBank.length})</td><td class="num">${amt(t.openBank)}</td></tr>
<tr><td>In the ledger, not yet on the statement (${r.openLedger.length})</td><td class="num">${amt(-t.openLedger)}</td></tr>
<tr><td>Differences on matched items: charges and exchange rates (${diffs.length})</td><td class="num">${amt(t.differences)}</td></tr>
<tr><th>Unexplained</th><th class="num">${amt(t.unexplained)}</th></tr>
</table>
<h2>To post in the ledger</h2>
<table><tr><th>Date</th><th>Bank line</th><th>Amount</th><th>Why it is open</th><th>What to do</th></tr>
${r.openBank.map((o) => `<tr><td>${esc(r.bank[o.line].date)}</td><td>${who(r.bank[o.line])}<br><small>${esc(r.bank[o.line].text)}</small></td><td class="num">${amt(r.bank[o.line].cents)}</td><td>${esc(o.reason)}${o.candidates.length ? `<br><small>Possible: ${o.candidates.map((c) => `${esc(r.ledger[c].id)} ${esc(r.ledger[c].name)} ${esc(r.ledger[c].date)}`).join('; ')}</small>` : ''}</td><td>${esc(o.action)}</td></tr>`).join('') || '<tr><td colspan="5">Nothing: every bank line is in the ledger.</td></tr>'}
${diffs.map((m) => `<tr><td>${esc(r.bank[m.bank[0]].date)}</td><td>${who(r.bank[m.bank[0]])}<br><small>matched to ${m.ledger.map((l) => esc(r.ledger[l].id)).join(', ')}</small></td><td class="num">${amt(m.difference)}</td><td>${esc(m.why)}</td><td>Post the difference to bank charges or FX</td></tr>`).join('')}
</table>
<h2>In the ledger, not on the statement</h2>
<table><tr><th>Date</th><th>Entry</th><th>Party</th><th>Amount</th><th>What it probably is</th></tr>
${r.openLedger.map((o) => `<tr><td>${esc(r.ledger[o.line].date)}</td><td>${esc(r.ledger[o.line].id)}</td><td>${esc(r.ledger[o.line].name)}<br><small>${esc(r.ledger[o.line].text)}</small></td><td class="num">${amt(r.ledger[o.line].cents)}</td><td>${esc(o.reason)}<br><small>${esc(o.action)}</small></td></tr>`).join('') || '<tr><td colspan="5">Nothing outstanding.</td></tr>'}
</table>
<h2>How the matches were made</h2>
<table><tr><th>Method</th><th>Bank lines</th></tr>${byKind.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join('')}</table>
<p>Matching runs in the order an accountant would: same reference and amount; one payment covering several invoices; several part payments for one invoice; same reference with a small difference (charges or FX); same amount within a few days with the same name; and finally one payment covering several open items of the same customer. When two ledger entries fit equally well, nothing is matched and both are listed for you to choose.</p>
<h2>All matches</h2>
<table><tr><th>Bank</th><th>Ledger</th><th>Amount</th><th>How</th></tr>
${r.matches.map((m) => `<tr><td>${m.bank.map((b) => `${esc(r.bank[b].date)} ${who(r.bank[b])}`).join('<br>')}</td><td>${m.ledger.map((l) => `${esc(r.ledger[l].id)} ${esc(r.ledger[l].name)}`).join('<br>')}</td><td class="num">${m.bank.map((b) => amt(r.bank[b].cents)).join('<br>')}</td><td>${esc(KIND_WORDS[m.kind])}${m.confidence === 'medium' ? ' <span class="pill review">check</span>' : ''}<br><small>${esc(m.why)}</small></td></tr>`).join('')}
</table>`;
  return reportPage({ title: 'Bank reconciliation', subtitle: 'Bank statement against the cash ledger', body, generatedAt: opts.generatedAt });
}
