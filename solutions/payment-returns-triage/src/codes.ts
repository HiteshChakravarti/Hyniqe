// ISO 20022 status and return reason codes most often seen on rejected and returned payments,
// in plain English, with the root-cause group, who has to act, and the data fix.

export type Group = 'Bank account' | 'Beneficiary name' | 'Address and regulatory data' | 'Amount and funding' | 'Duplicate or cancelled' | 'File and format' | 'Dates and cut-off' | 'Bank details and routing' | 'Direct debit mandate' | 'Fraud and compliance' | 'Unspecified';
export type Who = 'You' | 'Your supplier' | 'Your bank';

export interface ReasonCode {
  code: string;
  meaning: string;
  group: Group;
  who: Who;
  fix: string;
}

const C = (code: string, meaning: string, group: Group, who: Who, fix: string): ReasonCode => ({ code, meaning, group, who, fix });

export const CODES: ReasonCode[] = [
  C('AC01', 'The account number is wrong.', 'Bank account', 'Your supplier', 'Get the correct IBAN from the supplier in writing, confirm it by phone, update the vendor master and pay again.'),
  C('AC02', 'Your own (debtor) account number is wrong.', 'Bank account', 'You', 'Check the debtor IBAN in your payment file or ERP bank set-up.'),
  C('AC03', 'The beneficiary account number is not valid.', 'Bank account', 'Your supplier', 'Ask the supplier for the correct account and update the vendor master.'),
  C('AC04', 'The beneficiary account is closed.', 'Bank account', 'Your supplier', 'Ask the supplier for their new account and confirm the change by phone before paying; changed bank details are the most common fraud route.'),
  C('AC06', 'The beneficiary account is blocked.', 'Bank account', 'Your supplier', 'Contact the supplier; do not pay to another account until they confirm one.'),
  C('AC13', 'The account type is not allowed for this payment.', 'Bank account', 'Your supplier', 'Ask the supplier for a current account that accepts this payment type.'),
  C('AG01', 'Payments of this kind are not allowed on the account.', 'Bank account', 'Your supplier', 'Ask the supplier for an account that accepts the payment, for example a business current account.'),
  C('AG02', 'The bank operation code is not valid.', 'File and format', 'You', 'Check the payment type and local instrument codes in the file.'),
  C('AM01', 'The amount is zero.', 'Amount and funding', 'You', 'Remove zero-amount payments before sending the file.'),
  C('AM02', 'The amount is above the allowed maximum.', 'Amount and funding', 'You', 'Split the payment or use a high-value payment type; check limits with your bank.'),
  C('AM03', 'The currency is not allowed.', 'Amount and funding', 'You', 'Send in a currency the scheme and account support, for example EUR for SEPA.'),
  C('AM04', 'There was not enough money on your account.', 'Amount and funding', 'You', 'Fund the account or adjust the payment run date, then resend.'),
  C('AM05', 'The payment is a duplicate.', 'Duplicate or cancelled', 'You', 'Check whether the first payment went through before resending; find the source of the duplicate.'),
  C('AM09', 'The amount is not what was agreed.', 'Amount and funding', 'You', 'Check the invoice amount with the supplier.'),
  C('AM10', 'The control sum in the file is wrong.', 'File and format', 'You', 'Recalculate the control sum and number of transactions in the file header.'),
  C('BE01', 'The beneficiary name does not match the account holder.', 'Beneficiary name', 'Your supplier', 'Use the exact legal name on the account; ask the supplier to confirm it.'),
  C('BE04', 'The beneficiary address is missing or incomplete.', 'Address and regulatory data', 'You', 'Add a structured address (at least town and country) to the vendor record.'),
  C('BE05', 'The bank does not recognise who sent the file.', 'File and format', 'You', 'Check the initiating party identification agreed with your bank.'),
  C('BE06', 'The bank does not know the beneficiary.', 'Beneficiary name', 'Your supplier', 'Confirm the beneficiary name and account with the supplier.'),
  C('BE07', 'Your own (debtor) address is missing.', 'Address and regulatory data', 'You', 'Add your company address to the debtor block of the payment file.'),
  C('CH03', 'The execution date is too far in the future.', 'Dates and cut-off', 'You', 'Send the payment closer to the execution date.'),
  C('CH04', 'The execution date is too far in the past.', 'Dates and cut-off', 'You', 'Set a current execution date and resend.'),
  C('CNOR', 'The beneficiary bank cannot be reached through this scheme.', 'Bank details and routing', 'Your bank', 'Check that the beneficiary bank is reachable for this payment type, or pay another way.'),
  C('CURR', 'The currency is wrong.', 'Amount and funding', 'You', 'Correct the currency in the payment.'),
  C('CUST', 'Cancelled at the customer\'s request.', 'Duplicate or cancelled', 'You', 'No fix needed if the cancellation was intended.'),
  C('DNOR', 'Your bank cannot be reached through this scheme.', 'Bank details and routing', 'Your bank', 'Contact your bank.'),
  C('DS02', 'The order was cancelled.', 'Duplicate or cancelled', 'You', 'Confirm the cancellation was intended.'),
  C('DT01', 'The date is not valid.', 'Dates and cut-off', 'You', 'Correct the date format or choose a business day.'),
  C('DUPL', 'The payment is a duplicate.', 'Duplicate or cancelled', 'You', 'Check whether the first payment went through before resending.'),
  C('ED05', 'Settlement between banks failed.', 'Bank details and routing', 'Your bank', 'Ask your bank to investigate and resend.'),
  C('FF01', 'The file format is not valid.', 'File and format', 'You', 'Check the file against the bank\'s format; the Payment File Doctor shows what is wrong.'),
  C('FOCR', 'Returned after a cancellation request.', 'Duplicate or cancelled', 'You', 'No fix needed if you asked for the cancellation.'),
  C('FRAD', 'The payment is suspected to be fraudulent.', 'Fraud and compliance', 'You', 'Stop and investigate. Check how the bank details were obtained and confirm them with the supplier by phone.'),
  C('MD01', 'There is no mandate for this direct debit.', 'Direct debit mandate', 'You', 'Obtain a signed mandate before collecting.'),
  C('MD06', 'The payer asked for a refund.', 'Direct debit mandate', 'You', 'Contact the customer to resolve the disputed collection.'),
  C('MD07', 'The account holder has died.', 'Direct debit mandate', 'You', 'Stop collections and contact the estate.'),
  C('MS02', 'Refused by the beneficiary, reason not given.', 'Unspecified', 'Your supplier', 'Ask the supplier why the payment was refused.'),
  C('MS03', 'Refused by a bank, reason not given.', 'Unspecified', 'Your bank', 'Ask your bank for the reason.'),
  C('NARR', 'See the text the bank added.', 'Unspecified', 'Your bank', 'Read the additional information; ask your bank if it is unclear.'),
  C('RC01', 'The bank identifier (BIC) is wrong.', 'Bank details and routing', 'You', 'Correct the BIC, or leave it out where the IBAN is enough (SEPA).'),
  C('RF01', 'The transaction reference is not unique.', 'Duplicate or cancelled', 'You', 'Make end-to-end and instruction references unique per payment.'),
  C('RR01', 'Your account or identification is missing, as required by regulation.', 'Address and regulatory data', 'You', 'Add the debtor account and identification to the file.'),
  C('RR02', 'Your name or address is missing, as required by regulation.', 'Address and regulatory data', 'You', 'Add your full name and structured address to the debtor block.'),
  C('RR03', 'The beneficiary name or address is missing, as required by regulation.', 'Address and regulatory data', 'You', 'Add the beneficiary\'s name and structured address (town and country at least) to the vendor record.'),
  C('RR04', 'Rejected for a regulatory reason.', 'Fraud and compliance', 'Your bank', 'Ask your bank which rule applied, for example sanctions screening.'),
  C('SL01', 'Refused by a service the payer\'s bank offers (for example a block list).', 'Direct debit mandate', 'Your supplier', 'Ask the payer to allow your collections.'),
  C('TECH', 'A technical problem at a bank.', 'Bank details and routing', 'Your bank', 'Resend; contact your bank if it happens again.'),
  C('TM01', 'Received after the cut-off time.', 'Dates and cut-off', 'You', 'Send earlier, or choose the next business day.'),
  C('UPAY', 'The payment was not due.', 'Duplicate or cancelled', 'You', 'Check the invoice and whether it had already been paid.'),
];

export const BY_CODE: Record<string, ReasonCode> = Object.fromEntries(CODES.map((c) => [c.code, c]));

export function explain(code: string): ReasonCode {
  const c = code.trim().toUpperCase();
  return BY_CODE[c] ?? { code: c || '(none)', meaning: c ? `Code ${c} is not in the common list; your bank's documentation has the meaning.` : 'No reason code was given.', group: 'Unspecified', who: 'Your bank', fix: 'Ask your bank what the code means.' };
}

/** What to do about a whole group of returns. */
export const GROUP_FIX: Record<Group, string> = {
  'Bank account': 'Confirm each account with the supplier by phone on a number you already hold, then update the vendor master before paying again.',
  'Beneficiary name': 'Use the exact legal name of the account holder; ask suppliers to confirm it.',
  'Address and regulatory data': 'Add structured addresses (at least town and country) to the vendor records; the Payment Data Repair tool does this in bulk.',
  'Amount and funding': 'Check funding, limits and currencies before the payment run.',
  'Duplicate or cancelled': 'Check whether the original payment went through before resending anything.',
  'File and format': 'Validate the file before sending; the Payment File Doctor shows and fixes what is wrong.',
  'Dates and cut-off': 'Send files earlier and use business days only.',
  'Bank details and routing': 'Correct BICs and check that the beneficiary bank is reachable; ask your bank about network failures.',
  'Direct debit mandate': 'Check mandates and contact the payers concerned.',
  'Fraud and compliance': 'Stop and investigate with your bank and the supplier before any resend.',
  Unspecified: 'Ask the bank or the supplier for the reason.',
};
