// EN 16931 business rules (and the Peppol and XRechnung rules most often broken), written as
// Hyniqe Rules: each rule has an ID, its source, a plain-English meaning and executable logic.
import { ibanValid } from '../../../engine/src/address/iban.ts';
import type { Invoice } from './invoice.ts';

export interface Rule {
  id: string;
  source: string;
  level: 'error' | 'warning';
  title: string;
  /** Returns one message per problem found, or an empty list. */
  check: (inv: Invoice) => string[];
}

const TOL = 0.011;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (xs: (number | null)[]) => round2(xs.reduce((a: number, b) => a + (b ?? 0), 0));
const money = (n: number | null, c: string) => (n === null ? '(missing)' : `${n.toFixed(2)} ${c}`);
const differs = (a: number | null, b: number | null) => a !== null && b !== null && Math.abs(a - b) > TOL;
const req = (ok: unknown, msg: string): string[] => (ok ? [] : [msg]);
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
const TYPES = new Set(['380', '381', '383', '384', '386', '389', '751', '326', '261', '262', '295', '875', '876', '877', '393', '394', '395', '396', '420', '456', '457', '527', '532', '553', '575', '623', '633', '780', '817', '870', '875', '935', '82', '80', '84', '102', '218', '219', '331', '382', '385', '387', '388', '390', '471', '472', '473']);
const COUNTRY_VAT_PREFIX: Record<string, string> = { GR: 'EL' };

export const RULES: Rule[] = [
  { id: 'BR-01', source: 'EN 16931-1 BR-01', level: 'error', title: 'The invoice must say which specification it follows', check: (i) => req(i.customization, 'No specification identifier (CustomizationID / GuidelineSpecifiedDocumentContextParameter).') },
  { id: 'BR-02', source: 'EN 16931-1 BR-02', level: 'error', title: 'The invoice must have a number', check: (i) => req(i.number, 'No invoice number.') },
  { id: 'BR-03', source: 'EN 16931-1 BR-03', level: 'error', title: 'The invoice must have a valid issue date', check: (i) => req(isDate(i.issueDate), `Issue date "${i.issueDate}" is missing or not a real date.`) },
  { id: 'BR-04', source: 'EN 16931-1 BR-04, UNTDID 1001', level: 'error', title: 'The invoice type code must be valid', check: (i) => req(TYPES.has(i.typeCode), `Type code "${i.typeCode}" is not a valid invoice type (380 is a normal invoice, 381 a credit note).`) },
  { id: 'BR-05', source: 'EN 16931-1 BR-05', level: 'error', title: 'The invoice currency must be given', check: (i) => req(/^[A-Z]{3}$/.test(i.currency), `Currency "${i.currency}" is missing or not a three-letter code.`) },
  { id: 'BR-06', source: 'EN 16931-1 BR-06', level: 'error', title: 'The seller must have a name', check: (i) => req(i.seller.name, 'The seller has no name.') },
  { id: 'BR-07', source: 'EN 16931-1 BR-07', level: 'error', title: 'The buyer must have a name', check: (i) => req(i.buyer.name, 'The buyer has no name.') },
  { id: 'BR-09', source: 'EN 16931-1 BR-08, BR-09', level: 'error', title: 'The seller address must include a country', check: (i) => req(/^[A-Z]{2}$/.test(i.seller.country), 'The seller address has no country code.') },
  { id: 'BR-11', source: 'EN 16931-1 BR-10, BR-11', level: 'error', title: 'The buyer address must include a country', check: (i) => req(/^[A-Z]{2}$/.test(i.buyer.country), 'The buyer address has no country code.') },
  { id: 'BR-12', source: 'EN 16931-1 BR-12 to BR-15', level: 'error', title: 'The document totals must be present', check: (i) => (['lineTotal', 'taxExclusive', 'taxInclusive', 'payable'] as const).filter((k) => i.totals[k] === null).map((k) => `The total "${k}" is missing.`) },
  { id: 'BR-16', source: 'EN 16931-1 BR-16', level: 'error', title: 'The invoice must have at least one line', check: (i) => req(i.lines.length, 'The invoice has no lines.') },
  {
    id: 'BR-21', source: 'EN 16931-1 BR-21 to BR-26', level: 'error', title: 'Every line needs an ID, quantity, unit, net amount, item name and price',
    check: (i) => i.lines.flatMap((l, k) => {
      const miss = [!l.id && 'line ID', l.quantity === null && 'quantity', !l.unit && 'unit of measure', l.net === null && 'net amount', !l.name && 'item name', l.price === null && 'net price'].filter(Boolean);
      return miss.length ? [`Line ${l.id || k + 1} has no ${miss.join(', ')}.`] : [];
    }),
  },
  { id: 'BR-27', source: 'EN 16931-1 BR-27', level: 'error', title: 'Item prices cannot be negative', check: (i) => i.lines.filter((l) => (l.price ?? 0) < 0).map((l) => `Line ${l.id}: the price ${l.price} is negative. Use a negative quantity or an allowance instead.`) },
  { id: 'BR-CO-10', source: 'EN 16931-1 BR-CO-10', level: 'error', title: 'The line total must equal the sum of the line net amounts', check: (i) => (differs(i.totals.lineTotal, sum(i.lines.map((l) => l.net))) ? [`The lines add up to ${money(sum(i.lines.map((l) => l.net)), i.currency)}, but the invoice says ${money(i.totals.lineTotal, i.currency)}.`] : []) },
  { id: 'BR-CO-11', source: 'EN 16931-1 BR-CO-11, BR-CO-12', level: 'error', title: 'Allowance and charge totals must equal their parts', check: (i) => [...(differs(i.totals.allowanceTotal ?? 0, sum(i.allowances)) ? [`Document allowances add up to ${money(sum(i.allowances), i.currency)}, but the total says ${money(i.totals.allowanceTotal, i.currency)}.`] : []), ...(differs(i.totals.chargeTotal ?? 0, sum(i.charges)) ? [`Document charges add up to ${money(sum(i.charges), i.currency)}, but the total says ${money(i.totals.chargeTotal, i.currency)}.`] : [])] },
  {
    id: 'BR-CO-13', source: 'EN 16931-1 BR-CO-13', level: 'error', title: 'Total without VAT = line total − allowances + charges',
    check: (i) => {
      const exp = round2((i.totals.lineTotal ?? 0) - (i.totals.allowanceTotal ?? 0) + (i.totals.chargeTotal ?? 0));
      return differs(i.totals.taxExclusive, exp) ? [`The total without VAT should be ${money(exp, i.currency)}, but the invoice says ${money(i.totals.taxExclusive, i.currency)}.`] : [];
    },
  },
  { id: 'BR-CO-14', source: 'EN 16931-1 BR-CO-14', level: 'error', title: 'The VAT total must equal the sum of the VAT breakdown', check: (i) => (differs(i.totals.taxTotal ?? 0, sum(i.taxes.map((t) => t.tax))) ? [`The VAT breakdown adds up to ${money(sum(i.taxes.map((t) => t.tax)), i.currency)}, but the VAT total says ${money(i.totals.taxTotal, i.currency)}.`] : []) },
  {
    id: 'BR-CO-15', source: 'EN 16931-1 BR-CO-15', level: 'error', title: 'Total with VAT = total without VAT + VAT',
    check: (i) => {
      const exp = round2((i.totals.taxExclusive ?? 0) + (i.totals.taxTotal ?? 0));
      return differs(i.totals.taxInclusive, exp) ? [`The total with VAT should be ${money(exp, i.currency)}, but the invoice says ${money(i.totals.taxInclusive, i.currency)}.`] : [];
    },
  },
  {
    id: 'BR-CO-16', source: 'EN 16931-1 BR-CO-16', level: 'error', title: 'Amount due = total with VAT − prepaid + rounding',
    check: (i) => {
      const exp = round2((i.totals.taxInclusive ?? 0) - (i.totals.prepaid ?? 0) + (i.totals.rounding ?? 0));
      return differs(i.totals.payable, exp) ? [`The amount due should be ${money(exp, i.currency)}, but the invoice says ${money(i.totals.payable, i.currency)}.`] : [];
    },
  },
  {
    id: 'BR-S-08', source: 'EN 16931-1 BR-S-08 and equivalents per category', level: 'error', title: 'Each VAT rate’s taxable amount must equal its lines',
    check: (i) => {
      if (i.allowances.length || i.charges.length) return [];
      const out: string[] = [];
      for (const t of i.taxes) {
        const lines = sum(i.lines.filter((l) => l.category === t.category && (l.rate ?? 0) === (t.rate ?? 0)).map((l) => l.net));
        if (differs(t.taxable, lines)) out.push(`VAT ${t.category} ${t.rate ?? 0}%: taxable amount ${money(t.taxable, i.currency)}, but its lines add up to ${money(lines, i.currency)}.`);
      }
      for (const l of i.lines) if (!i.taxes.some((t) => t.category === l.category && (t.rate ?? 0) === (l.rate ?? 0))) out.push(`Line ${l.id} uses VAT ${l.category} ${l.rate ?? 0}%, which is missing from the VAT breakdown.`);
      return out;
    },
  },
  {
    id: 'BR-S-09', source: 'EN 16931-1 BR-S-09 and equivalents', level: 'error', title: 'VAT amount = taxable amount × rate',
    check: (i) => i.taxes.filter((t) => t.taxable !== null && t.rate !== null && t.tax !== null && Math.abs(round2((t.taxable! * t.rate!) / 100) - t.tax!) > TOL).map((t) => `VAT ${t.category} ${t.rate}% on ${money(t.taxable, i.currency)} should be ${money(round2((t.taxable! * t.rate!) / 100), i.currency)}, but the invoice says ${money(t.tax, i.currency)}.`),
  },
  { id: 'BR-E-10', source: 'EN 16931-1 BR-E-10, BR-AE-10, BR-IC-10, BR-G-10', level: 'error', title: 'Exempt, reverse-charge and export VAT need a reason', check: (i) => i.taxes.filter((t) => ['E', 'AE', 'K', 'G', 'O'].includes(t.category) && !t.exemptionReason).map((t) => `VAT category ${t.category} has no exemption reason text or code.`) },
  { id: 'BR-AE-02', source: 'EN 16931-1 BR-AE-02', level: 'error', title: 'Reverse charge needs both VAT numbers', check: (i) => (i.taxes.some((t) => t.category === 'AE') && (!i.seller.vatId || !i.buyer.vatId) ? ['Reverse charge (AE) is used, but the seller or buyer VAT number is missing.'] : []) },
  {
    id: 'BR-CO-09', source: 'EN 16931-1 BR-CO-09', level: 'error', title: 'VAT numbers must start with a country code',
    check: (i) => [['seller', i.seller], ['buyer', i.buyer]].flatMap(([role, p]) => {
      const v = (p as Invoice['seller']).vatId.replace(/\s/g, '');
      return v && !/^[A-Z]{2}/.test(v) ? [`The ${role} VAT number "${v}" does not start with a two-letter country prefix.`] : [];
    }),
  },
  {
    id: 'HY-VAT-COUNTRY', source: 'Hyniqe rule', level: 'warning', title: 'The seller’s VAT prefix should match the seller’s country',
    check: (i) => {
      const v = i.seller.vatId.replace(/\s/g, '').slice(0, 2);
      const c = i.seller.country;
      return v && c && /^[A-Z]{2}$/.test(v) && v !== (COUNTRY_VAT_PREFIX[c] ?? c) ? [`The seller VAT number starts with ${v} but the seller is in ${c}. That is fine for a foreign VAT registration; otherwise one of them is wrong.`] : [];
    },
  },
  { id: 'BR-CO-25', source: 'EN 16931-1 BR-CO-25', level: 'error', title: 'If money is due, give a due date or payment terms', check: (i) => ((i.totals.payable ?? 0) > 0 && !i.dueDate && !i.payment.terms ? ['An amount is due, but there is neither a due date nor payment terms.'] : []) },
  { id: 'BR-61', source: 'EN 16931-1 BR-61', level: 'error', title: 'Credit transfer needs the payee account', check: (i) => (['30', '58'].includes(i.payment.meansCode) && !i.payment.iban ? [`Payment by credit transfer (code ${i.payment.meansCode}) but no account to pay into.`] : []) },
  { id: 'HY-IBAN', source: 'Hyniqe rule, ISO 13616', level: 'error', title: 'The IBAN must pass its check digits', check: (i) => { const s = i.payment.iban.replace(/\s/g, '').toUpperCase(); return /^[A-Z]{2}\d{2}/.test(s) && !ibanValid(s) ? [`The IBAN ${i.payment.iban} fails its check digits, so the buyer cannot pay it.`] : []; } },
  {
    id: 'HY-LINE', source: 'Hyniqe rule (EN 16931 BT-131 calculation)', level: 'warning', title: 'Line net amount should equal quantity × price',
    check: (i) => i.lines.filter((l) => !l.hasAllowance && l.quantity !== null && l.price !== null && l.net !== null && Math.abs(round2((l.quantity * l.price) / (l.baseQuantity || 1)) - l.net) > TOL).map((l) => `Line ${l.id}: ${l.quantity} × ${l.price} = ${round2((l.quantity! * l.price!) / (l.baseQuantity || 1)).toFixed(2)}, but the line says ${l.net!.toFixed(2)}.`),
  },
  { id: 'HY-DUE', source: 'Hyniqe rule', level: 'warning', title: 'The due date should not be before the issue date', check: (i) => (i.dueDate && isDate(i.dueDate) && isDate(i.issueDate) && i.dueDate < i.issueDate ? [`The due date ${i.dueDate} is before the issue date ${i.issueDate}.`] : []) },
  { id: 'PEPPOL-R003', source: 'Peppol BIS Billing 3.0 PEPPOL-EN16931-R003', level: 'error', title: 'Peppol invoices need a buyer reference or an order reference', check: (i) => (/peppol/i.test(i.customization) && !i.buyerReference && !i.orderReference ? ['Peppol requires a buyer reference or a purchase order reference.'] : []) },
  { id: 'PEPPOL-R010', source: 'Peppol BIS Billing 3.0 PEPPOL-EN16931-R010, R020', level: 'error', title: 'Peppol invoices need electronic addresses for seller and buyer', check: (i) => (/peppol/i.test(i.customization) ? [...req(i.seller.endpoint, 'The seller has no electronic address (Peppol ID).'), ...req(i.buyer.endpoint, 'The buyer has no electronic address (Peppol ID).')] : []) },
  { id: 'BR-DE-15', source: 'XRechnung BR-DE-15', level: 'error', title: 'XRechnung needs the buyer reference (Leitweg-ID)', check: (i) => (/xrechnung/i.test(i.customization) && !i.buyerReference ? ['XRechnung requires the buyer reference (for public buyers, the Leitweg-ID).'] : []) },
];
