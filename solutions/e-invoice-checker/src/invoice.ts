// Reads EN 16931 electronic invoices: UBL 2.1 (Peppol BIS Billing 3, XRechnung UBL) and
// UN/CEFACT CII (XRechnung CII, Factur-X / ZUGFeRD), including the XML embedded in a Factur-X PDF.
import { child, findAll, parseXml, val, type XmlNode } from '../../shared/xml.ts';

export interface InvParty {
  name: string;
  vatId: string;
  companyId: string;
  street: string;
  town: string;
  postcode: string;
  country: string;
  endpoint: string;
}

export interface InvLine {
  id: string;
  name: string;
  quantity: number | null;
  unit: string;
  price: number | null;
  baseQuantity: number | null;
  net: number | null;
  category: string;
  rate: number | null;
  hasAllowance: boolean;
}

export interface TaxSubtotal {
  category: string;
  rate: number | null;
  taxable: number | null;
  tax: number | null;
  exemptionReason: string;
}

export interface Invoice {
  syntax: 'UBL' | 'CII';
  kind: 'Invoice' | 'CreditNote';
  customization: string;
  profile: string;
  number: string;
  typeCode: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  buyerReference: string;
  orderReference: string;
  notes: string[];
  seller: InvParty;
  buyer: InvParty;
  lines: InvLine[];
  allowances: number[];
  charges: number[];
  taxes: TaxSubtotal[];
  totals: {
    lineTotal: number | null;
    allowanceTotal: number | null;
    chargeTotal: number | null;
    taxExclusive: number | null;
    taxTotal: number | null;
    taxInclusive: number | null;
    prepaid: number | null;
    rounding: number | null;
    payable: number | null;
  };
  payment: { meansCode: string; iban: string; bic: string; terms: string };
}

const num = (s: string | undefined): number | null => {
  if (s === undefined || s.trim() === '') return null;
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : null;
};

/** CII dates are written 20261122 (format 102); UBL uses 2026-11-22. */
const ciiDate = (s: string): string => (/^\d{8}$/.test(s.trim()) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s.trim());

const emptyParty = (): InvParty => ({ name: '', vatId: '', companyId: '', street: '', town: '', postcode: '', country: '', endpoint: '' });

function ublParty(p: XmlNode | undefined): InvParty {
  const out = emptyParty();
  if (!p) return out;
  out.name = val(p, 'PartyName/Name') || val(p, 'PartyLegalEntity/RegistrationName');
  out.endpoint = val(p, 'EndpointID');
  for (const t of p.children.filter((c) => c.name === 'PartyTaxScheme')) {
    if ((val(t, 'TaxScheme/ID') || 'VAT') === 'VAT' && !out.vatId) out.vatId = val(t, 'CompanyID');
  }
  out.companyId = val(p, 'PartyLegalEntity/CompanyID');
  const a = child(p, 'PostalAddress');
  out.street = val(a, 'StreetName');
  out.town = val(a, 'CityName');
  out.postcode = val(a, 'PostalZone');
  out.country = val(a, 'Country/IdentificationCode');
  return out;
}

function parseUbl(doc: XmlNode): Invoice {
  const kind = doc.name === 'CreditNote' ? 'CreditNote' : 'Invoice';
  const lineTag = kind === 'CreditNote' ? 'CreditNoteLine' : 'InvoiceLine';
  const qtyTag = kind === 'CreditNote' ? 'CreditedQuantity' : 'InvoicedQuantity';
  const currency = val(doc, 'DocumentCurrencyCode');
  const taxTotals = doc.children.filter((c) => c.name === 'TaxTotal');
  const mainTax = taxTotals.find((t) => child(t, 'TaxAmount')?.attrs.currencyID === currency) ?? taxTotals[0];
  const lmt = child(doc, 'LegalMonetaryTotal');
  const pm = child(doc, 'PaymentMeans');
  return {
    syntax: 'UBL',
    kind,
    customization: val(doc, 'CustomizationID'),
    profile: val(doc, 'ProfileID'),
    number: val(doc, 'ID'),
    typeCode: val(doc, kind === 'CreditNote' ? 'CreditNoteTypeCode' : 'InvoiceTypeCode'),
    issueDate: val(doc, 'IssueDate'),
    dueDate: val(doc, 'DueDate') || val(pm, 'PaymentDueDate'),
    currency,
    buyerReference: val(doc, 'BuyerReference'),
    orderReference: val(doc, 'OrderReference/ID'),
    notes: doc.children.filter((c) => c.name === 'Note').map((c) => c.text.trim()),
    seller: ublParty(child(doc, 'AccountingSupplierParty/Party')),
    buyer: ublParty(child(doc, 'AccountingCustomerParty/Party')),
    lines: doc.children.filter((c) => c.name === lineTag).map((l) => ({
      id: val(l, 'ID'),
      name: val(l, 'Item/Name'),
      quantity: num(val(l, qtyTag)),
      unit: child(l, qtyTag)?.attrs.unitCode ?? '',
      price: num(val(l, 'Price/PriceAmount')),
      baseQuantity: num(val(l, 'Price/BaseQuantity')),
      net: num(val(l, 'LineExtensionAmount')),
      category: val(l, 'Item/ClassifiedTaxCategory/ID'),
      rate: num(val(l, 'Item/ClassifiedTaxCategory/Percent')),
      hasAllowance: l.children.some((c) => c.name === 'AllowanceCharge'),
    })),
    allowances: doc.children.filter((c) => c.name === 'AllowanceCharge' && val(c, 'ChargeIndicator') === 'false').map((c) => num(val(c, 'Amount')) ?? 0),
    charges: doc.children.filter((c) => c.name === 'AllowanceCharge' && val(c, 'ChargeIndicator') === 'true').map((c) => num(val(c, 'Amount')) ?? 0),
    taxes: (mainTax ? mainTax.children.filter((c) => c.name === 'TaxSubtotal') : []).map((s) => ({
      category: val(s, 'TaxCategory/ID'),
      rate: num(val(s, 'TaxCategory/Percent')),
      taxable: num(val(s, 'TaxableAmount')),
      tax: num(val(s, 'TaxAmount')),
      exemptionReason: val(s, 'TaxCategory/TaxExemptionReason') || val(s, 'TaxCategory/TaxExemptionReasonCode'),
    })),
    totals: {
      lineTotal: num(val(lmt, 'LineExtensionAmount')),
      allowanceTotal: num(val(lmt, 'AllowanceTotalAmount')),
      chargeTotal: num(val(lmt, 'ChargeTotalAmount')),
      taxExclusive: num(val(lmt, 'TaxExclusiveAmount')),
      taxTotal: num(val(mainTax, 'TaxAmount')),
      taxInclusive: num(val(lmt, 'TaxInclusiveAmount')),
      prepaid: num(val(lmt, 'PrepaidAmount')),
      rounding: num(val(lmt, 'PayableRoundingAmount')),
      payable: num(val(lmt, 'PayableAmount')),
    },
    payment: {
      meansCode: val(pm, 'PaymentMeansCode'),
      iban: val(pm, 'PayeeFinancialAccount/ID'),
      bic: val(pm, 'PayeeFinancialAccount/FinancialInstitutionBranch/ID'),
      terms: val(doc, 'PaymentTerms/Note'),
    },
  };
}

function ciiParty(p: XmlNode | undefined): InvParty {
  const out = emptyParty();
  if (!p) return out;
  out.name = val(p, 'Name');
  out.endpoint = val(p, 'URIUniversalCommunication/URIID');
  for (const t of p.children.filter((c) => c.name === 'SpecifiedTaxRegistration')) {
    const id = child(t, 'ID');
    if (id && (id.attrs.schemeID ?? 'VA') === 'VA') out.vatId = id.text.trim();
  }
  out.companyId = val(p, 'SpecifiedLegalOrganization/ID');
  const a = child(p, 'PostalTradeAddress');
  out.street = val(a, 'LineOne');
  out.town = val(a, 'CityName');
  out.postcode = val(a, 'PostcodeCode');
  out.country = val(a, 'CountryID');
  return out;
}

function parseCii(doc: XmlNode): Invoice {
  const tx = child(doc, 'SupplyChainTradeTransaction');
  const agr = child(tx, 'ApplicableHeaderTradeAgreement');
  const set = child(tx, 'ApplicableHeaderTradeSettlement');
  const sum = child(set, 'SpecifiedTradeSettlementHeaderMonetarySummation');
  const currency = val(set, 'InvoiceCurrencyCode');
  const taxTotalNode = sum?.children.find((c) => c.name === 'TaxTotalAmount' && (c.attrs.currencyID ?? currency) === currency);
  const pm = child(set, 'SpecifiedTradeSettlementPaymentMeans');
  const typeCode = val(doc, 'ExchangedDocument/TypeCode');
  return {
    syntax: 'CII',
    kind: typeCode === '381' ? 'CreditNote' : 'Invoice',
    customization: val(doc, 'ExchangedDocumentContext/GuidelineSpecifiedDocumentContextParameter/ID'),
    profile: val(doc, 'ExchangedDocumentContext/BusinessProcessSpecifiedDocumentContextParameter/ID'),
    number: val(doc, 'ExchangedDocument/ID'),
    typeCode,
    issueDate: ciiDate(val(doc, 'ExchangedDocument/IssueDateTime/DateTimeString')),
    dueDate: ciiDate(val(set, 'SpecifiedTradePaymentTerms/DueDateDateTime/DateTimeString')),
    currency,
    buyerReference: val(agr, 'BuyerReference'),
    orderReference: val(agr, 'BuyerOrderReferencedDocument/IssuerAssignedID'),
    notes: findAll(child(doc, 'ExchangedDocument') ?? doc, 'IncludedNote').map((n) => val(n, 'Content')),
    seller: ciiParty(child(agr, 'SellerTradeParty')),
    buyer: ciiParty(child(agr, 'BuyerTradeParty')),
    lines: (tx?.children ?? []).filter((c) => c.name === 'IncludedSupplyChainTradeLineItem').map((l) => {
      const q = child(l, 'SpecifiedLineTradeDelivery/BilledQuantity');
      const priceNode = child(l, 'SpecifiedLineTradeAgreement/NetPriceProductTradePrice');
      const ls = child(l, 'SpecifiedLineTradeSettlement');
      return {
        id: val(l, 'AssociatedDocumentLineDocument/LineID'),
        name: val(l, 'SpecifiedTradeProduct/Name'),
        quantity: num(q?.text),
        unit: q?.attrs.unitCode ?? '',
        price: num(val(priceNode, 'ChargeAmount')),
        baseQuantity: num(val(priceNode, 'BasisQuantity')),
        net: num(val(ls, 'SpecifiedTradeSettlementLineMonetarySummation/LineTotalAmount')),
        category: val(ls, 'ApplicableTradeTax/CategoryCode'),
        rate: num(val(ls, 'ApplicableTradeTax/RateApplicablePercent')),
        hasAllowance: (ls?.children ?? []).some((c) => c.name === 'SpecifiedTradeAllowanceCharge'),
      };
    }),
    allowances: (set?.children ?? []).filter((c) => c.name === 'SpecifiedTradeAllowanceCharge' && val(c, 'ChargeIndicator/Indicator') === 'false').map((c) => num(val(c, 'ActualAmount')) ?? 0),
    charges: (set?.children ?? []).filter((c) => c.name === 'SpecifiedTradeAllowanceCharge' && val(c, 'ChargeIndicator/Indicator') === 'true').map((c) => num(val(c, 'ActualAmount')) ?? 0),
    taxes: (set?.children ?? []).filter((c) => c.name === 'ApplicableTradeTax').map((t) => ({
      category: val(t, 'CategoryCode'),
      rate: num(val(t, 'RateApplicablePercent')),
      taxable: num(val(t, 'BasisAmount')),
      tax: num(val(t, 'CalculatedAmount')),
      exemptionReason: val(t, 'ExemptionReason') || val(t, 'ExemptionReasonCode'),
    })),
    totals: {
      lineTotal: num(val(sum, 'LineTotalAmount')),
      allowanceTotal: num(val(sum, 'AllowanceTotalAmount')),
      chargeTotal: num(val(sum, 'ChargeTotalAmount')),
      taxExclusive: num(val(sum, 'TaxBasisTotalAmount')),
      taxTotal: num(taxTotalNode?.text),
      taxInclusive: num(val(sum, 'GrandTotalAmount')),
      prepaid: num(val(sum, 'TotalPrepaidAmount')),
      rounding: num(val(sum, 'RoundingAmount')),
      payable: num(val(sum, 'DuePayableAmount')),
    },
    payment: {
      meansCode: val(pm, 'TypeCode'),
      iban: val(pm, 'PayeePartyCreditorFinancialAccount/IBANID'),
      bic: val(pm, 'PayeeSpecifiedCreditorFinancialInstitution/BICID'),
      terms: val(set, 'SpecifiedTradePaymentTerms/Description'),
    },
  };
}

export function parseInvoice(xml: string): Invoice {
  const root = parseXml(xml);
  if (root.name === 'Invoice' || root.name === 'CreditNote') return parseUbl(root);
  if (root.name === 'CrossIndustryInvoice') return parseCii(root);
  if (root.name === 'StandardBusinessDocument') {
    const inner = root.children.find((c) => c.name === 'Invoice' || c.name === 'CreditNote');
    if (inner) return parseUbl(inner);
  }
  throw new Error(`This XML is a <${root.name}>, not an e-invoice. Use a UBL Invoice or CreditNote (Peppol, XRechnung) or a CII CrossIndustryInvoice (XRechnung, Factur-X, ZUGFeRD).`);
}

/** Finds the invoice XML attached inside a Factur-X / ZUGFeRD PDF. Works in browsers and Node 18+. */
export async function xmlFromPdf(bytes: Uint8Array): Promise<string | null> {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const re = /\/Type\s*\/EmbeddedFile\b/g;
  let m: RegExpExecArray | null;
  const candidates: string[] = [];
  while ((m = re.exec(s))) {
    const dictStart = s.lastIndexOf('obj', m.index);
    const streamAt = s.indexOf('stream', m.index);
    if (streamAt < 0) continue;
    const dict = s.slice(dictStart, streamAt);
    let start = streamAt + 6;
    if (s[start] === '\r') start++;
    if (s[start] === '\n') start++;
    const end = s.indexOf('endstream', start);
    if (end < 0) continue;
    const len = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
    let stop = end;
    if (len && start + Number(len[1]) <= end) stop = start + Number(len[1]);
    else {
      if (s[stop - 1] === '\n') stop--;
      if (s[stop - 1] === '\r') stop--;
    }
    let data = bytes.subarray(start, stop);
    if (/\/FlateDecode/.test(dict)) {
      try {
        const ds = new DecompressionStream('deflate');
        const out = new Response(new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(ds));
        data = new Uint8Array(await out.arrayBuffer());
      } catch {
        continue;
      }
    }
    candidates.push(new TextDecoder().decode(data));
  }
  return candidates.find((c) => /CrossIndustryInvoice|<(\w+:)?Invoice\b/.test(c)) ?? null;
}
