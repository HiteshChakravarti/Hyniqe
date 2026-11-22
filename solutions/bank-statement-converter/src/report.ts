// Statement summary report and spreadsheet export.
import { toCsv } from '../../shared/csv.ts';
import { esc, money, reportPage } from '../../shared/html.ts';
import type { ConvertResult } from './statement.ts';

export const COLUMNS = ['statement', 'account', 'bookingDate', 'valueDate', 'direction', 'amount', 'currency', 'counterparty', 'counterpartyAccount', 'reference', 'endToEndId', 'bankReference', 'type', 'status'];
const HEADERS = ['Statement', 'Account', 'Booking date', 'Value date', 'In/Out', 'Amount', 'Currency', 'Counterparty', 'Counterparty account', 'Reference', 'End-to-end ID', 'Bank reference', 'Type', 'Status'];

/** CSV with a byte-order mark so Excel shows accented names correctly. */
export function toSpreadsheet(r: ConvertResult): string {
  const rows = r.transactions.map((t) => Object.fromEntries(COLUMNS.map((c, i) => [HEADERS[i], c === 'amount' ? t.amount.toFixed(2) : (t as unknown as Record<string, unknown>)[c]])));
  return '﻿' + toCsv(rows, HEADERS);
}

export function renderStatementReport(r: ConvertResult, opts: { fileName?: string; generatedAt?: Date } = {}): string {
  const fmt = (n: number | null, c: string): string => (n === null ? 'not in file' : money(n, c));
  const body = `
<h2>Summary</h2>
<p>${r.statements.length} statement${r.statements.length === 1 ? '' : 's'} (${esc(r.format)}) with ${r.transactions.length} transactions. ${r.warnings.length ? `<b>${r.warnings.length} balance check${r.warnings.length === 1 ? '' : 's'} failed</b>: see below.` : 'Every statement balances: opening balance plus transactions equals the closing balance.'}</p>
<h2>Statements</h2>
<table><tr><th>Statement</th><th>Account</th><th>Period</th><th>Opening</th><th>Money in</th><th>Money out</th><th>Closing</th><th>Check</th></tr>
${r.statements.map((s) => `<tr><td>${esc(s.id)}</td><td><code>${esc(s.account)}</code></td><td>${esc(s.from)} to ${esc(s.to)}</td><td>${fmt(s.opening, s.currency)}</td><td>${money(s.credits, s.currency)}</td><td>${money(s.debits, s.currency)}</td><td>${fmt(s.closing, s.currency)}</td><td>${s.difference === null ? '<span class="pill review">no balances</span>' : s.difference === 0 ? '<span class="pill ok">balances</span>' : `<span class="pill error">off by ${s.difference.toFixed(2)}</span>`}</td></tr>`).join('')}</table>
${r.warnings.length ? `<h2>Warnings</h2><ul>${r.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
<h2>Transactions</h2>
<table><tr><th>Date</th><th>Counterparty</th><th>Reference</th><th>Type</th><th style="text-align:right">Amount</th></tr>
${r.transactions.slice(0, 500).map((t) => `<tr><td>${esc(t.bookingDate)}</td><td>${esc(t.counterparty)}</td><td>${esc(t.reference)}</td><td>${esc(t.type)}</td><td style="text-align:right">${money(t.amount, t.currency)}</td></tr>`).join('')}</table>
${r.transactions.length > 500 ? `<p class="sub">Showing 500 of ${r.transactions.length}; the spreadsheet has them all.</p>` : ''}`;
  return reportPage({ title: 'Bank statement', subtitle: opts.fileName ?? r.format, body, generatedAt: opts.generatedAt });
}
