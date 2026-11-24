#!/usr/bin/env node
// Builds one self-contained HTML page per Hub solution (no server, no network: all logic runs in the browser).
// Usage: node scripts/build-solution-pages.mjs [solution …]   (default: the five future-ready solutions)
// Needs `tsc` on PATH (TypeScript 5.7+ for --rewriteRelativeImportExtensions).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOL = join(ROOT, "solutions");
const ALL = ["agent-payment-mandate-checker", "verify-before-you-pay", "ai-use-register", "pqc-crypto-inventory", "legacy-runbook-builder",
  "t1-settlement-predictor", "vop-precheck", "payment-investigation-assistant", "translation-loss-auditor", "sanctions-fp-analyser", "report-sanity-checker",
  "dora-register-precheck", "copybook-decoder", "migration-reconciler", "euc-risk-scanner", "batch-dependency-mapper"];
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

// 1. compile TypeScript → ES modules
const out = mkdtempSync(join(tmpdir(), "hub-web-"));
const srcs = [join(SOL, "shared/table.ts"), ...wanted.flatMap((s) => readdirSync(join(SOL, s, "src")).filter((f) => f.endsWith(".ts")).map((f) => join(SOL, s, "src", f)))];
execFileSync("tsc", ["--target", "ES2022", "--module", "ESNext", "--moduleResolution", "Bundler", "--allowImportingTsExtensions", "--rewriteRelativeImportExtensions", "--skipLibCheck", "--lib", "ES2022,DOM", "--types", "", "--outDir", out, "--rootDir", SOL, ...srcs], { stdio: "inherit" });

// 2. tiny bundler: wrap each module, rewrite imports/exports
function bundle(entry) {
  const order = [];
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const code = readFileSync(file, "utf8");
    for (const m of code.matchAll(/^import\s+\{[^}]*\}\s+from\s+"([^"]+)";?$/gm)) visit(resolve(dirname(file), m[1]));
    order.push(file);
  };
  visit(entry);
  return order.map((file) => {
    const key = relative(out, file);
    let code = readFileSync(file, "utf8");
    const names = [];
    code = code.replace(/^import\s+\{([^}]*)\}\s+from\s+"([^"]+)";?$/gm, (_s, list, from) => {
      const dep = relative(out, resolve(dirname(file), from));
      const parts = list.split(",").map((x) => x.trim()).filter((x) => x && !x.startsWith("type ")).map((x) => x.replace(/\s+as\s+/, ": "));
      return parts.length ? `const { ${parts.join(", ")} } = __m[${JSON.stringify(dep)}];` : "";
    });
    code = code.replace(/^export\s+(async\s+function|function|const|let|var|class)\s+(\w+)/gm, (_s, kw, name) => { names.push(name); return `${kw} ${name}`; });
    code = code.replace(/^export\s*\{\s*\};?$/gm, "");
    return `__m[${JSON.stringify(key)}] = (() => {\n${code}\nreturn { ${names.join(", ")} };\n})();`;
  }).join("\n");
}

const sample = (s, f) => readFileSync(join(SOL, s, "samples", f), "utf8");
const b64 = (s, f) => "base64:" + readFileSync(join(SOL, s, "samples", f)).toString("base64");
const MD = readFileSync(join(ROOT, "scripts/web/markdown.js"), "utf8");
const CSS = readFileSync(join(ROOT, "scripts/web/page.css"), "utf8");
const UI = readFileSync(join(ROOT, "scripts/web/ui.js"), "utf8");

const PAGES = {
  "agent-payment-mandate-checker": {
    title: "Agent Payment Mandate Checker",
    tagline: "When an AI agent pays a bill, prove who allowed it, within what limit, and why.",
    entries: ["agent-payment-mandate-checker/src/report.js"],
    samples: { mandates: sample("agent-payment-mandate-checker", "mandates.json"), payments: sample("agent-payment-mandate-checker", "agent-payments.csv") },
  },
  "verify-before-you-pay": {
    title: "Verify-Before-You-Pay",
    tagline: "A familiar voice or face is no longer proof. Check a payment request before you pay.",
    entries: ["verify-before-you-pay/src/report.js"],
    samples: { log: sample("verify-before-you-pay", "approval-log.csv") },
  },
  "ai-use-register": {
    title: "AI Use Register Generator",
    tagline: "List where you use AI, get an indicative risk tier, the evidence you need, and what's missing.",
    entries: ["ai-use-register/src/report.js"],
    samples: { inventory: sample("ai-use-register", "ai-inventory.csv") },
  },
  "pqc-crypto-inventory": {
    title: "PQC Crypto Inventory",
    tagline: "Find the cryptography in your code and configs, and what quantum computers will break.",
    entries: ["pqc-crypto-inventory/src/report.js"],
    samples: Object.fromEntries(["src/main/java/com/bank/payments/MessageSigner.java", "python/statement_api.py", "node/auth.js", "config/nginx.conf", "config/sshd_config", "scripts/rotate-keys.sh", "certs/legacy-gateway.crt"].map((p) => [p, sample("pqc-crypto-inventory", "demo-repo/" + p)])),
  },
  "legacy-runbook-builder": {
    title: "Legacy Runbook Builder",
    tagline: "Turn handover notes and old scripts into a runbook, and see the knowledge gaps before people leave.",
    entries: ["legacy-runbook-builder/src/report.js"],
    samples: Object.fromEntries(["nostro-recon-handover.txt", "send_swift_batch.sh", "PAYEXTR.jcl", "crontab.txt"].map((f) => [f, sample("legacy-runbook-builder", f)])),
  },
  "t1-settlement-predictor": { title: "T+1 Settlement Fail Predictor", tagline: "Europe moves to T+1 on 11 October 2027. Find the trades that would fail, before they do.", samples: { trades: sample("t1-settlement-predictor", "trades.csv"), ssis: sample("t1-settlement-predictor", "ssis.csv") } },
  "vop-precheck": { title: "VoP Pre-Checker", tagline: "Find the payments your bank will flag as 'close match' or 'no match', before you send the file.", samples: { payments: sample("vop-precheck", "payments.csv"), master: sample("vop-precheck", "supplier-master.csv") } },
  "payment-investigation-assistant": { title: "Payment Investigation Assistant", tagline: "Paste a payment query. Get the case type, references, missing info, next steps and a draft reply.", samples: { mt199: sample("payment-investigation-assistant", "mt199-non-receipt.txt"), fraud: sample("payment-investigation-assistant", "fraud-recall-email.txt") } },
  "translation-loss-auditor": { title: "Translation Data-Loss Auditor", tagline: "Find what got cut or dropped when an ISO 20022 payment was translated to MT103.", samples: { mx: sample("translation-loss-auditor", "pacs008.xml"), mt: sample("translation-loss-auditor", "mt103-translated.txt") } },
  "sanctions-fp-analyser": { title: "Sanctions False-Positive Analyser", tagline: "Most sanctions alerts are false positives. Find out exactly why yours happen.", samples: { alerts: sample("sanctions-fp-analyser", "alerts.csv") } },
  "report-sanity-checker": { title: "\"Valid but Wrong\" Report Checker", tagline: "Your report passed validation. Is it actually right?", samples: { report: sample("report-sanity-checker", "derivatives-report.csv") } },
  "dora-register-precheck": { title: "DORA Register Pre-Check", tagline: "Catch the errors that get your DORA Register of Information rejected, before you submit.", samples: { register: sample("dora-register-precheck", "register.csv") } },
  "copybook-decoder": { title: "Copybook Decoder", tagline: "Turn a mainframe file nobody can read into a spreadsheet, and its copybook into a data dictionary.", samples: { copybook: sample("copybook-decoder", "CUSTREC.cpy"), data: b64("copybook-decoder", "CUSTMAST.dat") } },
  "migration-reconciler": { title: "Migration Reconciler", tagline: "Prove the data in the new system is the data from the old one, with an evidence pack you can sign.", samples: { source: sample("migration-reconciler", "legacy-customers.csv"), target: sample("migration-reconciler", "new-core-customers.csv") } },
  "euc-risk-scanner": { title: "Spreadsheet (EUC) Risk Scanner", tagline: "Find the risky spreadsheets your processes depend on, without opening Excel.", samples: { "fx-revaluation-model.xlsm": b64("euc-risk-scanner", "fx-revaluation-model.xlsm"), "nostro-breaks-list.xlsx": b64("euc-risk-scanner", "nostro-breaks-list.xlsx"), "old-limits-tracker.xls": b64("euc-risk-scanner", "old-limits-tracker.xls") } },
  "batch-dependency-mapper": { title: "Batch Dependency Mapper", tagline: "Which overnight job feeds which, and what breaks if one fails? Draw the batch from its files.", samples: Object.fromEntries(readdirSync(join(SOL, "batch-dependency-mapper/samples/batch")).map((f) => [f, sample("batch-dependency-mapper", "batch/" + f)])) },
};

for (const s of wanted) {
  const p = PAGES[s];
  if (!p) { console.error(`No page definition for ${s}`); continue; }
  const deps = (p.entries ?? []).map((e) => bundle(join(out, e))).join("\n");
  // modules the page script needs, plus the core module(s) of each solution
  const extra = readdirSync(join(out, s, "src")).filter((f) => f.endsWith(".js")).map((f) => bundle(join(out, s, "src", f))).join("\n");
  const seen = new Set();
  const js = (deps + "\n" + extra).split(/\n(?=__m\[)/).filter((chunk) => { const k = chunk.match(/^__m\[("[^"]+")\]/)?.[1]; if (!k || seen.has(k)) return false; seen.add(k); return true; }).join("\n");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title} · Hyniqe Hub</title>
<style>${CSS}</style>
</head>
<body data-solution="${s}">
<header><div class="brand">Hyniqe <span>Hub</span></div><h1>${p.title}</h1><p class="tagline">${p.tagline}</p><p class="local">🔒 Runs entirely in your browser. Nothing you load here is uploaded.</p></header>
<main id="app"></main>
<footer>Hyniqe Hub · open-source tools for financial operations. Outputs support your judgement; they are not legal, audit or security advice.</footer>
<script>
const __m = {};
${js}
const SAMPLES = ${JSON.stringify(p.samples)};
${MD}
${UI}
</script>
</body>
</html>
`;
  const dir = join(SOL, s, "web");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  console.log(`Built ${relative(ROOT, join(dir, "index.html"))} (${Math.round(html.length / 1024)} KB)`);
}
