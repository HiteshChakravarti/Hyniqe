// Builds matching pacs.008 / MT103 pairs, optionally with injected translation faults. Used for samples and the benchmark.

export interface Spec {
  uetr: string; amount: string; ccy: string; date: string; chrg: "DEBT" | "CRED" | "SHAR";
  dbtr: string; dbtrStreet: string; dbtrTown: string; dbtrCtry: string; dbtrLei?: string; dbtrIban: string;
  cdtr: string; cdtrStreet: string; cdtrTown: string; cdtrCtry: string; cdtrIban: string; cdtrAgt: string;
  ultDbtr?: string; ultCdtr?: string; ustrd: string; strd?: boolean; purp?: string;
}
export type Fault = "TRUNCATED_NAME" | "ULTIMATE_PARTY_LOST" | "REMITTANCE_TRUNCATED" | "PURPOSE_LOST" | "LEI_LOST" | "ADDRESS_LOST" | "UETR_LOST" | "AMOUNT_MISMATCH" | "CHARGES_MISMATCH" | "ACCOUNT_MISMATCH";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const x = (cond: unknown, s: string) => (cond ? s : "");

export function pacs008(s: Spec): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
 <FIToFICstmrCdtTrf>
  <GrpHdr><MsgId>MSG${s.uetr.slice(0, 8)}</MsgId><CreDtTm>${s.date}T09:00:00Z</CreDtTm><NbOfTxs>1</NbOfTxs><SttlmInf><SttlmMtd>INDA</SttlmMtd></SttlmInf></GrpHdr>
  <CdtTrfTxInf>
   <PmtId><InstrId>INS${s.uetr.slice(0, 6)}</InstrId><EndToEndId>E2E-${s.uetr.slice(0, 8)}</EndToEndId><UETR>${s.uetr}</UETR></PmtId>
   <IntrBkSttlmAmt Ccy="${s.ccy}">${s.amount}</IntrBkSttlmAmt><IntrBkSttlmDt>${s.date}</IntrBkSttlmDt><ChrgBr>${s.chrg}</ChrgBr>
   ${x(s.ultDbtr, `<UltmtDbtr><Nm>${esc(s.ultDbtr ?? "")}</Nm></UltmtDbtr>`)}
   <Dbtr><Nm>${esc(s.dbtr)}</Nm><PstlAdr><StrtNm>${esc(s.dbtrStreet)}</StrtNm><TwnNm>${esc(s.dbtrTown)}</TwnNm><Ctry>${s.dbtrCtry}</Ctry></PstlAdr>${x(s.dbtrLei, `<Id><OrgId><LEI>${s.dbtrLei}</LEI></OrgId></Id>`)}</Dbtr>
   <DbtrAcct><Id><IBAN>${s.dbtrIban}</IBAN></Id></DbtrAcct>
   <DbtrAgt><FinInstnId><BICFI>DEUTDEFFXXX</BICFI></FinInstnId></DbtrAgt>
   <CdtrAgt><FinInstnId><BICFI>${s.cdtrAgt}</BICFI></FinInstnId></CdtrAgt>
   <Cdtr><Nm>${esc(s.cdtr)}</Nm><PstlAdr><StrtNm>${esc(s.cdtrStreet)}</StrtNm><TwnNm>${esc(s.cdtrTown)}</TwnNm><Ctry>${s.cdtrCtry}</Ctry></PstlAdr></Cdtr>
   <CdtrAcct><Id><IBAN>${s.cdtrIban}</IBAN></Id></CdtrAcct>
   ${x(s.ultCdtr, `<UltmtCdtr><Nm>${esc(s.ultCdtr ?? "")}</Nm></UltmtCdtr>`)}
   ${x(s.purp, `<Purp><Cd>${s.purp}</Cd></Purp>`)}
   <RmtInf>${s.ustrd ? `<Ustrd>${esc(s.ustrd)}</Ustrd>` : ""}${x(s.strd, "<Strd><RfrdDocInf><Nb>INV-1001</Nb></RfrdDocInf></Strd>")}</RmtInf>
  </CdtTrfTxInf>
 </FIToFICstmrCdtTrf>
</Document>
`;
}

const chunk = (s: string, n: number) => s.match(new RegExp(`.{1,${n}}`, "g")) ?? [];
const MAP = { DEBT: "OUR", CRED: "BEN", SHAR: "SHA" } as const;

/** A faithful MT103 translation of the spec, then the faults applied. */
export function mt103(s: Spec, faults: Fault[] = []): string {
  const has = (f: Fault) => faults.includes(f);
  const name35 = (n: string) => (has("TRUNCATED_NAME") && n.length > 35 ? n.slice(0, 34) + "+" : n);
  const dbtrLines = [`1/${name35(s.dbtr)}`.slice(0, 35), ...(has("ADDRESS_LOST") ? [] : [`2/${s.dbtrStreet}`.slice(0, 35), `3/${s.dbtrCtry}/${s.dbtrTown}`.slice(0, 35)])];
  if (!has("TRUNCATED_NAME") && s.dbtr.length > 33) { dbtrLines[0] = `1/${s.dbtr.slice(0, 33)}`; dbtrLines.splice(1, 0, `1/${s.dbtr.slice(33)}`); }
  const cdtrName = has("TRUNCATED_NAME") ? name35(s.cdtr) : s.cdtr;
  const cdtrLines = [...chunk(cdtrName, 35).slice(0, 2), `${s.cdtrStreet}`.slice(0, 35), `${s.cdtrCtry}/${s.cdtrTown}`.slice(0, 35)];
  const amount = has("AMOUNT_MISMATCH") ? (Number(s.amount) + 10).toFixed(2) : s.amount;
  let rem = s.ustrd;
  if (s.purp && !has("PURPOSE_LOST")) rem = `/PURP/${s.purp} ` + rem;
  if (s.ultDbtr && !has("ULTIMATE_PARTY_LOST")) rem = `/ULTD/${s.ultDbtr} ` + rem;
  if (s.ultCdtr && !has("ULTIMATE_PARTY_LOST")) rem = `/ULTB/${s.ultCdtr} ` + rem;
  if (s.dbtrLei && !has("LEI_LOST")) rem = `/LEI/${s.dbtrLei} ` + rem;
  const remLines = has("REMITTANCE_TRUNCATED") ? chunk(rem, 35).slice(0, 4) : chunk(rem, 35);
  const date = s.date.replace(/-/g, "").slice(2);
  return `{1:F01DEUTDEFFAXXX0000000000}{2:I103${s.cdtrAgt.slice(0, 8)}X${s.cdtrAgt.slice(8) || "XXX"}N}{3:${has("UETR_LOST") ? "" : `{121:${s.uetr}}`}}{4:
:20:REF${s.uetr.slice(0, 8).toUpperCase()}
:23B:CRED
:32A:${date}${s.ccy}${amount.replace(".", ",")}
:50F:/${s.dbtrIban}
${dbtrLines.join("\n")}
:57A:${s.cdtrAgt}
:59:/${has("ACCOUNT_MISMATCH") ? s.cdtrIban.slice(0, -2) + (s.cdtrIban.endsWith("11") ? "22" : "11") : s.cdtrIban}
${cdtrLines.join("\n")}
:70:${remLines.join("\n")}
:71A:${has("CHARGES_MISMATCH") ? (MAP[s.chrg] === "SHA" ? "OUR" : "SHA") : MAP[s.chrg]}
-}`;
}
