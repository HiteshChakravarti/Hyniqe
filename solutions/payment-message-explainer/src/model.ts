// One model for a customer credit transfer, whether it arrived as an MT103 or a pacs.008.

export interface Party {
  name: string;
  account: string;
  bic: string;
  /** Address as free lines (MT 50K/59, MX AdrLine). */
  lines: string[];
  /** Structured parts, where the message carried them (MT 50F/59F, MX PstlAdr elements). */
  town: string;
  country: string;
  street: string;
  building: string;
  postcode: string;
}

export interface Payment {
  format: 'MT103' | 'pacs.008';
  ref: string;
  endToEnd: string;
  uetr: string;
  valueDate: string;
  currency: string;
  amount: number | null;
  instructedCurrency: string;
  instructedAmount: number | null;
  rate: string;
  charges: string; // OUR | SHA | BEN (MT codes)
  senderCharges: string[];
  bankOperation: string;
  sender: string;
  receiver: string;
  debtor: Party;
  debtorAgent: string;
  creditor: Party;
  creditorAgent: string;
  intermediary: string;
  remittance: string;
  bankInfo: string;
  regulatory: string;
}

export const emptyParty = (): Party => ({ name: '', account: '', bic: '', lines: [], town: '', country: '', street: '', building: '', postcode: '' });

export const emptyPayment = (format: Payment['format']): Payment => ({
  format, ref: '', endToEnd: '', uetr: '', valueDate: '', currency: '', amount: null, instructedCurrency: '', instructedAmount: null, rate: '',
  charges: '', senderCharges: [], bankOperation: '', sender: '', receiver: '', debtor: emptyParty(), debtorAgent: '', creditor: emptyParty(),
  creditorAgent: '', intermediary: '', remittance: '', bankInfo: '', regulatory: '',
});

export const CHARGES_MT_TO_MX: Record<string, string> = { OUR: 'DEBT', SHA: 'SHAR', BEN: 'CRED' };
export const CHARGES_MX_TO_MT: Record<string, string> = { DEBT: 'OUR', SHAR: 'SHA', CRED: 'BEN' };
export const CHARGES_WORDS: Record<string, string> = {
  OUR: 'the sender pays all charges (OUR)',
  SHA: 'charges are shared: each side pays its own bank (SHA)',
  BEN: 'the beneficiary pays all charges, deducted from the amount (BEN)',
};

/** What each field means, with its MT tag and its pacs.008 equivalent. */
export const FIELDS: { key: string; mt: string; mx: string; name: string; meaning: string }[] = [
  { key: 'ref', mt: ':20:', mx: 'PmtId/InstrId', name: "Sender's reference", meaning: 'The sending bank’s own reference for this payment.' },
  { key: 'endToEnd', mt: '(none)', mx: 'PmtId/EndToEndId', name: 'End-to-end reference', meaning: 'The payer’s reference, carried unchanged to the beneficiary. MT103 has no field for it.' },
  { key: 'uetr', mt: '{3:{121:}}', mx: 'PmtId/UETR', name: 'UETR', meaning: 'The unique tracking number used to trace the payment across every bank (Swift gpi).' },
  { key: 'bankOperation', mt: ':23B:', mx: '(implied)', name: 'Bank operation code', meaning: 'Normally CRED: a plain credit transfer.' },
  { key: 'valueDate', mt: ':32A: date', mx: 'IntrBkSttlmDt', name: 'Value date', meaning: 'The date the banks settle the money between them.' },
  { key: 'amount', mt: ':32A: amount', mx: 'IntrBkSttlmAmt', name: 'Settlement amount', meaning: 'The amount the banks settle, after any charges already taken.' },
  { key: 'instructedAmount', mt: ':33B:', mx: 'InstdAmt', name: 'Instructed amount', meaning: 'The amount the payer originally asked to send, before charges or conversion.' },
  { key: 'rate', mt: ':36:', mx: 'XchgRate', name: 'Exchange rate', meaning: 'The rate used if the instructed and settlement currencies differ.' },
  { key: 'debtor', mt: ':50a:', mx: 'Dbtr / DbtrAcct', name: 'Ordering customer (payer)', meaning: 'Who is paying, with their account and address.' },
  { key: 'debtorAgent', mt: ':52A:', mx: 'DbtrAgt', name: 'Ordering institution', meaning: 'The payer’s bank.' },
  { key: 'intermediary', mt: ':56A:', mx: 'IntrmyAgt1', name: 'Intermediary bank', meaning: 'A bank the payment passes through on the way.' },
  { key: 'creditorAgent', mt: ':57A:', mx: 'CdtrAgt', name: 'Account with institution', meaning: 'The beneficiary’s bank.' },
  { key: 'creditor', mt: ':59a:', mx: 'Cdtr / CdtrAcct', name: 'Beneficiary', meaning: 'Who receives the money, with their account and address.' },
  { key: 'remittance', mt: ':70:', mx: 'RmtInf/Ustrd', name: 'Remittance information', meaning: 'What the payment is for, usually an invoice number. MT allows 140 characters.' },
  { key: 'charges', mt: ':71A:', mx: 'ChrgBr', name: 'Details of charges', meaning: 'Who pays the bank charges.' },
  { key: 'senderCharges', mt: ':71F:', mx: 'ChrgsInf', name: "Sender's charges", meaning: 'Charges already deducted by banks along the way.' },
  { key: 'bankInfo', mt: ':72:', mx: 'InstrForNxtAgt / InstrForCdtrAgt', name: 'Sender to receiver information', meaning: 'Instructions between the banks.' },
  { key: 'regulatory', mt: ':77B:', mx: 'RgltryRptg', name: 'Regulatory reporting', meaning: 'Information some countries require for central bank reporting.' },
];
