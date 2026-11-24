// Legacy Runbook Builder
// Reads old procedure notes, emails, SOPs and scripts (shell, batch, JCL, cron, SQL) and turns them into a structured
// runbook: steps, schedule and cut-offs, systems, inputs/outputs, contacts, glossary, and the knowledge gaps that
// would hurt if the one person who knows this process left.

export type SourceKind = "notes" | "shell" | "batch" | "jcl" | "cron" | "sql" | "python";

export interface Step { n: number; text: string; source: string; line: number; kind: "manual" | "command" | "check" | "decision"; command?: string }
export interface Gap { type: GapType; text: string; source: string; line: number; advice: string }
export type GapType = "VAGUE_CHECK" | "KEY_PERSON" | "HARDCODED_SECRET" | "HARDCODED_ENV" | "NO_FAILURE_PATH" | "MANUAL_SPREADSHEET" | "TODO_WORKAROUND" | "UNEXPLAINED_ACRONYM" | "NO_OWNER" | "NO_SCHEDULE" | "DESTRUCTIVE_COMMAND" | "LEGACY_TECH";

export interface Runbook {
  title: string;
  purpose: string;
  sources: { name: string; kind: SourceKind; lines: number }[];
  schedule: { text: string; source: string; line: number }[];
  steps: Step[];
  systems: string[];
  files: string[];
  hosts: string[];
  contacts: { who: string; context: string }[];
  glossary: { term: string; meaning: string; known: boolean }[];
  gaps: Gap[];
  completeness: { score: number; checks: { label: string; ok: boolean }[] };
}

// ------------------------------------------------------------------ detection helpers

export function detectKind(name: string, text: string): SourceKind {
  const n = name.toLowerCase();
  if (/\.(sh|bash|ksh|zsh)$/.test(n) || /^#!.*\b(ba|k|z)?sh\b/.test(text)) return "shell";
  if (/\.(bat|cmd|ps1)$/.test(n)) return "batch";
  if (/\.(jcl|jcls)$/.test(n) || /^\/\/\S+\s+(JOB|EXEC)\b/m.test(text)) return "jcl";
  if (/crontab|\.cron$/.test(n) || /^\s*([\d*\/,-]+\s+){4}[\d*\/,-]+\s+\S/m.test(text) && text.split("\n").filter((l) => /^\s*([\d*\/,-]+\s+){4}/.test(l)).length >= 1 && !/[a-z]{4,} [a-z]{4,} [a-z]{4,}/i.test(text.split("\n")[0])) return "cron";
  if (/\.sql$/.test(n)) return "sql";
  if (/\.py$/.test(n)) return "python";
  return "notes";
}

const SYSTEMS = [
  "SWIFT", "SWIFT Alliance", "Alliance Access", "Alliance Lite2", "SWIFTNet", "FIN", "CHAPS", "BACS", "Faster Payments", "Fedwire", "CHIPS", "ACH", "SEPA", "TARGET2", "T2S", "RTGS", "CLS",
  "Euroclear", "Clearstream", "DTCC", "DTC", "CREST", "Bloomberg", "Reuters", "Refinitiv", "Murex", "Calypso", "Summit", "Kondor", "Finacle", "Flexcube", "T24", "Temenos", "SAP", "Oracle", "PeopleSoft",
  "DB2", "Sybase", "SQL Server", "Postgres", "mainframe", "CICS", "IMS", "MQ", "IBM MQ", "Kafka", "Control-M", "Autosys", "Tivoli", "cron", "SFTP", "FTP", "Connect:Direct", "NDM", "Axway",
  "Excel", "Access", "Outlook", "SharePoint", "Jira", "ServiceNow", "Remedy", "Citrix", "Unix", "Linux", "Windows", "Putty", "WinSCP", "TLM", "SmartStream", "Intellimatch", "Duco", "Fircosoft", "Actimize", "GPP", "Volante", "Finastra",
];

const BANKING_GLOSSARY: Record<string, string> = {
  SSI: "Standing Settlement Instructions", BIC: "Bank Identifier Code (SWIFT code)", IBAN: "International Bank Account Number", EOD: "End of day", SOD: "Start of day", BOD: "Beginning of day",
  STP: "Straight-through processing", RTGS: "Real-time gross settlement", CHAPS: "UK high-value payment system", BACS: "UK bulk payment system", ACH: "Automated Clearing House", FX: "Foreign exchange",
  KYC: "Know your customer", AML: "Anti-money laundering", OFAC: "US sanctions office", GL: "General ledger", PNL: "Profit and loss", "P&L": "Profit and loss", BAU: "Business as usual", SLA: "Service level agreement",
  CSD: "Central securities depository", DVP: "Delivery versus payment", FOP: "Free of payment", NOSTRO: "Our account held at another bank", VOSTRO: "Another bank's account held with us", CCY: "Currency",
  RECON: "Reconciliation", RECS: "Reconciliations", MT103: "SWIFT single customer credit transfer", MT202: "SWIFT bank-to-bank transfer", MT940: "SWIFT customer statement", MT950: "SWIFT statement message",
  PACS: "ISO 20022 payments clearing & settlement messages", CAMT: "ISO 20022 cash management messages", PAIN: "ISO 20022 payment initiation messages", JCL: "Job Control Language (mainframe jobs)",
  DSN: "Dataset name (mainframe)", SFTP: "Secure file transfer", NDM: "Network Data Mover (Connect:Direct)", MI: "Management information", UAT: "User acceptance testing", PROD: "Production", DR: "Disaster recovery",
  RCA: "Root cause analysis", OPS: "Operations", FO: "Front office", MO: "Middle office", BO: "Back office", CUTOFF: "Cut-off time", TPS: "Third-party system", CSV: "Comma-separated values file",
  DB: "Database", AIX: "IBM's Unix operating system", CSA: "Credit Support Annex (collateral agreement)", MT950S: "SWIFT statement messages", ISIN: "Securities identifier", CUSIP: "US securities identifier", LEI: "Legal Entity Identifier", MTM: "Mark to market", NAV: "Net asset value", CA: "Corporate actions", TLM: "SmartStream reconciliation platform",
};

const VERBS = /^(?:please\s+|then\s+|next,?\s+|first,?\s+|finally,?\s+|now\s+|also\s+)?(check|run|open|log ?in(?:to)?|login|start|stop|restart|send|copy|move|verify|validate|upload|download|reconcile|approve|authori[sz]e|release|email|e-mail|call|phone|export|import|update|confirm|review|compare|wait|submit|save|print|filter|sort|paste|delete|rename|raise|escalate|notify|inform|close|refresh|load|extract|transfer|ftp|sftp|schedule|trigger|book|post|match|investigate|tick|sign|archive|go to|navigate|select|click|enter|type|key in|look at|make sure|ensure|create|prepare|generate|forward|chase|monitor|kick off|rerun|re-run|clear|block|unblock|cancel|amend|repair|fix)\b/i;

const GAP_ADVICE: Record<GapType, string> = {
  VAGUE_CHECK: "Write the exact pass/fail rule (which field, what value, what tolerance) so someone new can do it.",
  KEY_PERSON: "Write down what this person knows or decides, and name a backup.",
  HARDCODED_SECRET: "Remove the credential from the document/script, rotate it, and store it in a vault.",
  HARDCODED_ENV: "Record which environment this points to, and how to change it for DR or a server move.",
  NO_FAILURE_PATH: "Add what to do when this step fails: who to call, how to retry, when to escalate, and the business impact.",
  MANUAL_SPREADSHEET: "Document the spreadsheet (location, formulas, macros) or replace it with a controlled tool. These are often single points of failure.",
  TODO_WORKAROUND: "Find out why the workaround exists and whether it is still needed.",
  UNEXPLAINED_ACRONYM: "Add the meaning to the glossary.",
  NO_OWNER: "Name the accountable owner and a backup for this process.",
  NO_SCHEDULE: "State when this runs and its cut-off times.",
  DESTRUCTIVE_COMMAND: "Explain what this deletes or overwrites, and how to recover if it runs on the wrong files.",
  LEGACY_TECH: "Note the support status of this technology and who can still maintain it.",
};

const VAGUE = /\b(looks? (ok|okay|fine|right|good|normal)|seems? (ok|okay|fine|right)|as usual|the usual (way|place|checks?|steps?|folder|file)|like (we always do|normal|last time)|you('ll)? know|if needed|if necessary|when required|as appropriate|sometimes|normally(?!\s+does)|usually(?!\s+(does|do|handles?|runs?))|eyeball|sanity check|quick check|make sure (it'?s|everything is) (ok|okay|fine|correct)|nothing (weird|strange|odd)|etc\.?|and so on|whatever|roughly|more or less|ballpark|common sense|use (your )?judg(e)?ment)\b/i;
const KEY_PERSON = /\b([Aa]sk|[Cc]all|[Pp]ing|[Cc]heck with|[Ss]peak to|[Tt]alk to|[Ee]mail|[Cc]ontact|[Gg]et|[Ee]scalate to|[Ww]ait for|[Oo]nly)\s+((?:[A-Z][a-z]+)(?:\s+[A-Z][a-z]+)?)\b(?!\s+(?:team|desk|ops|support|service|system|file|report|queue))|\b([A-Z][a-z]+)\s+(knows|will know|usually does|is the only one|has the (password|access|spreadsheet|macro))\b|\bonly\s+([A-Z][a-z]+)\s+(can|knows|has)\b/;
const SECRET = /\b(password|passwd|pwd|pass|passphrase|secret|api[_-]?key|token)\b\s*[:=]\s*\S+|\b-p\s*['"]?[^\s'"-]{4,}|\b(user(name)?)\s*[:=]\s*\S+\s+(password|pwd|pass)\s*[:=]\s*\S+|\bsshpass\s+-p\s+\S+|\/\/\S+:[^@\s/]+@|\b(sqlplus|isql|sqlcmd|mysql|psql)\s+(-\S+\s+)*\w+\/[^@\s/]+@/i;
const HOST = /\b((?:\d{1,3}\.){3}\d{1,3})\b|\b([a-z][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:internal|corp|local|lan|intra|bank|net|com|co\.uk|org))\b|(\\\\[A-Za-z0-9_-]+)\\/i;
const FILEPAT = /(?:[A-Za-z]:\\|\/)(?:[\w.$ -]+[\\/])*[\w.$*-]+\.(?:csv|txt|xlsx?|xlsm|dat|xml|json|pdf|zip|gz|out|log|rpt|fin|swift|mt\d{3})\b|\b[\w$*-]+\.(?:csv|txt|xlsx?|xlsm|dat|xml|json|pdf|zip|gz|out|rpt|fin)\b|\b[A-Z0-9$#@]{1,8}(?:\.[A-Z0-9$#@]{1,8}){2,}(?:\(\+?\d+\))?/g;
const TIMES = /\b(?:by|before|after|at|until|no later than|cut-?off(?: is| time)?:?|from)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b(?:\s*(?:gmt|bst|cet|est|et|ist|utc|uk time|ny time|local))?|\b\d{1,2}:\d{2}\s*(?:am|pm)?\b(?:\s*(?:gmt|bst|cet|est|et|ist|utc))?|\b(?:eod|end of day|sod|start of day|close of business|cob|t\+\d|month[- ]end|quarter[- ]end|year[- ]end|first business day|last business day|every (?:day|morning|evening|night|monday|tuesday|wednesday|thursday|friday|week|month)|daily|weekly|monthly|on (?:mondays|fridays|weekdays))\b/gi;
const FAILURE = /\b(if\s+(?:\w+\s+){0,3}(fails?|errors?|abends?|breaks?|is late|is missing|hasn'?t (arrived|come)|doesn'?t (arrive|run|work|come))|if not\b|on (failure|error)|in case of (failure|error|issues?)|escalat\w+|abend|rc\s*[!=]=?\s*0|\$\?\s*-ne\s*0|\|\|\s*(exit|echo|mail)|errorlevel|exit 1|retry|rerun|re-run|fallback|contingency|dr site)\b/i;
const OWNER = /\b(owner|owned by|responsible|accountable|raci|process owner|contact(s)?:|support team|escalation contacts?)\b/i;
const SPREADSHEET = /\b(excel|spreadsheet|workbook|\.xlsx?m?|macro|vba|pivot|vlookup|copy (and|&) paste|paste (it|them|the data) into)\b/i;
const TODO = /\b(todo|fixme|hack|workaround|temporary fix|temp fix|don'?t touch|do not change|nobody knows why|legacy reasons?|for some reason|not sure why)\b/i;
const LEGACY = /\b(windows (xp|7|2003|2008)|excel 2003|ms access|access database|lotus notes|cobol|fortran|vb6|visual basic 6|solaris|aix 5|as\/?400|iseries|perl 5\.8|python 2|java 6|java 1\.6|internet explorer|ie11|fax)\b/i;

// ------------------------------------------------------------------ command explanations

export function explainCommand(cmd: string, kind: SourceKind): string | undefined {
  const c = cmd.trim();
  if (!c || /^(#|rem\b|::|\/\/\*|--)/i.test(c)) return undefined;
  if (/^(set\s+-[a-z]+|export\s+\w+=|echo\b|fi|done|esac|then|else|do|\{|\}|exit 0)\s*$/i.test(c)) return undefined;
  const m = (re: RegExp) => c.match(re);
  let r: RegExpMatchArray | null;
  if (kind === "jcl") {
    if ((r = m(/^\/\/(\S+)\s+JOB\b/))) return `Mainframe job ${r[1]} starts.`;
    if ((r = m(/^\/\/(\S+)\s+EXEC\s+(?:PGM=)?(\S+?)(?:,|\s|$)/))) {
      const cond = c.match(/COND=\((\d+),(LT|LE|EQ|NE|GT|GE)\)/);
      const condText = cond ? ` (skipped if the test "${cond[1]} ${cond[2]} return code of an earlier step" is true${cond[2] === "LT" ? `, i.e. runs only if earlier steps ended with code ${cond[1]} or lower` : ""})` : "";
      return `Step ${r[1]}: run program ${r[2].replace(/^PROC=/, "procedure ")}${condText}.`;
    }
    if ((r = m(/^\/\/(\S+)\s+DD\s+.*DSN=([^,\s]+)(?:.*DISP=\(?(\w+))?/))) return `${r[1]} uses dataset ${r[2]}${r[3] ? ` (${({ SHR: "read, shared", OLD: "exclusive", NEW: "created new", MOD: "appended" } as Record<string, string>)[r[3]] ?? r[3]})` : ""}.`;
    if (/^\/\/\s*IF\b/.test(c)) return "Condition: only continue if the previous step's return code allows it.";
    return undefined;
  }
  if (kind === "cron") {
    if ((r = m(/^((?:[\d*\/,-]+\s+){4}[\d*\/,-]+)\s+(.+)$/))) {
      const cmd = r[2].replace(/\s*\d?>>?\s*\S+/g, "").replace(/\s*2>&1/g, "").trim();
      const log = r[2].match(/>>?\s*(\S+)/)?.[1];
      return `Scheduled (${describeCron(r[1])}): ${explainCommand(cmd, "shell") ?? "run " + cmd}${log ? ` (output logged to ${log})` : ""}`;
    }
    return undefined;
  }
  if ((r = m(/^(?:sftp|ftp|lftp)\b.*?(\S+@)?([\w.-]+\.[\w.-]+|\d+\.\d+\.\d+\.\d+)/))) return `Connect by ${c.split(/\s/)[0].toUpperCase()} to ${r[2]}.`;
  if ((r = m(/^scp\s+(?:-\S+\s+)*(\S+)\s+(\S+)/))) return `Securely copy ${r[1]} to ${r[2]}.`;
  if ((r = m(/^(?:put|mput)\s+(\S+)/))) return `Upload ${r[1]}.`;
  if ((r = m(/^(?:get|mget)\s+(\S+)/))) return `Download ${r[1]}.`;
  if ((r = m(/^(?:cp|copy|xcopy|robocopy)\s+(?:-\S+\s+|\/\S+\s+)*(\S+)\s+(.+?)\s*$/i))) return `Copy ${r[1]} to ${r[2]}.`;
  if ((r = m(/^(?:mv|move|ren|rename)\s+(?:-\S+\s+)*(\S+)\s+(\S+)/i))) return `Move/rename ${r[1]} to ${r[2]}.`;
  if ((r = m(/^(?:rm|del|erase)\s+(?:-\S+\s+|\/\S+\s+)*(.+)/i))) return `Delete ${r[1].trim()}.`;
  if ((r = m(/^(?:mkdir|md)\s+(?:-p\s+)?(\S+)/i))) return `Create folder ${r[1]}.`;
  if ((r = m(/^(?:zip|gzip|tar\s+-?c\S*)\s+(?:-\S+\s+)*(\S+)/))) return `Compress ${r[1]}.`;
  if ((r = m(/^(?:unzip|gunzip|tar\s+-?x\S*)\s+(?:-\S+\s+)*(\S+)/))) return `Extract ${r[1]}.`;
  if ((r = m(/^(?:mail|mailx|sendmail|blat)\b.*?-s\s+["']([^"']+)["']\s*(\S+@\S+)?/))) return `Email "${r[1]}"${r[2] ? " to " + r[2] : ""}.`;
  if ((r = m(/^(?:sqlplus|sqlcmd|isql|psql|mysql|db2)\b.*?(@\S+\.sql|-i\s+\S+|-f\s+\S+)?/))) return `Run database script${r[1] ? " " + r[1].replace(/^(-i|-f)\s+/, "").replace(/^@/, "") : ""} (${c.split(/\s/)[0]}).`;
  if ((r = m(/^java\b.*?-jar\s+(\S+)/))) return `Run Java program ${r[1]}.`;
  if ((r = m(/^(?:python3?|perl|ruby|node|Rscript)\s+(\S+)/))) return `Run script ${r[1]}.`;
  if ((r = m(/^(?:\.\/|sh\s+|bash\s+|ksh\s+|call\s+|\.\s+)(\S+)/i))) return `Run ${r[1]}.`;
  if ((r = m(/^(?:wc\s+-l)\s+(\S+)/))) return `Count lines in ${r[1]} (record count check).`;
  if ((r = m(/^(?:grep|findstr)\s+(?:-\S+\s+)*["']?([^"'\s]+)["']?\s+(\S+)/i))) return `Search ${r[2]} for "${r[1]}".`;
  if ((r = m(/^(?:sleep|timeout)\s+(?:\/t\s+)?(\d+)/i))) return `Wait ${r[1]} seconds.`;
  if ((r = m(/^if\s+\[\s*!?\s*-[fesd]\s+(\S+)/))) return `Check whether ${r[1]} exists before continuing.`;
  if ((r = m(/^if\s+(?:\[|test)\s+.*(\$\?|\$rc|\$RC|errorlevel)/i))) return "Check whether the previous command succeeded.";
  if (/^if\b/i.test(c)) return "Decision: " + c.replace(/^if\s+/i, "").replace(/;?\s*then$/, "") + ".";
  if ((r = m(/^(?:ctmorder|ctmrun|sendevent|autorep)\b(.*)/))) return `Scheduler command: ${c}.`;
  if ((r = m(/^(?:curl|wget)\s+.*?(https?:\/\/\S+)/))) return `Call ${r[1]}.`;
  if ((r = m(/^(?:chmod|chown)\s+(\S+)\s+(\S+)/))) return `Change permissions of ${r[2]} (${r[1]}).`;
  if ((r = m(/^cd\s+(\S+)/i))) return `Go to folder ${r[1]}.`;
  if ((r = m(/^(?:SELECT|UPDATE|INSERT|DELETE|MERGE|TRUNCATE)\b/i))) return `Database ${r[0].toUpperCase()} statement${/^(UPDATE|DELETE|TRUNCATE)/i.test(c) && !/\bWHERE\b/i.test(c) ? " (affects the whole table!)" : ""}.`;
  return undefined;
}

export function describeCron(expr: string): string {
  const [min, hour, dom, mon, dow] = expr.trim().split(/\s+/);
  const days: Record<string, string> = { "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat", "7": "Sun", "1-5": "Mon–Fri" };
  const time = /^\d+$/.test(hour) && /^\d+$/.test(min) ? `${hour.padStart(2, "0")}:${min.padStart(2, "0")}` : `minute ${min}, hour ${hour}`;
  const d = dow !== "*" ? (days[dow] ?? `weekday ${dow}`) : dom !== "*" ? `day ${dom} of month` : "every day";
  return `${d} at ${time}${mon !== "*" ? `, month ${mon}` : ""}`;
}

// ------------------------------------------------------------------ main

export function buildRunbook(inputs: { name: string; text: string }[], title?: string): Runbook {
  const steps: Step[] = [];
  const gaps: Gap[] = [];
  const schedule: Runbook["schedule"] = [];
  const systems = new Set<string>();
  const files = new Set<string>();
  const hosts = new Set<string>();
  const contacts = new Map<string, string>();
  const acronyms = new Map<string, string>(); // term → meaning found in text ("" if none)
  const sources: Runbook["sources"] = [];
  let allText = "";
  let purpose = "";

  for (const { name, text } of inputs) {
    const kind = detectKind(name, text);
    const lines = text.replace(/\r/g, "").split("\n");
    sources.push({ name, kind, lines: lines.length });
    allText += "\n" + text;
    if (!purpose && kind === "notes") purpose = firstSentence(text);

    // join JCL / shell continuation lines
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trim();
      if (!line) continue;
      const where = { source: name, line: i + 1 };
      const isComment = /^(#(?!!)|rem\b|::|\/\/\*|--|')/i.test(line);
      const content = isComment ? line.replace(/^(#|rem\b|::|\/\/\*|--|')\s*/i, "") : line;

      // ---- steps
      if (kind === "notes") {
        const bullet = line.match(/^(?:\d+[.)]|[-*•]|step\s*\d+[:.)]?|[a-z][.)])\s+(.*)$/i);
        const body = (bullet ? bullet[1] : line).trim();
        if (bullet || VERBS.test(body)) {
          if (bullet || body.length < 220) {
            const kindOf: Step["kind"] = /^(if|when|unless|in case)\b/i.test(body) ? "decision" : /^(check|verify|validate|make sure|ensure|confirm|compare|review|reconcile|look at)\b/i.test(body.replace(/^(please|then|next,?|first,?|now|also)\s+/i, "")) ? "check" : "manual";
            steps.push({ n: 0, text: maskSecret(body), kind: kindOf, ...where });
          }
        }
      } else if (!isComment) {
        const explanation = explainCommand(line, kind);
        if (explanation) steps.push({ n: 0, text: maskSecret(explanation), kind: /^(Check|Decision|Condition)/.test(explanation) ? "decision" : "command", command: maskSecret(line), ...where });
      }

      // ---- schedule / cut-offs (comments count too: that's where people write them)
      for (const t of content.matchAll(TIMES)) schedule.push({ text: t[0].trim(), ...where });
      if (kind === "cron" && !isComment) {
        const c = line.match(/^((?:[\d*\/,-]+\s+){4}[\d*\/,-]+)\s+/);
        if (c) schedule.push({ text: describeCron(c[1]), ...where });
      }
      if (kind === "jcl") {
        const s = line.match(/SCHENV=(\S+)|TIME=\(?([\d,]+)\)?/);
        if (s) schedule.push({ text: s[0], ...where });
      }

      // ---- inventory
      for (const sys of SYSTEMS) {
        const re = new RegExp(`(^|[^A-Za-z])${sys.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}(?![A-Za-z])`, sys === sys.toUpperCase() ? "" : "i");
        if (re.test(content)) systems.add(sys);
      }
      for (const f of content.matchAll(FILEPAT)) if (!/^[@\d.]+$/.test(f[0])) files.add(/\([^)]*\)$/.test(f[0]) ? f[0] : f[0].replace(/[),;]+$/, ""));
      const h = content.match(HOST);
      if (h && !isComment) {
        const host = (h[1] ?? h[2] ?? h[3] ?? h[0]).replace(/[,;.)]$/, "");
        const isIp = !!h[1];
        const afterAt = /@/.test(content.slice(Math.max(0, (h.index ?? 0) - 1), h.index ?? 0));
        if (!/\.(csv|txt|xlsx?|dat|xml|json|pdf|zip|gz|sh|py|sql|jar|log)$/i.test(host) && (isIp || !afterAt) && !/^(e\.g|i\.e)$/i.test(host)) hosts.add(host);
      }
      const kp = content.match(KEY_PERSON);
      if (kp) {
        const who = (kp[2] ?? kp[3] ?? kp[6] ?? "").trim();
        if (who && !/^(The|This|That|It|If|When|Then|Ops|Team|Support|Treasury|Desk|Front|Back|Middle|Payments|Finance|Settlements|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Excel|Outlook|Control|Bloomberg|Swift|SWIFT)$/.test(who.split(" ")[0])) {
          contacts.set(who, (contacts.get(who) ? contacts.get(who) + " | " : "") + maskSecret(content).slice(0, 120));
          gaps.push({ type: "KEY_PERSON", text: maskSecret(content), advice: GAP_ADVICE.KEY_PERSON, ...where });
        }
      }

      // ---- gaps
      if (VAGUE.test(content)) gaps.push({ type: "VAGUE_CHECK", text: maskSecret(content), advice: GAP_ADVICE.VAGUE_CHECK, ...where });
      if (SECRET.test(line)) gaps.push({ type: "HARDCODED_SECRET", text: maskSecret(line), advice: GAP_ADVICE.HARDCODED_SECRET, ...where });
      if (SPREADSHEET.test(content)) gaps.push({ type: "MANUAL_SPREADSHEET", text: maskSecret(content), advice: GAP_ADVICE.MANUAL_SPREADSHEET, ...where });
      if (TODO.test(content)) gaps.push({ type: "TODO_WORKAROUND", text: maskSecret(content), advice: GAP_ADVICE.TODO_WORKAROUND, ...where });
      if (LEGACY.test(content)) gaps.push({ type: "LEGACY_TECH", text: maskSecret(content), advice: GAP_ADVICE.LEGACY_TECH, ...where });
      if (!isComment && kind !== "notes" && (/^(rm\s+-r?f|del\s+\/[sqf]|rd\s+\/s|truncate\b|drop\s+table)/i.test(line) || /^(delete|update)\s+(?!.*\bwhere\b)/i.test(line) || /\brm\s+-rf?\s+\S*\*/.test(line))) {
        gaps.push({ type: "DESTRUCTIVE_COMMAND", text: line, advice: GAP_ADVICE.DESTRUCTIVE_COMMAND, ...where });
      }
      if (!isComment && h && kind !== "notes" && /(\d{1,3}\.){3}\d{1,3}|\\\\/.test(line)) gaps.push({ type: "HARDCODED_ENV", text: maskSecret(line), advice: GAP_ADVICE.HARDCODED_ENV, ...where });

      // ---- acronyms
      const letters = content.replace(/[^A-Za-z]/g, "");
      const mostlyUpper = letters.length > 8 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.6;
      if (kind !== "jcl" && !mostlyUpper) for (const a of content.matchAll(/\b([A-Z][A-Z0-9&]{1,5})\b(?:\s*\(([^)]{3,60})\))?/g)) {
        const term = a[1];
        if (/^\d|^[A-Z]$|^(AM|PM|OK|ID|NO|IF|THEN|ELSE|AND|OR|NOT|THE|TO|IN|ON|AT|BY|FROM|IS|IT|DD|DSN|PGM|JOB|EXEC|DISP|SHR|NEW|OLD|MOD|SYSOUT|SYSIN|SPACE|CYL|TRK|DCB|LRECL|RECFM|FB|COND|RC|ECHO|EXIT|SET|CD|PUT|GET|TBC|TBD|FYI|ASAP|NB|PS|EOF|FW|FWD|RE|CC|BCC|TODO|FIXME|IMPORTANT|DO|NOT|NEVER|ALWAYS|SELECT|UPDATE|INSERT|DELETE|WHERE|FROM|INTO|VALUES|COUNT|SUM|AS|GMT|BST|CET|EST|UTC|IST|UK|US|EU|USD|EUR|GBP|JPY|CHF|INR|AUD|CAD|SGD|HKD|ALL)$/.test(term)) continue;
        if (SYSTEMS.some((s) => s.toUpperCase() === term)) continue;
        if (a[2] && !acronyms.get(term)) acronyms.set(term, a[2].trim());
        else if (!acronyms.has(term)) acronyms.set(term, "");
      }
    }
  }

  // ---- whole-document gaps
  const docName = inputs.map((i) => i.name).join(", ");
  if (!FAILURE.test(allText)) gaps.push({ type: "NO_FAILURE_PATH", text: "No instructions for what to do if something fails or is late.", source: docName, line: 0, advice: GAP_ADVICE.NO_FAILURE_PATH });
  if (!OWNER.test(allText)) gaps.push({ type: "NO_OWNER", text: "No process owner or support contacts named.", source: docName, line: 0, advice: GAP_ADVICE.NO_OWNER });
  if (!schedule.length) gaps.push({ type: "NO_SCHEDULE", text: "No timing, frequency or cut-off found.", source: docName, line: 0, advice: GAP_ADVICE.NO_SCHEDULE });

  const glossary = [...acronyms.entries()]
    .map(([term, meaning]) => ({ term, meaning: meaning || BANKING_GLOSSARY[term] || BANKING_GLOSSARY[term.replace(/S$/, "")] || "", known: !!(meaning || BANKING_GLOSSARY[term] || BANKING_GLOSSARY[term.replace(/S$/, "")]) }))
    .sort((a, b) => a.term.localeCompare(b.term));
  for (const g of glossary.filter((x) => !x.known)) gaps.push({ type: "UNEXPLAINED_ACRONYM", text: g.term, source: docName, line: 0, advice: GAP_ADVICE.UNEXPLAINED_ACRONYM });

  steps.forEach((s, i) => (s.n = i + 1));
  const dedupSched = [...new Map(schedule.map((s) => [s.text.toLowerCase(), s])).values()];
  const checks = [
    { label: "Purpose stated", ok: purpose.length > 20 },
    { label: "Schedule / cut-offs", ok: dedupSched.length > 0 },
    { label: "Steps written down", ok: steps.length >= 3 },
    { label: "Systems identified", ok: systems.size > 0 },
    { label: "Owner / contacts", ok: OWNER.test(allText) },
    { label: "Failure handling", ok: FAILURE.test(allText) },
    { label: "Clear checks (no vague 'looks ok')", ok: !gaps.some((g) => g.type === "VAGUE_CHECK") },
    { label: "No single-person dependency", ok: !gaps.some((g) => g.type === "KEY_PERSON") },
    { label: "No credentials in documents", ok: !gaps.some((g) => g.type === "HARDCODED_SECRET") },
  ];
  return {
    title: title || guessTitle(inputs),
    purpose,
    sources,
    schedule: dedupSched,
    steps,
    systems: [...systems],
    files: [...files].slice(0, 60),
    hosts: [...hosts],
    contacts: [...contacts.entries()].map(([who, context]) => ({ who, context })),
    glossary,
    gaps,
    completeness: { score: checks.filter((c) => c.ok).length / checks.length, checks },
  };
}

function firstSentence(text: string): string {
  const t = text.replace(/^(subject|re|fw|fwd|from|to|cc|sent|date):.*$/gim, "").replace(/^\s*(hi|hello|hey|dear|morning|good morning|team)\b[^\n]{0,30}[,!]?\s*$/gim, "").replace(/\s+/g, " ").trim();
  const m = t.match(/^(.{20,240}?[.!?])(\s|$)/);
  return (m ? m[1] : t.slice(0, 200)).trim();
}

function guessTitle(inputs: { name: string; text: string }[]): string {
  for (const i of inputs) {
    const subj = i.text.match(/^subject:\s*(.+)$/im)?.[1] ?? i.text.match(/^#\s+(.+)$/m)?.[1];
    if (subj) return subj.replace(/^(re|fw|fwd):\s*/i, "").trim();
  }
  return inputs[0]?.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ?? "Runbook";
}

export function maskSecret(line: string): string {
  return line
    .replace(/((?:password|passwd|pwd|pass|passphrase|secret|api[_-]?key|token)\s*[:=]\s*)\S+/gi, "$1****")
    .replace(/(\s-p\s*['"]?)[^\s'"]+/g, "$1****")
    .replace(/(sshpass\s+-p\s+)\S+/g, "$1****")
    .replace(/(\/\/[^:\s/]+:)[^@\s/]+@/g, "$1****@")
    .replace(/\b((?:sqlplus|isql|sqlcmd|mysql|psql)\s+(?:-\S+\s+)*\w+\/)[^@\s/]+@/g, "$1****@");
}
