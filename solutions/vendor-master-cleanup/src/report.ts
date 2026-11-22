// Vendor master cleanup report.
import { esc, reportPage } from '../../shared/html.ts';
import type { CleanupResult } from './vendors.ts';

const TITLE: Record<string, string> = {
  DUPLICATE_VENDOR: 'Supplier set up more than once', SHARED_IBAN: 'Bank account shared by different suppliers', IBAN_INVALID: 'IBAN fails its check digits',
  IBAN_COUNTRY: 'Bank account in another country', BIC_FORMAT: 'BIC in the wrong format', BIC_COUNTRY: 'BIC and IBAN for different countries',
  VAT_FORMAT: 'VAT number in the wrong format', VAT_COUNTRY: 'VAT number for another country', MISSING_NAME: 'No name', MISSING_BANK: 'No bank account',
  MISSING_COUNTRY: 'No country', MISSING_TAX_ID: 'No VAT or tax number',
};
export const codeTitle = (c: string): string => TITLE[c] ?? c;

export function renderVendorReport(r: CleanupResult, opts: { generatedAt?: Date } = {}): string {
  const count = (c: string) => r.findings.filter((f) => f.code === c).length;
  const body = `
<h2>Summary</h2>
<p>${r.vendors.length} supplier records checked. <b>${r.affected} need attention.</b> ${r.clusters.length} suppliers appear more than once and ${count('SHARED_IBAN')} bank accounts are shared by different suppliers.</p>
<div class="tiles"><div class="tile"><b>${r.vendors.length}</b><span>records</span></div><div class="tile"><b>${r.clusters.length}</b><span>duplicate suppliers</span></div><div class="tile"><b>${count('SHARED_IBAN')}</b><span>shared bank accounts</span></div><div class="tile"><b>${r.affected}</b><span>records to fix</span></div></div>
<h2>Findings</h2>
<table><tr><th></th><th>Problem</th><th>Records</th><th>Detail</th><th>What to do</th></tr>
${r.findings.filter((f) => f.severity !== 'info').map((f) => `<tr><td><span class="pill ${f.severity}">${f.severity}</span></td><td>${esc(codeTitle(f.code))}</td><td>${f.ids.map((i) => `<code>${esc(i)}</code>`).join(' ')}</td><td>${esc(f.message)}</td><td>${esc(f.action)}</td></tr>`).join('') || '<tr><td colspan="5">No findings.</td></tr>'}</table>
<p>${count('MISSING_TAX_ID')} records have no VAT or tax number. They are not counted above, but adding them is the most reliable way to stop duplicates being created.</p>
<h2>How this was done</h2>
<p>Names are compared after removing legal forms (Ltd, GmbH, S.r.l., Sp. z o.o.), case, accents and punctuation, word by word, so one different word keeps two suppliers apart. Records are joined when the name matches in the same country, or when a similar name shares a bank account or VAT number. IBAN check digits, BIC format and VAT formats for 31 countries are checked locally.</p>`;
  return reportPage({ title: 'Vendor master cleanup', subtitle: 'Supplier records', body, generatedAt: opts.generatedAt });
}
