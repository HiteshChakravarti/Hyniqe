// Duplicate Payment report: one self-contained HTML page that prints to PDF.

import { esc, money, reportPage } from '../../shared/html.ts';
import type { Cluster, DuplicateResult, Payment } from './duplicates.ts';

const row = (p: Payment, tag: string): string =>
  `<tr><td>${tag}</td><td><code>${esc(p.id)}</code></td><td>${esc(p.vendor)}</td><td>${esc(p.invoice)}</td><td>${esc(p.paymentDate)}</td><td style="text-align:right">${esc(money(p.cents / 100, p.currency))}</td></tr>`;

function clusterBlock(c: Cluster): string {
  return `<h3>${esc(c.id)} <span class="pill ${c.confidence === 'high' ? 'error' : c.confidence === 'medium' ? 'review' : 'info'}">${c.confidence}</span> · at risk ${esc(money(c.exposureCents / 100, c.currency))}</h3>
<table><tr><th></th><th>Payment</th><th>Vendor</th><th>Invoice</th><th>Paid</th><th style="text-align:right">Amount</th></tr>${row(c.original, 'Original')}${c.duplicates.map((d) => row(d, 'Suspected duplicate')).join('')}</table>
<p class="sub">Why: ${c.reasons.map(esc).join('; ')}.</p>`;
}

export function renderDuplicateReport(opts: { result: DuplicateResult; client?: string; generatedAt?: Date }): string {
  const { result } = opts;
  const high = result.clusters.filter((c) => c.confidence === 'high');
  const medium = result.clusters.filter((c) => c.confidence === 'medium');
  const low = result.pairs.filter((p) => p.confidence === 'low');
  const sum = (cs: Cluster[]): Record<string, number> => cs.reduce<Record<string, number>>((a, c) => ((a[c.currency] = (a[c.currency] ?? 0) + c.exposureCents), a), {});
  const fmtSum = (s: Record<string, number>): string => Object.entries(s).map(([cur, c]) => money(c / 100, cur)).join(' + ') || '0.00';
  const total = result.payments.reduce<Record<string, number>>((a, p) => ((a[p.currency] = (a[p.currency] ?? 0) + Math.abs(p.cents)), a), {});
  const body = `
<h2>Summary</h2>
<p>${result.payments.length} payments checked (${esc(fmtSum(total))}). We found <b>${high.length} high-confidence duplicate groups</b> putting <b>${esc(fmtSum(sum(high)))}</b> at risk, and ${medium.length} groups worth a second look (${esc(fmtSum(sum(medium)))}). ${result.recurringVendors} recurring payment series (rent, subscriptions) were recognised and not flagged.</p>
<div class="tiles">
<div class="tile"><b>${high.length}</b><span>high-confidence groups</span></div>
<div class="tile"><b>${esc(fmtSum(sum(high)))}</b><span>at risk (high)</span></div>
<div class="tile"><b>${medium.length}</b><span>to review</span></div>
<div class="tile"><b>${result.payments.length}</b><span>payments checked</span></div>
</div>
<h2>High confidence: recover or block</h2>
${high.length ? high.slice(0, 150).map(clusterBlock).join('') : '<p>None found.</p>'}
${high.length > 150 ? `<p class="sub">Showing 150 of ${high.length}; the full list is in the CSV.</p>` : ''}
<h2>Medium confidence: review</h2>
${medium.length ? medium.slice(0, 100).map(clusterBlock).join('') : '<p>None found.</p>'}
<h2>Low confidence (listed in the CSV only)</h2>
<p>${low.length} pairs, such as the same invoice paid with different amounts (partial payments or unapplied credit notes) and round amounts repeated within the window.</p>
<h2>How this was done</h2>
<p>Vendor names are normalised (legal forms, punctuation and case removed) and invoice numbers are reduced to their core characters, so "INV-0012345" and "12345" compare as the same document. Payments are compared on amount, vendor, bank account, invoice number and date. High confidence means the same amount and the same or nearly the same invoice for the same supplier, including suppliers that exist twice in the vendor master. Medium confidence means the same supplier and amount paid within 30 days under different references. Recurring series are excluded. Every flag lists its reasons, and nothing is blocked automatically.</p>`;
  return reportPage({ title: 'Duplicate Payment Review', subtitle: opts.client ? `Prepared for ${opts.client}` : 'Accounts payable', body, generatedAt: opts.generatedAt });
}

export function clustersToRows(result: DuplicateResult): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const c of result.clusters)
    for (const [i, p] of [c.original, ...c.duplicates].entries())
      out.push({ group: c.id, confidence: c.confidence, role: i === 0 ? 'original' : 'suspected duplicate', payment_id: p.id, vendor: p.vendor, invoice: p.invoice, payment_date: p.paymentDate, amount: (p.cents / 100).toFixed(2), currency: p.currency, reasons: c.reasons.join('; ') });
  for (const pr of result.pairs.filter((x) => x.confidence === 'low')) out.push({ group: '', confidence: 'low', role: 'pair', payment_id: `${pr.a} / ${pr.b}`, reasons: pr.reasons.join('; ') });
  return out;
}
