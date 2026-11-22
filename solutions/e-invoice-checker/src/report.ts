// A readable invoice plus the rule check results.
import { esc, reportPage } from '../../shared/html.ts';
import type { CheckResult } from './check.ts';
import type { InvParty } from './invoice.ts';

const m = (n: number | null, c: string) => (n === null ? '' : `${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${esc(c)}`);
const party = (p: InvParty) => `<b>${esc(p.name)}</b><br>${esc(p.street)}<br>${esc([p.postcode, p.town].filter(Boolean).join(' '))}<br>${esc(p.country)}${p.vatId ? `<br>VAT ${esc(p.vatId)}` : ''}${p.endpoint ? `<br><small>e-address ${esc(p.endpoint)}</small>` : ''}`;

export function invoiceHtml(r: CheckResult): string {
  const i = r.invoice;
  const c = i.currency;
  return `<div class="invoice">
<table><tr><td style="width:50%">${party(i.seller)}</td><td>${party(i.buyer)}</td></tr></table>
<p><b>${i.kind === 'CreditNote' ? 'Credit note' : 'Invoice'} ${esc(i.number)}</b> · issued ${esc(i.issueDate)}${i.dueDate ? ` · due ${esc(i.dueDate)}` : ''}${i.buyerReference ? ` · buyer reference ${esc(i.buyerReference)}` : ''}${i.orderReference ? ` · order ${esc(i.orderReference)}` : ''}</p>
<table><tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th>VAT</th><th>Net</th></tr>
${i.lines.map((l) => `<tr><td>${esc(l.id)}</td><td>${esc(l.name)}</td><td>${l.quantity ?? ''} ${esc(l.unit)}</td><td>${m(l.price, c)}</td><td>${esc(l.category)} ${l.rate ?? ''}%</td><td>${m(l.net, c)}</td></tr>`).join('')}
</table>
<table>
${i.taxes.map((t) => `<tr><td>VAT ${esc(t.category)} ${t.rate ?? 0}% on ${m(t.taxable, c)}${t.exemptionReason ? ` (${esc(t.exemptionReason)})` : ''}</td><td>${m(t.tax, c)}</td></tr>`).join('')}
<tr><td>Total without VAT</td><td>${m(i.totals.taxExclusive, c)}</td></tr>
<tr><td>VAT</td><td>${m(i.totals.taxTotal, c)}</td></tr>
<tr><td><b>Total with VAT</b></td><td><b>${m(i.totals.taxInclusive, c)}</b></td></tr>
${i.totals.prepaid ? `<tr><td>Already paid</td><td>${m(i.totals.prepaid, c)}</td></tr>` : ''}
<tr><td><b>Amount due</b></td><td><b>${m(i.totals.payable, c)}</b></td></tr>
</table>
${i.payment.iban ? `<p>Pay to IBAN <code>${esc(i.payment.iban)}</code>${i.payment.bic ? ` (BIC ${esc(i.payment.bic)})` : ''}${i.payment.terms ? ` · ${esc(i.payment.terms)}` : ''}</p>` : i.payment.terms ? `<p>${esc(i.payment.terms)}</p>` : ''}
${i.notes.filter(Boolean).map((n) => `<p><small>${esc(n)}</small></p>`).join('')}
</div>`;
}

export function renderInvoiceReport(r: CheckResult, opts: { fileName?: string; generatedAt?: Date } = {}): string {
  const body = `
<h2>Result</h2>
<p>${esc(r.standard)}${r.fromPdf ? ', read from the XML inside the PDF' : ''}. <b>${r.errors ? `${r.errors} rule${r.errors === 1 ? '' : 's'} broken` : 'No broken rules'}</b>${r.warnings ? `, ${r.warnings} warning${r.warnings === 1 ? '' : 's'}` : ''}.</p>
<table><tr><th></th><th>Rule</th><th>What is wrong</th><th>Source</th></tr>
${r.findings.map((f) => `<tr><td><span class="pill ${f.level === 'error' ? 'error' : 'review'}">${f.level}</span></td><td><code>${esc(f.rule)}</code><br><small>${esc(f.title)}</small></td><td>${esc(f.message)}</td><td><small>${esc(f.source)}</small></td></tr>`).join('') || '<tr><td colspan="4">Every checked rule passed.</td></tr>'}</table>
<h2>The invoice</h2>
${invoiceHtml(r)}
<h2>What was checked</h2>
<p>The EN 16931 business rules that cause most rejections (mandatory fields, every total and VAT calculation, VAT categories and exemption reasons, payment details), plus the Peppol and XRechnung rules for buyer references and electronic addresses. Full schema and Schematron validation by your access point or platform remains the final check.</p>`;
  return reportPage({ title: 'E-invoice check', subtitle: opts.fileName ?? r.invoice.number, body, generatedAt: opts.generatedAt });
}
