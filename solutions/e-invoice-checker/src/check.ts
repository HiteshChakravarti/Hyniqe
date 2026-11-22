// Runs the rules on an e-invoice and describes it.
import { parseInvoice, xmlFromPdf, type Invoice } from './invoice.ts';
import { RULES } from './rules.ts';

export interface Finding {
  rule: string;
  source: string;
  level: 'error' | 'warning';
  title: string;
  message: string;
}

export interface CheckResult {
  invoice: Invoice;
  standard: string;
  findings: Finding[];
  errors: number;
  warnings: number;
  fromPdf: boolean;
  xml: string;
}

export function describeStandard(inv: Invoice): string {
  const c = inv.customization.toLowerCase();
  const name = /xrechnung/.test(c) ? 'XRechnung' : /peppol/.test(c) ? 'Peppol BIS Billing 3.0' : /factur-x|zugferd|basic|extended|en16931/.test(c) && inv.syntax === 'CII' ? 'Factur-X / ZUGFeRD' : 'EN 16931';
  return `${name} (${inv.syntax === 'UBL' ? 'UBL 2.1' : 'UN/CEFACT CII'} ${inv.kind === 'CreditNote' ? 'credit note' : 'invoice'})`;
}

export function checkXml(xml: string, fromPdf = false): CheckResult {
  const invoice = parseInvoice(xml);
  const findings: Finding[] = [];
  for (const r of RULES) {
    let msgs: string[] = [];
    try {
      msgs = r.check(invoice);
    } catch (e) {
      msgs = [`The rule could not be checked: ${(e as Error).message}`];
    }
    for (const m of msgs) findings.push({ rule: r.id, source: r.source, level: r.level, title: r.title, message: m });
  }
  return { invoice, standard: describeStandard(invoice), findings, errors: findings.filter((f) => f.level === 'error').length, warnings: findings.filter((f) => f.level === 'warning').length, fromPdf, xml };
}

/** Accepts XML text or the bytes of an XML or Factur-X / ZUGFeRD PDF file. */
export async function checkFile(input: string | Uint8Array): Promise<CheckResult> {
  if (typeof input !== 'string') {
    const head = new TextDecoder().decode(input.subarray(0, 5));
    if (head === '%PDF-') {
      const xml = await xmlFromPdf(input);
      if (!xml) throw new Error('This PDF has no invoice XML inside it, so it is a plain PDF rather than a Factur-X or ZUGFeRD e-invoice.');
      return checkXml(xml, true);
    }
    input = new TextDecoder().decode(input);
  }
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  return checkXml(text);
}
