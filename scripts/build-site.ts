// Builds the Hyniqe Hub website into docs/ (served by GitHub Pages): pages from site/, browser modules from the solutions.
// The solutions are written in TypeScript with no dependencies; Node's built-in type stripping
// turns them into plain ES modules, mirrored under docs/lib so relative imports keep working.
// Usage: node scripts/build-site.ts   (run by the Pages workflow; generated files are not committed)

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { toCsv } from '../solutions/shared/csv.ts';
import { generateSsis } from '../solutions/ssi-checker/src/sample.ts';
import { generatePayments } from '../solutions/duplicate-payments/src/sample.ts';
import { generatePaymentFile } from '../solutions/payment-file-doctor/src/sample.ts';
import { sampleStatement, toCamt053, toMt940 } from '../solutions/bank-statement-converter/src/sample.ts';
import { TEMPLATE } from '../solutions/excel-to-payment-file/src/convert.ts';
import { generateNotices } from '../solutions/corporate-actions-checker/src/sample.ts';
import { generateVendors } from '../solutions/vendor-master-cleanup/src/sample.ts';
import { generateStatus } from '../solutions/payment-returns-triage/src/sample.ts';
import { generateTable } from '../solutions/data-quality-scorecard/src/sample.ts';
import { generateRun } from '../solutions/bank-detail-change-check/src/sample.ts';
import { generateInvoice } from '../solutions/e-invoice-checker/src/sample.ts';
import { homePage, searchIndex, toolPage } from '../site/render.ts';
import { TOOLS } from '../site/tools.ts';

const root = join(import.meta.dirname, '..');
const SOURCES = [
  'solutions/shared/csv.ts',
  'solutions/shared/html.ts',
  'solutions/ssi-checker/src/ssi.ts',
  'solutions/ssi-checker/src/csd.ts',
  'solutions/ssi-checker/src/report.ts',
  'solutions/ssi-checker/src/sample.ts',
  'solutions/duplicate-payments/src/duplicates.ts',
  'solutions/duplicate-payments/src/report.ts',
  'solutions/duplicate-payments/src/sample.ts',
  'solutions/payment-data-repair/src/repair.ts',
  'solutions/payment-data-repair/src/report.ts',
  'solutions/shared/xml.ts',
  'solutions/payment-file-doctor/src/doctor.ts',
  'solutions/payment-file-doctor/src/build.ts',
  'solutions/payment-file-doctor/src/report.ts',
  'solutions/bank-statement-converter/src/statement.ts',
  'solutions/bank-statement-converter/src/report.ts',
  'solutions/excel-to-payment-file/src/convert.ts',
  'solutions/corporate-actions-checker/src/events.ts',
  'solutions/corporate-actions-checker/src/report.ts',
  'solutions/corporate-actions-checker/src/sample.ts',
  'solutions/vendor-master-cleanup/src/vendors.ts',
  'solutions/vendor-master-cleanup/src/report.ts',
  'solutions/payment-returns-triage/src/codes.ts',
  'solutions/payment-returns-triage/src/triage.ts',
  'solutions/payment-returns-triage/src/report.ts',
  'solutions/data-quality-scorecard/src/profile.ts',
  'solutions/data-quality-scorecard/src/report.ts',
  'solutions/bank-detail-change-check/src/check.ts',
  'solutions/bank-detail-change-check/src/report.ts',
  'solutions/payment-message-explainer/src/model.ts',
  'solutions/payment-message-explainer/src/mt103.ts',
  'solutions/payment-message-explainer/src/pacs008.ts',
  'solutions/payment-message-explainer/src/explain.ts',
  'solutions/payment-message-explainer/src/report.ts',
  'solutions/e-invoice-checker/src/invoice.ts',
  'solutions/e-invoice-checker/src/rules.ts',
  'solutions/e-invoice-checker/src/check.ts',
  'solutions/e-invoice-checker/src/report.ts',
  'engine/src/address/countries.ts',
  'engine/src/address/gazetteer.ts',
  'engine/src/address/postcodes.ts',
  'engine/src/address/parse.ts',
  'engine/src/address/iban.ts',
  'engine/src/address/repair.ts',
];

const outputs = new Map<string, string>();

// Pages: one home page and one page per tool, plus the site's own scripts and styles.
outputs.set('docs/index.html', homePage());
for (const t of TOOLS) outputs.set(`docs/tools/${t.slug}/index.html`, toolPage(t));
outputs.set('docs/assets/tool-index.js', searchIndex());
const copyDir = (from: string, to: string): void => {
  for (const e of readdirSync(join(root, from), { withFileTypes: true })) {
    if (e.isDirectory()) copyDir(join(from, e.name), join(to, e.name));
    else outputs.set(join(to, e.name), readFileSync(join(root, from, e.name), 'utf8'));
  }
};
copyDir('site/assets', 'docs/assets');
outputs.set('docs/.nojekyll', '');

for (const rel of SOURCES) {
  const ts = readFileSync(join(root, rel), 'utf8');
  const js = stripTypeScriptTypes(ts, { mode: 'strip' })
    .replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, (m) => m.replace('.ts', '.js'));
  outputs.set(join('docs/lib', rel.replace(/\.ts$/, '.js')), `// Generated from ${rel} by scripts/build-site.ts. Do not edit.\n${js}`);
}

const ssi = generateSsis({ count: 120, seed: 4 });
outputs.set('docs/samples/ssi-ours.csv', toCsv(ssi.rows));
outputs.set('docs/samples/ssi-golden-source.csv', toCsv(ssi.golden));
outputs.set('docs/samples/payments.csv', toCsv(generatePayments({ count: 600, seed: 12 }).rows, ['payment_id', 'vendor_id', 'vendor_name', 'invoice_number', 'invoice_date', 'payment_date', 'amount', 'currency', 'iban']));

outputs.set('docs/samples/payment-file-v03.xml', generatePaymentFile({ seed: 3, count: 12, version: '03', defectRate: 0.5, headerWrong: true, executionDate: '2026-11-16' }).xml);
const st = sampleStatement(4, 18);
outputs.set('docs/samples/statement-camt053.xml', toCamt053(st));
outputs.set('docs/samples/statement.mt940', toMt940(st));
outputs.set('docs/samples/payments-to-send.csv', TEMPLATE);
outputs.set('docs/samples/corporate-actions.csv', toCsv(generateNotices({ seed: 8, events: 30 }).rows));
outputs.set('docs/samples/vendor-master.csv', generateVendors({ seed: 9, count: 120 }).csv);
outputs.set('docs/samples/status-report-pain002.xml', generateStatus({ seed: 6, count: 60, format: 'pain.002.001.10' }).text);
outputs.set('docs/samples/trades.csv', generateTable({ seed: 3, rows: 250 }).csv);

{
  const g = generateRun({ seed: 12, vendors: 40, payments: 45 });
  outputs.set('docs/samples/payment-run.csv', toCsv(g.run));
  outputs.set('docs/samples/payment-history.csv', toCsv(g.history));
}
outputs.set('docs/samples/mt103.txt', `{1:F01BANKBEBBAXXX0000000000}{2:I103BANKDEFFXXXXN}{3:{121:eb6305c9-1f7f-49de-aed0-16487c27b42d}}{4:
:20:494931/DEV
:23B:CRED
:32A:261123EUR1958,47
:33B:EUR1958,47
:50K:/BE68539007547034
PETER MAIER
HOCHSTRASSE 27
8400 WINTERTHUR SWITZERLAND
:59:/DE89370400440532013000
REDWOOD TEXTILES GMBH
VIA ROMA 20
20121 MILANO ITALY
:70:INVOICE 4711
:71A:BEN
-}
`);
outputs.set('docs/samples/e-invoice-peppol.xml', generateInvoice(42, 'BR-S-09', 'UBL'));

const vendors = join(root, 'engine/data/vendor_master_sample.csv');
if (existsSync(vendors)) outputs.set('docs/samples/vendors.csv', readFileSync(vendors, 'utf8'));
else console.warn('engine/data/vendor_master_sample.csv not found; run "cd engine && npm run seed" for the Payment Data Repair sample.');

const bench: Record<string, unknown> = {};
for (const [k, f] of [['ssi', 'benchmark-ssi-checker.json'], ['duplicates', 'benchmark-duplicate-payments.json'], ['doctor', 'benchmark-payment-file-doctor.json'], ['corporateActions', 'benchmark-corporate-actions.json'], ['vendors', 'benchmark-vendor-master.json'], ['returns', 'benchmark-returns.json'], ['dataQuality', 'benchmark-data-quality.json'], ['bankDetail', 'benchmark-bank-detail-change.json'], ['explainer', 'benchmark-message-explainer.json'], ['einvoice', 'benchmark-e-invoice.json'], ['address', 'engine/out/benchmark-holdout.json']] as const) {
  const p = f.startsWith('engine') ? join(root, f) : join(root, 'out', f);
  if (existsSync(p)) bench[k] = JSON.parse(readFileSync(p, 'utf8'));
}
outputs.set('docs/lib/benchmarks.js', `// Generated by scripts/build-site.ts from the latest benchmark runs.\nexport const BENCHMARKS = ${JSON.stringify(bench, null, 2)};\n`);

rmSync(join(root, 'docs'), { recursive: true, force: true });
for (const [rel, content] of outputs) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}
console.log(`Wrote ${outputs.size} files to docs/.`);
