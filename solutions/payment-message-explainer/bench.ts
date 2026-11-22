// Reads generated MT103 / pacs.008 pairs with known content and checks every core field, and checks
// that each free-text address is turned into the right town and country.
// Usage: node solutions/payment-message-explainer/bench.ts [--out out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { explain } from './src/explain.ts';
import { parseMt103 } from './src/mt103.ts';
import { parsePacs008 } from './src/pacs008.ts';
import { ADDRESSES, generatePair, sameCore } from './src/sample.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const N = 500;
let mtOk = 0, mxOk = 0, roundOk = 0, addrN = 0, addrSuggested = 0, addrRight = 0;
for (let s = 1; s <= N; s++) {
  const g = generatePair(1000 + s);
  const skip = (d: string[]) => d.filter((x) => !/creditor\.(town|country)/.test(x) || g.creditorAddress < 0);
  if (!skip(sameCore(g.truth, parseMt103(g.mt).payment)).length) mtOk++;
  if (!skip(sameCore(g.truth, parsePacs008(g.mx))).length) mxOk++;
  const e = explain(g.mt, { createdAt: '2026-11-22T10:00:00+00:00' });
  const conv = parsePacs008(e.converted.text);
  if (!skip(sameCore(g.truth, conv)).length) roundOk++;
  for (const [role, idx] of [['debtor', g.debtorAddress], ['creditor', g.creditorAddress]] as const) {
    if (idx < 0) continue;
    addrN++;
    const p = conv[role];
    if (p.town && p.country) {
      addrSuggested++;
      if (p.town.toUpperCase() === ADDRESSES[idx].town && p.country === ADDRESSES[idx].country) addrRight++;
    }
  }
}
const pc = (a: number, b: number) => `${((100 * a) / Math.max(1, b)).toFixed(1)}%`;
const md = [
  `### Payment Message Explainer benchmark (generated message pairs)`,
  ``,
  `| Check | Result |`,
  `|---|---|`,
  `| MT103 read correctly (18 core fields) | ${mtOk} of ${N} |`,
  `| pacs.008 read correctly | ${mxOk} of ${N} |`,
  `| MT103 converted to pacs.008 and read back unchanged | ${roundOk} of ${N} |`,
  `| Free-text addresses given a structured town and country | ${addrSuggested} of ${addrN} (${pc(addrSuggested, addrN)}) |`,
  `| ... of which correct | ${addrRight} of ${addrSuggested} (${pc(addrRight, addrSuggested)}) |`,
].join('\n');
const out = oi >= 0 ? args[oi + 1] : 'out';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'benchmark-message-explainer.json'), JSON.stringify({ solution: 'payment-message-explainer', messages: N, mtOk, mxOk, roundOk, addrN, addrSuggested, addrRight, data: 'generated, labelled' }, null, 2));
writeFileSync(join(out, 'benchmark-message-explainer.md'), md + '\n');
console.log(md);
if (mtOk < N || mxOk < N || roundOk < N || addrRight < addrSuggested) {
  console.error('Quality gate failed.');
  process.exit(1);
}
