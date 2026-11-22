// Data quality scorecard report.
import { esc, reportPage } from '../../shared/html.ts';
import type { Kind, Scorecard } from './profile.ts';

export const KIND_LABEL: Record<Kind, string> = { iban: 'IBAN', bic: 'BIC', lei: 'LEI', isin: 'ISIN', currency: 'Currency code', country: 'Country code', date: 'Date', email: 'Email', amount: 'Amount', number: 'Number', id: 'Identifier', text: 'Text' };
const p = (x: number | null): string => (x === null ? '' : `${(100 * x).toFixed(1)}%`);

export function renderScorecard(s: Scorecard, opts: { fileName?: string; generatedAt?: Date } = {}): string {
  const d = s.dimensions;
  const body = `
<h2>Summary</h2>
<p>${s.rows} rows and ${s.columns.length} columns. Overall score <b>${s.score} out of 100 (grade ${s.grade})</b>.${s.duplicateRows ? ` ${s.duplicateRows} rows are exact repeats of another row.` : ''}</p>
<div class="tiles"><div class="tile"><b>${p(d.completeness)}</b><span>completeness</span></div><div class="tile"><b>${p(d.validity)}</b><span>validity</span></div><div class="tile"><b>${p(d.uniqueness)}</b><span>uniqueness</span></div><div class="tile"><b>${p(d.consistency)}</b><span>consistency</span></div></div>
<h2>Columns</h2>
<table><tr><th>Column</th><th>Holds</th><th>Filled</th><th>Valid</th><th>Unique</th><th>Consistent</th><th>Problems, with examples</th></tr>
${s.columns.map((c) => {
    const probs = [
      c.blank ? `${c.blank} blank` : '',
      c.invalid ? `${c.invalid} invalid: ${c.invalidExamples.map((x) => `<code>${esc(x)}</code>`).join(' ')}` : '',
      c.duplicates ? `${c.duplicates} repeated: ${c.duplicateExamples.map((x) => `<code>${esc(x)}</code>`).join(' ')}` : '',
      c.inconsistent ? `${c.inconsistent} written differently: ${c.inconsistentExamples.map((x) => `<code>${esc(x)}</code>`).join(' ')}` : '',
    ].filter(Boolean).join('<br>');
    return `<tr><td><b>${esc(c.name)}</b></td><td>${KIND_LABEL[c.kind]}</td><td>${p(c.completeness)}</td><td>${p(c.validity)}</td><td>${p(c.uniqueness)}</td><td>${p(c.consistency)}</td><td>${probs || 'None'}</td></tr>`;
  }).join('')}</table>
${s.cross.length ? `<h2>Checks across columns</h2><table><tr><th>Rule</th><th>Columns</th><th>Rows checked</th><th>Failed</th><th>Examples</th></tr>${s.cross.map((c) => `<tr><td>${esc(c.rule)}</td><td>${esc(c.columns.join(', '))}</td><td>${c.checked}</td><td>${c.failed}</td><td>${c.examples.map((x) => `<code>${esc(x)}</code>`).join(' ')}</td></tr>`).join('')}</table>` : ''}
<h2>How the score is calculated</h2>
<p>Completeness is the share of filled cells. Validity is the share of values that pass their format's rules, including check digits for IBAN, LEI and ISIN, real calendar dates and ISO currency and country codes, plus the checks across columns. Uniqueness covers identifier columns and repeated rows. Consistency is the share of values written in the column's main style. The score weights them 30, 35, 15 and 20.</p>`;
  return reportPage({ title: 'Data quality scorecard', subtitle: opts.fileName ?? 'Table', body, generatedAt: opts.generatedAt });
}
