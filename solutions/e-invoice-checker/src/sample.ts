// Builds valid UBL and CII e-invoices from known data, with labelled defects, for tests and the benchmark.
import { makeIban } from '../../../engine/src/address/iban.ts';
import { rng } from '../../ssi-checker/src/sample.ts';

export const INJECTED = ['BR-CO-10', 'BR-CO-15', 'BR-S-09', 'BR-CO-16', 'HY-IBAN', 'BR-CO-25', 'PEPPOL-R003', 'BR-11', 'HY-LINE', 'BR-CO-09', 'BR-E-10'] as const;
export type Injected = (typeof INJECTED)[number];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const r2 = (n: number) => Math.round(n * 100) / 100;
const f2 = (n: number) => n.toFixed(2);

interface Data {
  number: string;
  issue: string;
  due: string;
  currency: string;
  buyerRef: string;
  seller: { name: string; vat: string; street: string; town: string; pc: string; country: string; endpoint: string };
  buyer: { name: string; vat: string; street: string; town: string; pc: string; country: string; endpoint: string };
  lines: { id: string; name: string; qty: number; price: number; net: number; cat: string; rate: number }[];
  taxes: { cat: string; rate: number; taxable: number; tax: number; reason: string }[];
  lineTotal: number;
  taxExcl: number;
  taxTotal: number;
  taxIncl: number;
  payable: number;
  iban: string;
  terms: string;
}

const SELLERS = [
  { name: 'Redwood Textiles GmbH', vat: 'DE123456789', street: 'Hauptstrasse 12', town: 'Berlin', pc: '10115', country: 'DE', endpoint: '0204:991-12345-67' },
  { name: 'Kestrel Logistics SAS', vat: 'FR12345678901', street: '12 rue de Rivoli', town: 'Paris', pc: '75001', country: 'FR', endpoint: '0009:12345678900015' },
  { name: 'Harbor Packaging B.V.', vat: 'NL123456789B01', street: 'Keizersgracht 100', town: 'Amsterdam', pc: '1015 CJ', country: 'NL', endpoint: '0106:12345678' },
  { name: 'Granite Metals NV', vat: 'BE0123456789', street: 'Rue Royale 10', town: 'Bruxelles', pc: '1000', country: 'BE', endpoint: '0208:0123456789' },
];
const ITEMS = ['Cotton fabric roll', 'Pallet transport', 'Cardboard boxes', 'Steel brackets', 'Consulting hours', 'Packing tape', 'Software licence'];

function build(seed: number): Data {
  const r = rng(seed);
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const seller = pick(SELLERS);
  const buyer = { ...pick(SELLERS.filter((s) => s !== seller)) };
  const rates = seller.country === 'DE' ? [19, 7] : seller.country === 'FR' ? [20, 5.5] : seller.country === 'NL' ? [21, 9] : [21, 6];
  const n = 1 + Math.floor(r() * 5);
  const lines = Array.from({ length: n }, (_, k) => {
    const qty = 1 + Math.floor(r() * 20);
    const price = r2(1 + r() * 300);
    const rate = r() < 0.75 ? rates[0] : rates[1];
    return { id: String(k + 1), name: pick(ITEMS), qty, price, net: r2(qty * price), cat: 'S', rate };
  });
  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(l.rate, r2((byRate.get(l.rate) ?? 0) + l.net));
  const taxes = [...byRate].map(([rate, taxable]) => ({ cat: 'S', rate, taxable, tax: r2((taxable * rate) / 100), reason: '' }));
  const lineTotal = r2(lines.reduce((a, l) => a + l.net, 0));
  const taxTotal = r2(taxes.reduce((a, t) => a + t.tax, 0));
  const issueDay = 1 + Math.floor(r() * 20);
  return {
    number: `INV-2026-${String(Math.floor(r() * 99999)).padStart(5, '0')}`,
    issue: `2026-11-${String(issueDay).padStart(2, '0')}`,
    due: `2026-12-${String(issueDay).padStart(2, '0')}`,
    currency: 'EUR',
    buyerRef: `PO-${Math.floor(r() * 9999)}`,
    seller,
    buyer,
    lines,
    taxes,
    lineTotal,
    taxExcl: lineTotal,
    taxTotal,
    taxIncl: r2(lineTotal + taxTotal),
    payable: r2(lineTotal + taxTotal),
    iban: makeIban(seller.country, Array.from({ length: 18 }, () => Math.floor(r() * 10)).join('')),
    terms: 'Payment within 30 days',
  };
}

function inject(d: Data, kind: Injected | null): Data {
  switch (kind) {
    case 'BR-CO-10': d.lineTotal = r2(d.lineTotal + 10); d.taxExcl = d.lineTotal; d.taxIncl = r2(d.taxExcl + d.taxTotal); d.payable = d.taxIncl; break;
    case 'BR-CO-15': d.taxIncl = r2(d.taxIncl + 1); d.payable = d.taxIncl; break;
    case 'BR-S-09': d.taxes[0].tax = r2(d.taxes[0].tax + 2.5); d.taxTotal = r2(d.taxes.reduce((a, t) => a + t.tax, 0)); d.taxIncl = r2(d.taxExcl + d.taxTotal); d.payable = d.taxIncl; break;
    case 'BR-CO-16': d.payable = r2(d.payable - 5); break;
    case 'HY-IBAN': { const k = 6; d.iban = d.iban.slice(0, k) + String((Number(d.iban[k]) + 1) % 10) + d.iban.slice(k + 1); break; }
    case 'BR-CO-25': d.due = ''; d.terms = ''; break;
    case 'PEPPOL-R003': d.buyerRef = ''; break;
    case 'BR-11': d.buyer.country = ''; break;
    case 'HY-LINE': d.lines[0].price = r2(d.lines[0].price + 1); break;
    case 'BR-CO-09': d.seller = { ...d.seller, vat: d.seller.vat.slice(2) }; break;
    case 'BR-E-10': {
      const extra = { id: String(d.lines.length + 1), name: 'Export freight', qty: 1, price: 50, net: 50, cat: 'E', rate: 0 };
      d.lines.push(extra);
      d.taxes.push({ cat: 'E', rate: 0, taxable: 50, tax: 0, reason: '' });
      d.lineTotal = r2(d.lineTotal + 50); d.taxExcl = d.lineTotal; d.taxIncl = r2(d.taxExcl + d.taxTotal); d.payable = d.taxIncl;
      break;
    }
  }
  return d;
}

export function toUbl(d: Data): string {
  const party = (p: Data['seller']) => `<cac:Party><cbc:EndpointID schemeID="${p.endpoint.split(':')[0]}">${esc(p.endpoint.split(':')[1] ?? '')}</cbc:EndpointID><cac:PartyName><cbc:Name>${esc(p.name)}</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>${esc(p.street)}</cbc:StreetName><cbc:CityName>${esc(p.town)}</cbc:CityName><cbc:PostalZone>${esc(p.pc)}</cbc:PostalZone>${p.country ? `<cac:Country><cbc:IdentificationCode>${p.country}</cbc:IdentificationCode></cac:Country>` : ''}</cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>${esc(p.vat)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>${esc(p.name)}</cbc:RegistrationName></cac:PartyLegalEntity></cac:Party>`;
  const c = d.currency;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
<cbc:ID>${d.number}</cbc:ID>
<cbc:IssueDate>${d.issue}</cbc:IssueDate>
${d.due ? `<cbc:DueDate>${d.due}</cbc:DueDate>` : ''}
<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
<cbc:DocumentCurrencyCode>${c}</cbc:DocumentCurrencyCode>
${d.buyerRef ? `<cbc:BuyerReference>${d.buyerRef}</cbc:BuyerReference>` : ''}
<cac:AccountingSupplierParty>${party(d.seller)}</cac:AccountingSupplierParty>
<cac:AccountingCustomerParty>${party(d.buyer)}</cac:AccountingCustomerParty>
<cac:PaymentMeans><cbc:PaymentMeansCode>30</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>${d.iban}</cbc:ID></cac:PayeeFinancialAccount></cac:PaymentMeans>
${d.terms ? `<cac:PaymentTerms><cbc:Note>${d.terms}</cbc:Note></cac:PaymentTerms>` : ''}
<cac:TaxTotal><cbc:TaxAmount currencyID="${c}">${f2(d.taxTotal)}</cbc:TaxAmount>${d.taxes.map((t) => `<cac:TaxSubtotal><cbc:TaxableAmount currencyID="${c}">${f2(t.taxable)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${c}">${f2(t.tax)}</cbc:TaxAmount><cac:TaxCategory><cbc:ID>${t.cat}</cbc:ID><cbc:Percent>${t.rate}</cbc:Percent>${t.reason ? `<cbc:TaxExemptionReason>${t.reason}</cbc:TaxExemptionReason>` : ''}<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal>`).join('')}</cac:TaxTotal>
<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${c}">${f2(d.lineTotal)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="${c}">${f2(d.taxExcl)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="${c}">${f2(d.taxIncl)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${c}">${f2(d.payable)}</cbc:PayableAmount></cac:LegalMonetaryTotal>
${d.lines.map((l) => `<cac:InvoiceLine><cbc:ID>${l.id}</cbc:ID><cbc:InvoicedQuantity unitCode="C62">${l.qty}</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="${c}">${f2(l.net)}</cbc:LineExtensionAmount><cac:Item><cbc:Name>${esc(l.name)}</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>${l.cat}</cbc:ID><cbc:Percent>${l.rate}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="${c}">${f2(l.price)}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>`).join('\n')}
</Invoice>
`;
}

export function toCii(d: Data, guideline = 'urn:cen.eu:en16931:2017'): string {
  const c = d.currency;
  const dt = (s: string) => s.replace(/-/g, '');
  const party = (tag: string, p: Data['seller']) => `<ram:${tag}><ram:Name>${esc(p.name)}</ram:Name><ram:PostalTradeAddress><ram:PostcodeCode>${esc(p.pc)}</ram:PostcodeCode><ram:LineOne>${esc(p.street)}</ram:LineOne><ram:CityName>${esc(p.town)}</ram:CityName>${p.country ? `<ram:CountryID>${p.country}</ram:CountryID>` : ''}</ram:PostalTradeAddress><ram:URIUniversalCommunication><ram:URIID schemeID="${p.endpoint.split(':')[0]}">${esc(p.endpoint.split(':')[1] ?? '')}</ram:URIID></ram:URIUniversalCommunication><ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(p.vat)}</ram:ID></ram:SpecifiedTaxRegistration></ram:${tag}>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
<rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>${guideline}</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>
<rsm:ExchangedDocument><ram:ID>${d.number}</ram:ID><ram:TypeCode>380</ram:TypeCode><ram:IssueDateTime><udt:DateTimeString format="102">${dt(d.issue)}</udt:DateTimeString></ram:IssueDateTime></rsm:ExchangedDocument>
<rsm:SupplyChainTradeTransaction>
${d.lines.map((l) => `<ram:IncludedSupplyChainTradeLineItem><ram:AssociatedDocumentLineDocument><ram:LineID>${l.id}</ram:LineID></ram:AssociatedDocumentLineDocument><ram:SpecifiedTradeProduct><ram:Name>${esc(l.name)}</ram:Name></ram:SpecifiedTradeProduct><ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${f2(l.price)}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement><ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">${l.qty}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery><ram:SpecifiedLineTradeSettlement><ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${l.cat}</ram:CategoryCode><ram:RateApplicablePercent>${l.rate}</ram:RateApplicablePercent></ram:ApplicableTradeTax><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${f2(l.net)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement></ram:IncludedSupplyChainTradeLineItem>`).join('\n')}
<ram:ApplicableHeaderTradeAgreement>${d.buyerRef ? `<ram:BuyerReference>${d.buyerRef}</ram:BuyerReference>` : ''}${party('SellerTradeParty', d.seller)}${party('BuyerTradeParty', d.buyer)}</ram:ApplicableHeaderTradeAgreement>
<ram:ApplicableHeaderTradeDelivery/>
<ram:ApplicableHeaderTradeSettlement><ram:InvoiceCurrencyCode>${c}</ram:InvoiceCurrencyCode><ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>58</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${d.iban}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount></ram:SpecifiedTradeSettlementPaymentMeans>
${d.taxes.map((t) => `<ram:ApplicableTradeTax><ram:CalculatedAmount>${f2(t.tax)}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode>${t.reason ? `<ram:ExemptionReason>${t.reason}</ram:ExemptionReason>` : ''}<ram:BasisAmount>${f2(t.taxable)}</ram:BasisAmount><ram:CategoryCode>${t.cat}</ram:CategoryCode><ram:RateApplicablePercent>${t.rate}</ram:RateApplicablePercent></ram:ApplicableTradeTax>`).join('')}
${d.due || d.terms ? `<ram:SpecifiedTradePaymentTerms>${d.terms ? `<ram:Description>${d.terms}</ram:Description>` : ''}${d.due ? `<ram:DueDateDateTime><udt:DateTimeString format="102">${dt(d.due)}</udt:DateTimeString></ram:DueDateDateTime>` : ''}</ram:SpecifiedTradePaymentTerms>` : ''}
<ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>${f2(d.lineTotal)}</ram:LineTotalAmount><ram:TaxBasisTotalAmount>${f2(d.taxExcl)}</ram:TaxBasisTotalAmount><ram:TaxTotalAmount currencyID="${c}">${f2(d.taxTotal)}</ram:TaxTotalAmount><ram:GrandTotalAmount>${f2(d.taxIncl)}</ram:GrandTotalAmount><ram:DuePayableAmount>${f2(d.payable)}</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation>
</ram:ApplicableHeaderTradeSettlement>
</rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}

export function generateInvoice(seed: number, kind: Injected | null, syntax: 'UBL' | 'CII' = 'UBL'): string {
  const d = inject(build(seed), kind);
  return syntax === 'UBL' ? toUbl(d) : toCii(d, kind === 'PEPPOL-R003' ? 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0' : 'urn:cen.eu:en16931:2017');
}

/** A minimal Factur-X style PDF with the CII XML attached as an embedded, compressed file. */
export async function facturxPdf(xml: string): Promise<Uint8Array> {
  const { deflateSync } = await import('node:zlib');
  const data = deflateSync(Buffer.from(xml, 'utf8'));
  const enc = (s: string) => Buffer.from(s, 'latin1');
  const parts: Buffer[] = [];
  const offsets: number[] = [];
  let pos = 0;
  const push = (b: Buffer) => { parts.push(b); pos += b.length; };
  push(enc('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n'));
  const obj = (n: number, body: Buffer | string) => { offsets[n] = pos; push(enc(`${n} 0 obj\n`)); push(typeof body === 'string' ? enc(body) : body); push(enc('\nendobj\n')); };
  obj(1, '<< /Type /Catalog /Pages 2 0 R /Names << /EmbeddedFiles << /Names [(factur-x.xml) 5 0 R] >> >> /AF [5 0 R] >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R >>');
  obj(4, Buffer.concat([enc(`<< /Type /EmbeddedFile /Subtype /text#2Fxml /Filter /FlateDecode /Length ${data.length} >>\nstream\n`), data, enc('\nendstream')]));
  obj(5, '<< /Type /Filespec /F (factur-x.xml) /UF (factur-x.xml) /AFRelationship /Data /EF << /F 4 0 R >> >>');
  obj(6, '<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 770 Td (Invoice) Tj ET\nendstream');
  const xref = pos;
  push(enc(`xref\n0 7\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  return new Uint8Array(Buffer.concat(parts));
}
