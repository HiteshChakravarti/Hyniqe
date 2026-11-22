// The Hyniqe Hub tool catalogue. scripts/build-site.ts turns each entry into its own page
// (docs/tools/<slug>/index.html) so every tool can be found by the words people search for.

export type Group = 'fix' | 'find' | 'ready' | 'measure';

export interface ToolPage {
  slug: string;
  name: string;
  group: Group;
  status: 'live' | 'building';
  /** Browser tab and search-result title: written the way people search. */
  title: string;
  /** Page heading: the problem in the visitor's words. */
  h1: string;
  lede: string;
  /** One line for the home page list. */
  short: string;
  /** Words the home-page search matches on. */
  keywords: string[];
  inputLabel: string;
  accept: string;
  secondInput?: { label: string; accept: string };
  /** Offer a text box to paste the input instead of choosing a file. */
  paste?: string;
  /** The adapter receives the file as bytes (for PDFs). */
  binary?: boolean;
  samples: { file: string; label: string }[];
  checks: string[];
  columns?: [string, string, boolean][];
  faq: [string, string][];
}

export const GROUPS: Record<Group, { title: string; blurb: string }> = {
  fix: { title: 'Fix a file', blurb: 'The bank rejected it, or nobody can open it.' },
  find: { title: 'Find costly errors', blurb: 'Money paid twice, to the wrong place, or bounced back.' },
  ready: { title: 'Get ready for T+1', blurb: 'Europe settles trades in one day from 11 October 2027.' },
  measure: { title: 'Measure data quality', blurb: 'Know how good your data is before a regulator asks.' },
};

const PRIVATE: [string, string] = ['Is my file uploaded anywhere?', 'No. The check runs inside this browser tab. Nothing is sent to a server, stored or tracked, and the code is open for anyone to inspect on GitHub.'];
const FREE: [string, string] = ['Is it really free?', 'Yes, for unlimited use. Teams that want it run on their real data with a written fix plan can book a paid Health Check.'];

export const TOOLS: ToolPage[] = [
  {
    slug: 'payment-file-doctor',
    name: 'Payment File Doctor',
    group: 'fix',
    status: 'live',
    title: 'Bank rejected your SEPA payment file? Find and fix the errors free | Hyniqe',
    h1: 'Your bank rejected the payment file. Find out why and download a fixed one.',
    lede: 'Drop in the XML payment file (pain.001). Every problem is explained in plain English, and you get a corrected file back: upgraded to the version your bank asks for, with addresses split into the fields banks now require.',
    short: 'Explains why the bank rejected a payment file and gives you a fixed one.',
    keywords: ['sepa', 'payment file', 'rejected', 'pain.001', 'xml', 'bank upload', 'payroll file', 'version 9', 'structured address', 'bulk payment'],
    inputLabel: 'Drop your payment file (.xml) here, or choose a file',
    accept: '.xml',
    samples: [{ file: 'payment-file-v03.xml', label: 'sample rejected file' }],
    checks: [
      'The file version your bank expects (version 3 files upgraded to version 9)',
      'Every IBAN and BIC, with the exact payment that has the problem',
      'Control totals and transaction counts that no longer add up',
      'Addresses that must be split into street, postcode, town and country',
      'Characters banks refuse, names that are too long, dates in the past',
    ],
    faq: [
      ['Which banks does this work for?', 'Any bank that accepts SEPA or ISO 20022 credit transfer files (pain.001). Your bank can still have its own extra rules; the report flags the common ones.'] as [string, string],
      ['Will the fixed file definitely be accepted?', 'It fixes the errors this tool can detect and tells you about anything it changed. Test it with your bank before a large run.'] as [string, string],
      PRIVATE,
    ],
  },
  {
    slug: 'bank-statement-converter',
    name: 'Bank Statement Converter',
    group: 'fix',
    status: 'live',
    title: 'Convert camt.053 or MT940 bank statements to Excel free | Hyniqe',
    h1: 'Open your bank statement file in Excel.',
    lede: 'Banks are replacing MT940 statements with camt.053 XML files that nobody can read. Drop either one in and get a clean spreadsheet of every transaction, with the payment reference and counterparty made readable.',
    short: 'Turns camt.053 and MT940 bank statements into a clean Excel sheet.',
    keywords: ['camt.053', 'camt053', 'mt940', 'bank statement', 'excel', 'csv', 'convert', 'xml statement', 'reconciliation'],
    inputLabel: 'Drop your statement (.xml, .sta, .txt, .940) here, or choose a file',
    accept: '.xml,.sta,.txt,.940,.mt940',
    samples: [{ file: 'statement-camt053.xml', label: 'sample camt.053' }, { file: 'statement.mt940', label: 'sample MT940' }],
    checks: [
      'Every statement and account in the file, with opening and closing balances',
      'Each transaction with date, amount, direction, counterparty and reference',
      'A balance check: opening balance plus transactions must equal the closing balance',
      'Bank transaction codes translated into plain words',
    ],
    faq: [
      ['What is camt.053?', 'The XML end-of-day bank statement that is replacing the older MT940 format across Europe.'] as [string, string],
      ['Can I import the result into my accounting software?', 'Yes. Download it as CSV, which Excel, Xero, QuickBooks and most ERPs can import.'] as [string, string],
      PRIVATE,
    ],
  },
  {
    slug: 'excel-to-payment-file',
    name: 'Excel to Payment File',
    group: 'fix',
    status: 'live',
    title: 'Create a SEPA XML payment file from Excel free | Hyniqe',
    h1: 'Turn a spreadsheet of payments into a bank payment file.',
    lede: 'Fill in our template (or use your own columns), drop it in, and download a valid SEPA credit transfer file your bank can import. Every row is checked before the file is built.',
    short: 'Builds a valid bank payment file from a spreadsheet of payments.',
    keywords: ['excel to sepa', 'csv to xml', 'create payment file', 'sepa xml generator', 'bulk payment', 'pain.001', 'payroll'],
    inputLabel: 'Drop your payments spreadsheet (.csv) here, or choose a file',
    accept: '.csv,.txt',
    samples: [{ file: 'payments-to-send.csv', label: 'template with examples' }],
    checks: ['IBAN check digits and BIC format for every payee', 'Amounts, currency and execution date', 'Payee names and references within bank length limits', 'Structured payee addresses'],
    columns: [
      ['Payee name', 'name, payee, beneficiary', true],
      ['Payee IBAN', 'iban', true],
      ['Amount', 'amount', true],
      ['Reference', 'reference, description, remittance', true],
      ['Payee BIC', 'bic, swift', false],
      ['Payee address', 'address, or street, postcode, town, country', false],
    ],
    faq: [
      ['What do I need besides the spreadsheet?', 'Your company name, your IBAN and BIC, and the date to pay. The page asks for them.'] as [string, string],
      PRIVATE,
    ],
  },
  {
    slug: 'e-invoice-checker',
    name: 'E-invoice Viewer & Checker',
    group: 'fix',
    status: 'live',
    title: 'Open and validate an e-invoice (Peppol, XRechnung, ZUGFeRD, Factur-X) free | Hyniqe',
    h1: 'Open any e-invoice as a readable invoice, and see exactly which rule it breaks.',
    lede: 'Drop in a Peppol or XRechnung XML, or a ZUGFeRD / Factur-X PDF. You see the invoice the way a person reads it, and every broken EN 16931 rule explained in plain English: wrong totals, wrong VAT, missing references.',
    short: 'Shows any XML e-invoice as a readable invoice and explains every rule it breaks.',
    keywords: ['e-invoice', 'einvoice', 'peppol', 'xrechnung', 'zugferd', 'factur-x', 'ubl', 'cii', 'en 16931', 'validator', 'open xml invoice', 'invoice viewer', 'vat'],
    inputLabel: 'Drop your e-invoice (.xml or .pdf) here, or choose a file',
    accept: '.xml,.pdf',
    binary: true,
    samples: [{ file: 'e-invoice-peppol.xml', label: 'sample Peppol invoice with an error' }],
    checks: [
      'Every total and VAT amount recalculated: lines, rates, total with and without VAT, amount due',
      'Mandatory fields: invoice number, dates, seller and buyer names and countries',
      'VAT categories, exemption reasons and VAT number prefixes',
      'Due date or payment terms, and an IBAN that passes its check digits',
      'Peppol buyer reference and electronic addresses; the XRechnung Leitweg-ID',
    ],
    faq: [
      ['Which formats does it read?', 'UBL 2.1 invoices and credit notes (Peppol BIS Billing 3.0, XRechnung UBL), UN/CEFACT CII (XRechnung CII, Factur-X, ZUGFeRD) and the XML attached inside Factur-X and ZUGFeRD PDFs.'],
      ['Is this the official validation?', 'It checks the business rules behind most rejections and explains them. Your access point or e-invoicing platform still runs the full schema and Schematron validation.'],
      PRIVATE,
      FREE,
    ],
  },
  {
    slug: 'payment-message-explainer',
    name: 'Payment Message Explainer',
    group: 'fix',
    status: 'live',
    title: 'MT103 and pacs.008 explained in plain English, with MT to MX conversion | Hyniqe',
    h1: 'Paste an MT103 or pacs.008. Read it in plain English and get it in the other format.',
    lede: 'See who pays whom, how much, through which banks and who pays the charges, field by field with the MT tag and the ISO 20022 equivalent. It checks the message, flags addresses that will be rejected after November 2026, and converts MT103 to pacs.008 with structured addresses.',
    short: 'Explains an MT103 or pacs.008 in plain English and converts it to the other format.',
    keywords: ['mt103', 'pacs.008', 'swift message', 'iso 20022', 'mt to mx', 'cbpr+', 'structured address', 'uetr', 'payment investigation', 'swift'],
    inputLabel: 'Drop the message file (.txt, .fin or .xml) here, or paste it below',
    accept: '.txt,.fin,.xml,.mt,.out',
    paste: 'Paste an MT103 (with or without the {1:}{2:} header blocks) or a pacs.008 XML',
    samples: [{ file: 'mt103.txt', label: 'sample MT103' }],
    checks: [
      'Who pays whom, how much and through which banks, in one sentence',
      'Every field with its MT103 tag, its pacs.008 element and what it means',
      'Mandatory fields, BIC format, IBAN check digits, the BEN charges rule, missing UETR',
      'Free-text addresses that CBPR+ rejects from November 2026, with a structured version',
      'The same payment as pacs.008 (from MT103) or MT103 (from pacs.008)',
    ],
    faq: [
      ['Can I use the converted message in production?', 'Use it for testing, investigations and to understand the mapping. Your bank or payment system does the production conversion.'],
      PRIVATE,
      FREE,
    ],
  },
  {
    slug: 'duplicate-payment-finder',
    name: 'Duplicate Payment Finder',
    group: 'find',
    status: 'live',
    title: 'Find duplicate payments and invoices paid twice, free | Hyniqe',
    h1: 'Find invoices you paid twice.',
    lede: 'Catches the duplicates your ERP misses: re-typed invoice numbers, a supplier set up twice, the same bill paid through a second channel. Rent and subscriptions are recognised and left alone.',
    short: 'Finds invoices paid twice, including the ones your ERP misses.',
    keywords: ['duplicate payment', 'duplicate invoice', 'paid twice', 'accounts payable', 'ap audit', 'overpayment', 'recovery'],
    inputLabel: 'Drop your payments export (.csv) here, or choose a file',
    accept: '.csv,.txt,.tsv',
    samples: [{ file: 'payments.csv', label: 'sample payments' }],
    checks: ['Same supplier, amount and invoice paid twice', 'Invoice numbers typed differently ("INV-0012345" and "12345")', 'The same supplier set up twice in the vendor master', 'The same bill paid again under a purchase order number'],
    columns: [
      ['Vendor name', 'vendor_name, vendor, supplier, payee', true],
      ['Amount', 'amount, payment_amount', true],
      ['Invoice number', 'invoice_number, invoice', true],
      ['Payment date', 'payment_date, value_date, date', true],
      ['Vendor ID, currency, IBAN', 'vendor_id, currency, iban', false],
    ],
    faq: [['How much does this usually find?', 'Benchmarks put duplicate and erroneous payments at roughly 0.8% to 2% of what companies pay out. Your number depends on your controls.'], PRIVATE, FREE],
  },
  {
    slug: 'vendor-master-cleanup',
    name: 'Vendor Master Cleanup',
    group: 'find',
    status: 'live',
    title: 'Clean your vendor master: duplicate suppliers, shared bank accounts | Hyniqe',
    h1: 'Find suppliers set up twice and bank accounts that should worry you.',
    lede: 'A messy vendor master is where duplicate payments and payment fraud start. Find duplicate suppliers, one bank account shared by unrelated suppliers, invalid VAT numbers and missing details.',
    short: 'Finds duplicate suppliers, shared bank accounts and invalid VAT numbers.',
    keywords: ['vendor master', 'supplier master', 'duplicate vendor', 'vat number', 'data cleansing', 'fraud', 'bank account'],
    inputLabel: 'Drop your vendor list (.csv) here, or choose a file',
    accept: '.csv,.txt,.tsv',
    samples: [{ file: 'vendor-master.csv', label: 'sample vendor master' }],
    checks: ['Suppliers that exist more than once under different spellings', 'One IBAN used by unrelated suppliers', 'VAT numbers in the wrong format for their country', 'Missing bank details, country or tax ID'],
    faq: [PRIVATE, FREE],
  },
  {
    slug: 'bank-detail-change-check',
    name: 'Bank Detail Change Check',
    group: 'find',
    status: 'live',
    title: 'Check a payment run for changed bank details before you pay | Hyniqe',
    h1: 'Before you release a payment run, find every payee whose bank account changed.',
    lede: 'Payment fraud almost always arrives as a supplier "updating" their bank details. Compare your payment run with the accounts you already trust and see which payments to stop and verify by phone.',
    short: 'Flags payments to changed, foreign or someone else’s bank accounts before you pay.',
    keywords: ['payment fraud', 'bank details changed', 'business email compromise', 'bec', 'vendor fraud', 'payment run', 'invoice fraud', 'change of bank details', 'callback'],
    inputLabel: 'Drop your payment run (.csv) here, or choose a file',
    accept: '.csv,.txt,.tsv',
    secondInput: { label: 'Drop your trusted bank details: vendor master or earlier payment runs (.csv)', accept: '.csv,.txt,.tsv' },
    samples: [
      { file: 'payment-run.csv', label: 'sample payment run' },
      { file: 'payment-history.csv', label: 'sample payment history' },
    ],
    checks: [
      'Payees whose account differs from every account they were paid to before',
      'New accounts in a different country from the supplier',
      'A supplier being paid into another supplier’s account',
      'Large first payments to new payees, and amounts far above the usual',
      'Bank details changed in the last 30 days, and invalid IBANs',
    ],
    faq: [
      ['What should I do with a flagged payment?', 'Hold it and call the supplier on a phone number you already hold, not one from the email or invoice that asked for the change. Release it once they confirm.'],
      PRIVATE,
      FREE,
    ],
  },
  {
    slug: 'payment-returns-triage',
    name: 'Returns and Rejects Triage',
    group: 'find',
    status: 'live',
    title: 'Why was my payment returned? Reason codes explained and grouped | Hyniqe',
    h1: 'Understand every returned and rejected payment, and what to fix.',
    lede: 'Drop in your bank status report (pain.002) or a list of reason codes. Each return is explained in plain English, grouped by root cause, and linked to the data you need to correct.',
    short: 'Explains returned and rejected payments and groups them by root cause.',
    keywords: ['payment returned', 'reason code', 'ac01', 'ac04', 'am04', 'be04', 'rejected payment', 'pain.002', 'r-transaction'],
    inputLabel: 'Drop your status report (.xml) or list of returns (.csv) here',
    accept: '.xml,.csv,.txt',
    samples: [{ file: 'status-report-pain002.xml', label: 'sample status report' }],
    checks: ['Every reason code translated into plain English', 'Returns grouped by root cause: account, beneficiary, address, amount, regulatory', 'Who has to act: you, your supplier or your bank', 'The data fix for each group'],
    faq: [PRIVATE, FREE],
  },
  {
    slug: 'ssi-checker',
    name: 'SSI Checker',
    group: 'ready',
    status: 'live',
    title: 'T+1 SSI checker: find settlement instructions that will fail | Hyniqe',
    h1: 'Find the settlement instructions that will fail under T+1.',
    lede: 'Checks every standing settlement instruction for the defects behind unmatched and failed trades, and compares yours with a golden source field by field.',
    short: 'Finds standing settlement instructions that will fail or go unmatched.',
    keywords: ['ssi', 'standing settlement instructions', 't+1', 'settlement fails', 'csdr', 'pset', 'place of settlement', 'custody'],
    inputLabel: 'Drop your SSI file (.csv) here, or choose a file',
    accept: '.csv,.txt,.tsv',
    secondInput: { label: 'Optional: golden-source SSIs to compare against', accept: '.csv,.txt,.tsv' },
    samples: [{ file: 'ssi-ours.csv', label: 'sample SSIs' }, { file: 'ssi-golden-source.csv', label: 'sample golden source' }],
    checks: ['Place of settlement is a central securities depository for the market', 'BIC, LEI and IBAN validity', 'Conflicting instructions for the same route', 'SSIs never verified, or received by email or PDF', 'Every difference from the golden source'],
    columns: [
      ['Counterparty, market, currency', 'counterparty, market, currency', true],
      ['Place of settlement BIC', 'pset, pset_bic, place_of_settlement', true],
      ['Settlement agent BIC', 'agent_bic, custodian_bic, reag', true],
      ['Safekeeping account', 'safekeeping_account, securities_account', true],
      ['LEI, asset class, cash details, last verified, source', 'lei, asset_class, cash_account, last_verified, source', false],
    ],
    faq: [['When does T+1 start?', 'The EU, UK and Swiss markets move to settlement one business day after the trade on 11 October 2027.'], PRIVATE, FREE],
  },
  {
    slug: 'corporate-actions-checker',
    name: 'Corporate Actions Checker',
    group: 'ready',
    status: 'live',
    title: 'Compare corporate action notices across custodians and vendors | Hyniqe',
    h1: 'Find where your corporate action notices disagree, before the deadline.',
    lede: 'Drop in event notices from two or more sources. Every difference in dates, rates, ratios and options is listed, along with events whose election deadline leaves too little time.',
    short: 'Compares corporate action notices from different sources and flags disagreements.',
    keywords: ['corporate actions', 'dividend', 'record date', 'ex date', 'election deadline', 'custodian', 'asset servicing', 'scrubbing'],
    inputLabel: 'Drop your event notices (.csv, one row per event per source) here',
    accept: '.csv,.txt,.tsv',
    samples: [{ file: 'corporate-actions.csv', label: 'sample notices' }],
    checks: ['Ex, record and pay dates that differ between sources', 'Rates, ratios, currencies and options that disagree', 'Dates in an impossible order', 'Election deadlines too close to act on'],
    faq: [PRIVATE, FREE],
  },
  {
    slug: 'payment-data-repair',
    name: 'Payment Data Repair',
    group: 'measure',
    status: 'live',
    title: 'Structure vendor and beneficiary addresses for payments | Hyniqe',
    h1: 'Turn messy supplier addresses into the structured fields banks require.',
    lede: 'Free-text addresses are split into street, building number, postcode, town and country. Bank details are checked against the address. Anything uncertain goes to review instead of being guessed.',
    short: 'Splits free-text supplier addresses into structured fields and checks bank details.',
    keywords: ['structured address', 'beneficiary address', 'vendor address', 'address cleansing', 'iban', 'payment data'],
    inputLabel: 'Drop your vendor or beneficiary list (.csv) here',
    accept: '.csv,.txt,.tsv',
    samples: [{ file: 'vendors.csv', label: 'sample vendor master' }],
    checks: ['Street, building, postcode, town and country from free text', 'Postcode formats for over 70 countries', 'IBAN validity and bank, BIC and address countries that disagree', 'Automatic repair only when the rules are sure'],
    faq: [PRIVATE, FREE],
  },
  {
    slug: 'data-quality-scorecard',
    name: 'Data Quality Scorecard',
    group: 'measure',
    status: 'live',
    title: 'Free data quality scorecard for any CSV: completeness, validity, duplicates | Hyniqe',
    h1: 'Score the quality of any dataset in one minute.',
    lede: 'Drop in any table. Every column is profiled for completeness, validity, uniqueness and consistency, with finance formats (IBAN, BIC, LEI, ISIN, currency, country, dates) recognised automatically.',
    short: 'Profiles any table for completeness, validity, uniqueness and consistency.',
    keywords: ['data quality', 'data profiling', 'bcbs 239', 'critical data elements', 'completeness', 'data governance', 'scorecard'],
    inputLabel: 'Drop any table (.csv) here, or choose a file',
    accept: '.csv,.txt,.tsv',
    samples: [{ file: 'trades.csv', label: 'sample trade table' }],
    checks: ['Completeness of every column', 'Validity of recognised formats: IBAN, BIC, LEI, ISIN, currency, country, dates', 'Duplicate keys and repeated rows', 'Columns whose values disagree with each other'],
    faq: [PRIVATE, FREE],
  },
];
