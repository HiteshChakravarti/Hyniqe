// Generated UBL and CII invoices (and Factur-X PDFs) with one labelled rule break each, plus clean ones.
// Usage: node solutions/e-invoice-checker/bench.ts [--out out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkFile, checkXml } from './src/check.ts';
import { facturxPdf, generateInvoice, INJECTED } from './src/sample.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const per: Record<string, { injected: number; detected: number }> = Object.fromEntries(INJECTED.map((k) => [k, { injected: 0, detected: 0 }]));
let invoices = 0, clean = 0, falseFlags = 0, pdfs = 0, pdfOk = 0;
for (const syntax of ['UBL', 'CII'] as const) {
  for (let s = 1; s <= 220; s++) {
    const kind = s % 4 === 0 ? null : INJECTED[s % INJECTED.length];
    const r = checkXml(generateInvoice(5000 + s, kind, syntax));
    invoices++;
    if (kind) {
      per[kind].injected++;
      if (r.findings.some((f) => f.rule === kind)) per[kind].detected++;
    } else {
      clean++;
      if (r.findings.length) falseFlags++;
    }
  }
}
for (let s = 1; s <= 20; s++) {
  pdfs++;
  const xml = generateInvoice(7000 + s, null, 'CII');
  const r = await checkFile(await facturxPdf(xml));
  if (r.fromPdf && r.findings.length === 0) pdfOk++;
}
const injected = Object.values(per).reduce((a, b) => a + b.injected, 0);
const detected = Object.values(per).reduce((a, b) => a + b.detected, 0);
const md = [
  `### E-invoice Checker benchmark (generated UBL and CII invoices)`,
  ``,
  `${invoices} invoices (half UBL, half CII), ${injected} with one rule broken on purpose, ${clean} correct ones, plus ${pdfs} Factur-X PDFs.`,
  ``,
  `| Rule broken | Injected | Found |`,
  `|---|---|---|`,
  ...Object.entries(per).map(([k, v]) => `| ${k} | ${v.injected} | ${v.detected} |`),
  ``,
  `**Found:** ${((100 * detected) / injected).toFixed(1)}% · **Correct invoices flagged:** ${falseFlags} of ${clean} · **Factur-X PDFs read:** ${pdfOk} of ${pdfs}`,
].join('\n');
const out = oi >= 0 ? args[oi + 1] : 'out';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-e-invoice.json'), JSON.stringify({ solution: 'e-invoice-checker', invoices, injected, detected, detect: detected / injected, clean, falseFlags, pdfs, pdfOk, perRule: per, data: 'generated, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-e-invoice.md'), md + '\n');
console.log(md);
if (detected < injected || falseFlags > 0 || pdfOk < pdfs) {
  console.error('Quality gate failed.');
  process.exit(1);
}
