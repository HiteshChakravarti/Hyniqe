// Usage: node solutions/payment-message-explainer/cli.ts message.txt|message.xml [--out dir]
//        node solutions/payment-message-explainer/cli.ts --sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { explain } from './src/explain.ts';
import { renderExplanation } from './src/report.ts';
import { generatePair } from './src/sample.ts';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const input = args.find((a, i) => !a.startsWith('--') && i !== oi + 1);
if (!input && !args.includes('--sample')) {
  console.error('Usage: node solutions/payment-message-explainer/cli.ts message.txt|message.xml [--out dir]');
  process.exit(2);
}
const e = explain(input ? readFileSync(input, 'utf8') : generatePair(1).mt);
const out = oi >= 0 ? args[oi + 1] : 'out/payment-message-explainer';
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'message-explained.html'), renderExplanation(e));
writeFileSync(join(out, e.converted.filename), e.converted.text);
console.log(e.summary);
for (const f of e.findings) console.log(`${f.level.toUpperCase()} ${f.where}: ${f.message}`);
console.log(`Report and ${e.converted.format} in ${out}`);
