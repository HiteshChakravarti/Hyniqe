// Page UI for each Hub solution. Expects: __m (bundled modules), SAMPLES, renderMarkdown.
(function () {
  const $ = (sel, el = document) => el.querySelector(sel);
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const app = $("#app");
  const table = __m["shared/table.js"];
  const solution = document.body.dataset.solution;

  function download(name, text, type = "text/plain") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function readFiles(input) {
    return Promise.all([...input.files].map(async (f) => ({ name: f.webkitRelativePath || f.name, text: await f.text() })));
  }
  function fileInto(input, textarea) {
    input.addEventListener("change", async () => { const [f] = await readFiles(input); if (f) textarea.value = f.text; });
  }
  const resultCard = h(`<section class="card"><div id="downloads" class="actions" style="margin:0 0 8px"></div><div id="report" class="empty">Your report will appear here.</div></section>`);
  function show(md, downloads = []) {
    const r = $("#report", resultCard);
    r.className = "";
    r.innerHTML = renderMarkdown(md);
    const d = $("#downloads", resultCard);
    d.innerHTML = "";
    for (const [label, name, text, type] of [["Download report (.md)", "report.md", md, "text/markdown"], ...downloads]) {
      const b = h(`<button>${label}</button>`);
      b.onclick = () => download(name, text, type);
      d.append(b);
    }
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function showError(e) {
    const r = $("#report", resultCard);
    r.className = "error";
    r.textContent = e && e.message ? e.message : String(e);
  }
  const safe = (fn) => () => { try { fn(); } catch (e) { console.error(e); showError(e); } };

  // ------------------------------------------------------------------ Agent Payment Mandate Checker
  if (solution === "agent-payment-mandate-checker") {
    const c = __m["agent-payment-mandate-checker/src/checker.js"], rep = __m["agent-payment-mandate-checker/src/report.js"];
    const card = h(`<section class="card"><h2>1 · Mandates <span class="hint">(JSON: what each agent may pay, to whom, up to what limit)</span></h2>
      <input type="file" id="mf" accept=".json"><textarea id="m" placeholder='{"mandates":[{"id":"M-1","agent_id":"ap-agent","per_payment_limit":5000}]}'></textarea>
      <h2 style="margin-top:16px">2 · Agent payment log <span class="hint">(CSV: payment_id, timestamp, agent_id, mandate_id, payee, amount, currency, category, approved_by, approval_time, purpose, status)</span></h2>
      <input type="file" id="pf" accept=".csv,.txt"><textarea id="p"></textarea>
      <div class="actions"><button class="primary" id="run">Check payments</button><button id="sample">Load sample data</button></div></section>`);
    app.append(card, resultCard);
    fileInto($("#mf", card), $("#m", card)); fileInto($("#pf", card), $("#p", card));
    $("#sample", card).onclick = () => { $("#m", card).value = SAMPLES.mandates; $("#p", card).value = SAMPLES.payments; };
    $("#run", card).onclick = safe(() => {
      let raw;
      try { raw = JSON.parse($("#m", card).value); } catch (e) { throw new Error("Mandates must be valid JSON: " + e.message); }
      const { file, errors } = c.validateMandateFile(raw);
      if (!file || errors.length) throw new Error(errors.join("\n"));
      const res = c.checkPayments(file, c.readPayments(table.parseCsv($("#p", card).value)));
      show(rep.toMarkdown(res), [["Download results (.csv)", "mandate-check.csv", rep.toResultCsv(res), "text/csv"]]);
    });
  }

  // ------------------------------------------------------------------ Verify-Before-You-Pay
  if (solution === "verify-before-you-pay") {
    const a = __m["verify-before-you-pay/src/assess.js"], rep = __m["verify-before-you-pay/src/report.js"];
    const card = h(`<section class="card"><div class="tabs"><button aria-selected="true" data-t="one">Check one request</button><button aria-selected="false" data-t="log">Audit an approval log</button></div>
      <label>Your company's and key suppliers' email domains <span class="hint">(comma-separated, so look-alikes can be spotted)</span></label><input type="text" id="dom" placeholder="yourbank.com, mainsupplier.com">
      <div data-p="one"><label>Paste the message, email or call notes</label><textarea id="txt" placeholder="Paste the payment request here…"></textarea>
        <div class="row"><div><label>Who is asking?</label><input type="text" id="from" placeholder="e.g. Jane Smith"></div><div><label>Their title</label><input type="text" id="title" placeholder="e.g. CFO, Supplier"></div>
        <div><label>How did it arrive?</label><select id="ch"><option value="">(not sure)</option><option>email</option><option>phone</option><option>voice note</option><option>video</option><option>teams</option><option>whatsapp</option><option>sms</option><option>in person</option></select></div></div>
        <div class="row"><div><label>Amount</label><input type="text" id="amt" placeholder="e.g. 48500"></div><div><label>Currency</label><input type="text" id="ccy" placeholder="USD"></div>
        <div><label>New payee?</label><select id="np"><option value="">(not sure)</option><option value="yes">Yes</option><option value="no">No</option></select></div><div><label>Bank details changed?</label><select id="bc"><option value="">(not sure)</option><option value="yes">Yes</option><option value="no">No</option></select></div></div>
        <div class="actions"><button class="primary" id="go1">Check this request</button><button id="ex">Try an example</button></div></div>
      <div data-p="log" hidden><label>Approval log CSV <span class="hint">(request_id, received_at, requested_by, requester_title, channel, sender, amount, currency, payee, payee_new, bank_details_changed, bank_change_at, message, callback_done, callback_source, challenge_passed, approver_1, approver_2, released_by, paid_at)</span></label>
        <input type="file" id="lf" accept=".csv,.txt"><textarea id="log"></textarea><div class="actions"><button class="primary" id="go2">Audit log</button><button id="sl">Load sample log</button></div></div></section>`);
    app.append(card, resultCard);
    card.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => {
      card.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
      card.querySelectorAll("[data-p]").forEach((p) => (p.hidden = p.dataset.p !== b.dataset.t));
    });
    fileInto($("#lf", card), $("#log", card));
    const policy = () => ({ ...a.DEFAULT_POLICY, company_domains: $("#dom", card).value.split(",").map((s) => s.trim()).filter(Boolean) });
    $("#ex", card).onclick = () => {
      $("#txt", card).value = "From: d.chen@northwind-group.co\nHi, are you at your desk? I need a favour. Please wire $48,500 today to our new legal counsel for a confidential acquisition. Don't discuss this with anyone yet. I'm in a board meeting so can't talk, just email me when it's done.";
      $("#dom", card).value = "northwind.com"; $("#from", card).value = "David Chen"; $("#title", card).value = "CEO"; $("#ch", card).value = "email"; $("#np", card).value = "yes";
    };
    $("#sl", card).onclick = () => { $("#log", card).value = SAMPLES.log; if (!$("#dom", card).value) $("#dom", card).value = "northwind-demo.com, globex-logistics.com"; };
    $("#go1", card).onclick = safe(() => {
      const text = $("#txt", card).value;
      if (!text.trim()) throw new Error("Paste the request text first.");
      const yn = (v) => (v === "yes" ? true : v === "no" ? false : null);
      const extra = { requested_by: $("#from", card).value, requester_title: $("#title", card).value, payee_new: yn($("#np", card).value) };
      if ($("#ch", card).value) extra.channel = $("#ch", card).value;
      if ($("#amt", card).value) extra.amount = table.parseAmount($("#amt", card).value);
      if ($("#ccy", card).value) extra.currency = $("#ccy", card).value.toUpperCase();
      if (yn($("#bc", card).value) !== null) extra.bank_details_changed = yn($("#bc", card).value);
      const req = a.requestFromText(text, extra);
      show("# Verify-Before-You-Pay\n\n" + rep.oneToMarkdown(a.assess(req, policy())));
    });
    $("#go2", card).onclick = safe(() => {
      const list = a.readRequests(table.parseCsv($("#log", card).value)).map((r) => a.assess(r, policy()));
      if (!list.length) throw new Error("No rows found in the log.");
      show(rep.toMarkdown(list), [["Download results (.csv)", "verify-report.csv", rep.toResultCsv(list), "text/csv"]]);
    });
  }

  // ------------------------------------------------------------------ AI Use Register
  if (solution === "ai-use-register") {
    const c = __m["ai-use-register/src/classify.js"], rep = __m["ai-use-register/src/report.js"];
    const card = h(`<section class="card"><h2>Your AI inventory <span class="hint">(CSV. Only name and description are required; every other column sharpens the register.)</span></h2>
      <input type="file" id="f" accept=".csv,.txt"><textarea id="t"></textarea>
      <div class="actions"><button class="primary" id="go">Build register</button><button id="tpl">Download blank template</button><button id="s">Load sample inventory</button></div></section>`);
    app.append(card, resultCard);
    fileInto($("#f", card), $("#t", card));
    $("#tpl", card).onclick = () => download("ai-inventory-template.csv", rep.templateCsv(), "text/csv");
    $("#s", card).onclick = () => ($("#t", card).value = SAMPLES.inventory);
    $("#go", card).onclick = safe(() => {
      const rows = table.parseCsv($("#t", card).value).filter((r) => !/^your reference/i.test(Object.values(r)[0] || ""));
      if (!rows.length) throw new Error("No rows found. Load a CSV or the sample.");
      const list = c.readUseCases(rows).map((u) => c.classify(u));
      show(rep.toMarkdown(list), [["Download register (.csv)", "ai-register.csv", rep.toRegisterCsv(list), "text/csv"]]);
    });
  }

  // ------------------------------------------------------------------ PQC Crypto Inventory
  if (solution === "pqc-crypto-inventory") {
    const sc = __m["pqc-crypto-inventory/src/scan.js"], rep = __m["pqc-crypto-inventory/src/report.js"];
    const card = h(`<section class="card"><h2>Choose a code folder or files <span class="hint">(source, configs, scripts, certificates; read locally, never uploaded)</span></h2>
      <div class="row"><div><label>Folder</label><input type="file" id="dir" webkitdirectory multiple></div><div><label>Or individual files</label><input type="file" id="files" multiple></div></div>
      <label>Or paste code / config</label><textarea id="t" placeholder='KeyPairGenerator.getInstance("RSA") …'></textarea>
      <div class="actions"><button class="primary" id="go">Scan</button><button id="s">Scan the demo repo</button></div><p class="hint" id="status"></p></section>`);
    app.append(card, resultCard);
    const SKIP = /(^|\/)(node_modules|\.git|dist|build|target|vendor|\.venv|venv|__pycache__)\//;
    async function run(inputs) {
      const findings = [];
      let n = 0;
      for (const f of inputs) {
        if (SKIP.test(f.name) || (!sc.isScannable(f.name) && f.name !== "pasted.txt") || f.text.length > 2000000 || f.text.includes("\u0000")) continue;
        n++;
        findings.push(...sc.scanText(f.name, f.text));
      }
      const s = sc.summarise(findings, n);
      $("#status", card).textContent = `Scanned ${n} file(s).`;
      show(rep.toMarkdown(findings, s), [["Download findings (.csv)", "pqc-inventory.csv", rep.toResultCsv(findings), "text/csv"], ["Download CBOM (.json)", "cbom.json", JSON.stringify(sc.toCbom(findings), null, 2), "application/json"]]);
    }
    $("#go", card).onclick = async () => {
      try {
        const inputs = [...(await readFiles($("#dir", card))), ...(await readFiles($("#files", card)))];
        if ($("#t", card).value.trim()) inputs.push({ name: "pasted.txt", text: $("#t", card).value });
        if (!inputs.length) throw new Error("Choose a folder, some files, or paste code first.");
        $("#status", card).textContent = `Reading ${inputs.length} file(s)…`;
        await run(inputs);
      } catch (e) { showError(e); }
    };
    $("#s", card).onclick = () => run(Object.entries(SAMPLES).map(([name, text]) => ({ name, text }))).catch(showError);
  }

  // ------------------------------------------------------------------ Legacy Runbook Builder
  if (solution === "legacy-runbook-builder") {
    const x = __m["legacy-runbook-builder/src/extract.js"], rep = __m["legacy-runbook-builder/src/report.js"];
    const card = h(`<section class="card"><h2>Old procedures, handover notes and scripts <span class="hint">(text, shell/batch scripts, JCL, crontabs, SQL)</span></h2>
      <input type="file" id="files" multiple><label>Or paste text</label><textarea id="t" placeholder="Paste a handover email, procedure or script…"></textarea>
      <label>Runbook title <span class="hint">(optional)</span></label><input type="text" id="title" placeholder="e.g. USD nostro reconciliation">
      <div class="actions"><button class="primary" id="go">Build runbook</button><button id="s">Load sample handover</button></div></section>`);
    app.append(card, resultCard);
    let sampleLoaded = false;
    $("#s", card).onclick = () => { sampleLoaded = true; $("#t", card).value = "(sample: nostro recon handover email + SWIFT batch script + JCL + crontab will be used)"; $("#title", card).value = "Payments ops: SWIFT batch, GL extract & USD nostro recon"; };
    $("#go", card).onclick = async () => {
      try {
        let inputs = await readFiles($("#files", card));
        const pasted = $("#t", card).value;
        if (sampleLoaded && pasted.startsWith("(sample")) inputs = inputs.concat(Object.entries(SAMPLES).map(([name, text]) => ({ name, text })));
        else if (pasted.trim()) inputs.push({ name: "pasted.txt", text: pasted });
        if (!inputs.length) throw new Error("Choose files or paste text first.");
        const rb = x.buildRunbook(inputs, $("#title", card).value || undefined);
        const prompt = rep.aiPrompt(rb, inputs);
        show(rep.toMarkdown(rb), [["Download knowledge gaps (.csv)", "knowledge-gaps.csv", rep.gapsCsv(rb), "text/csv"], ["Download AI prompt (.txt)", "ai-prompt.txt", prompt, "text/plain"]]);
      } catch (e) { showError(e); }
    };
  }

  // ------------------------------------------------------------------ helpers for the second batch
  const fromB64 = (s) => Uint8Array.from(atob(s.replace(/^base64:/, "")), (c) => c.charCodeAt(0));
  async function readBytes(input) { return Promise.all([...input.files].map(async (f) => ({ name: f.webkitRelativePath || f.name, bytes: new Uint8Array(await f.arrayBuffer()) }))); }
  function simpleCard(html) { const c = h(`<section class="card">${html}</section>`); app.append(c, resultCard); return c; }
  const csvBox = (id, label, hint) => `<label>${label} <span class="hint">${hint || ""}</span></label><input type="file" id="${id}f" accept=".csv,.txt"><textarea id="${id}"></textarea>`;
  const wire = (card, ids) => ids.forEach((id) => fileInto($(`#${id}f`, card), $(`#${id}`, card)));

  if (solution === "t1-settlement-predictor") {
    const m = __m["t1-settlement-predictor/src/predict.js"], rep = __m["t1-settlement-predictor/src/report.js"];
    const card = simpleCard(`<h2>Trades and SSIs</h2>${csvBox("tr", "Trade blotter (CSV)", "trade_id, trade_date, trade_time, settlement_date, isin, counterparty, place_of_settlement, currency, account_currency, allocation_time, affirmation_time, instruction_time")}${csvBox("ss", "Standing settlement instructions (CSV)", "counterparty, place_of_settlement, currency, agent_bic, account, valid_from, valid_to, last_verified")}
      <div class="row"><div><label><input type="checkbox" id="t1"> Treat all trades as T+1 (test today's blotter)</label></div><div><label>Holidays <span class="hint">(YYYY-MM-DD, comma-separated)</span></label><input type="text" id="hol"></div></div>
      <div class="actions"><button class="primary" id="go">Check trades</button><button id="s">Load sample</button></div>`);
    wire(card, ["tr", "ss"]);
    $("#s", card).onclick = () => { $("#tr", card).value = SAMPLES.trades; $("#ss", card).value = SAMPLES.ssis; };
    $("#go", card).onclick = safe(() => {
      const cfg = { ...m.DEFAULT_CONFIG, assume_t1: $("#t1", card).checked, holidays: $("#hol", card).value.split(",").map((x) => x.trim()).filter(Boolean) };
      const list = m.assessTrades(m.readTrades(table.parseCsv($("#tr", card).value)), m.readSsis(table.parseCsv($("#ss", card).value)), cfg);
      if (!list.length) throw new Error("No trades found.");
      show(rep.toMarkdown(list), [["Download results (.csv)", "t1-report.csv", rep.toResultCsv(list), "text/csv"]]);
    });
  }

  if (solution === "vop-precheck") {
    const m = __m["vop-precheck/src/precheck.js"], rep = __m["vop-precheck/src/report.js"];
    const card = simpleCard(`<h2>Payment file and supplier master</h2>${csvBox("pa", "Payment file (CSV)", "payee_name, iban, amount")}${csvBox("ma", "Supplier master (CSV, optional but recommended)", "iban, account_holder_name, trading_names")}
      <div class="actions"><button class="primary" id="go">Check payments</button><button id="s">Load sample</button></div>`);
    wire(card, ["pa", "ma"]);
    $("#s", card).onclick = () => { $("#pa", card).value = SAMPLES.payments; $("#ma", card).value = SAMPLES.master; };
    $("#go", card).onclick = safe(() => {
      const list = m.precheck(m.readPayments(table.parseCsv($("#pa", card).value)), $("#ma", card).value.trim() ? m.readMaster(table.parseCsv($("#ma", card).value)) : []);
      if (!list.length) throw new Error("No payments found.");
      show(rep.toMarkdown(list), [["Download results (.csv)", "vop-precheck.csv", rep.toResultCsv(list), "text/csv"]]);
    });
  }

  if (solution === "payment-investigation-assistant") {
    const m = __m["payment-investigation-assistant/src/investigate.js"], rep = __m["payment-investigation-assistant/src/report.js"];
    const card = simpleCard(`<h2>Payment query</h2><label>Paste an MT199/n99, an email or call notes</label><textarea id="t" style="min-height:200px"></textarea>
      <div class="actions"><button class="primary" id="go">Analyse</button><button id="s1">Sample: MT199 non-receipt</button><button id="s2">Sample: fraud recall email</button></div>`);
    $("#s1", card).onclick = () => ($("#t", card).value = SAMPLES.mt199);
    $("#s2", card).onclick = () => ($("#t", card).value = SAMPLES.fraud);
    $("#go", card).onclick = safe(() => { const t = $("#t", card).value; if (!t.trim()) throw new Error("Paste a query first."); show(rep.toMarkdown(m.analyse(t))); });
  }

  if (solution === "translation-loss-auditor") {
    const m = __m["translation-loss-auditor/src/audit.js"], rep = __m["translation-loss-auditor/src/report.js"];
    const card = simpleCard(`<h2>The two versions of one payment</h2><div class="row"><div><label>ISO 20022 pacs.008 (XML)</label><input type="file" id="mxf" accept=".xml,.txt"><textarea id="mx" style="min-height:220px"></textarea></div>
      <div><label>MT103 (FIN text)</label><input type="file" id="mtf" accept=".txt,.fin,.mt"><textarea id="mt" style="min-height:220px"></textarea></div></div>
      <div class="actions"><button class="primary" id="go">Compare</button><button id="s">Load sample</button></div>`);
    wire(card, ["mx", "mt"]);
    $("#s", card).onclick = () => { $("#mx", card).value = SAMPLES.mx; $("#mt", card).value = SAMPLES.mt; };
    $("#go", card).onclick = safe(() => {
      const mx = m.parsePacs008($("#mx", card).value), mt = m.parseMt103($("#mt", card).value);
      const pairs = [{ name: "payment", uetr: mx.uetr, findings: m.audit(mx, mt) }];
      show(rep.toMarkdown(pairs), [["Download findings (.csv)", "translation-audit.csv", rep.toResultCsv(pairs), "text/csv"]]);
    });
  }

  if (solution === "sanctions-fp-analyser") {
    const m = __m["sanctions-fp-analyser/src/analyse.js"], rep = __m["sanctions-fp-analyser/src/report.js"];
    const card = simpleCard(`<h2>Closed alerts export</h2>${csvBox("al", "Alerts (CSV)", "alert_id, created_at, screened_name, matched_name, list, match_score, matched_field, message_type, disposition, handling_minutes, customer_id")}
      <div class="row"><div><label>Cleared at least … times to count as a repeat pair</label><input type="text" id="mc" value="3"></div><div><label>Minutes per alert when not recorded</label><input type="text" id="mn" value="30"></div></div>
      <div class="actions"><button class="primary" id="go">Analyse</button><button id="s">Load sample (invented names)</button></div>`);
    wire(card, ["al"]);
    $("#s", card).onclick = () => ($("#al", card).value = SAMPLES.alerts);
    $("#go", card).onclick = safe(() => {
      const a = m.analyse(m.readAlerts(table.parseCsv($("#al", card).value)), { minClears: Number($("#mc", card).value) || 3, defaultMinutes: Number($("#mn", card).value) || 30 });
      if (!a.total) throw new Error("No alerts found.");
      show(rep.toMarkdown(a), [["Download good-guy candidates (.csv)", "good-guy-candidates.csv", rep.goodGuysCsv(a), "text/csv"]]);
    });
  }

  if (solution === "report-sanity-checker") {
    const m = __m["report-sanity-checker/src/check.js"], rep = __m["report-sanity-checker/src/report.js"];
    const card = simpleCard(`<h2>Report extract</h2>${csvBox("rp", "Report (CSV)", "columns are recognised by name: uti, *_lei, isin, notional, currency, *_date, country…")}
      <div class="row"><div><label>Required columns <span class="hint">(comma-separated, optional)</span></label><input type="text" id="req"></div><div><label>Report date <span class="hint">(optional)</span></label><input type="text" id="rd" placeholder="YYYY-MM-DD"></div></div>
      <div class="actions"><button class="primary" id="go">Check report</button><button id="s">Load sample</button></div>`);
    wire(card, ["rp"]);
    $("#s", card).onclick = () => ($("#rp", card).value = SAMPLES.report);
    $("#go", card).onclick = safe(() => {
      const res = m.checkReport(table.parseCsv($("#rp", card).value), { required: $("#req", card).value.split(",").map((x) => x.trim()).filter(Boolean), reportDate: $("#rd", card).value || undefined });
      if (!res.rows) throw new Error("No rows found.");
      show(rep.toMarkdown(res), [["Download issues (.csv)", "report-issues.csv", rep.toIssuesCsv(res.issues), "text/csv"]]);
    });
  }

  if (solution === "dora-register-precheck") {
    const m = __m["dora-register-precheck/src/precheck.js"], rep = __m["dora-register-precheck/src/report.js"];
    const card = simpleCard(`<h2>Working register</h2>${csvBox("rg", "Register (CSV, one row per contractual arrangement)", "")}
      <label>Reference date <span class="hint">(end of the reporting year)</span></label><input type="text" id="rd" placeholder="e.g. 2026-12-31">
      <div class="actions"><button class="primary" id="go">Check register</button><button id="s">Load sample</button></div>`);
    wire(card, ["rg"]);
    $("#s", card).onclick = () => { $("#rg", card).value = SAMPLES.register; $("#rd", card).value = "2026-12-31"; };
    $("#go", card).onclick = safe(() => {
      const list = m.readRegister(table.parseCsv($("#rg", card).value));
      if (!list.length) throw new Error("No arrangements found.");
      const issues = m.precheck(list, { referenceDate: $("#rd", card).value || undefined });
      show(rep.toMarkdown(list, issues), [["Download fix list (.csv)", "dora-issues.csv", rep.toIssuesCsv(issues), "text/csv"]]);
    });
  }

  if (solution === "copybook-decoder") {
    const m = __m["copybook-decoder/src/copybook.js"], rep = __m["copybook-decoder/src/report.js"];
    const card = simpleCard(`<h2>Copybook and data file</h2><label>COBOL copybook</label><input type="file" id="cbf" accept=".cpy,.cbl,.cob,.txt"><textarea id="cb" style="min-height:200px"></textarea>
      <label>Data file <span class="hint">(optional: fixed-length records; read locally)</span></label><input type="file" id="df">
      <div class="row"><div><label>Encoding</label><select id="enc"><option value="ebcdic">EBCDIC (mainframe)</option><option value="ascii">ASCII</option></select></div><div><label>Record format</label><select id="fmt"><option value="fixed">Fixed length</option><option value="rdw">Variable (RDW)</option><option value="lines">One record per line</option></select></div></div>
      <div class="actions"><button class="primary" id="go">Decode</button><button id="s">Load sample</button></div><p class="hint" id="st"></p>`);
    fileInto($("#cbf", card), $("#cb", card));
    let sampleData = null;
    $("#s", card).onclick = () => { $("#cb", card).value = SAMPLES.copybook; sampleData = fromB64(SAMPLES.data); $("#st", card).textContent = `Sample data loaded (${sampleData.length} bytes, EBCDIC).`; };
    $("#go", card).onclick = async () => {
      try {
        const { root, warnings } = m.parseCopybook($("#cb", card).value);
        const l = m.layout(root);
        let md = rep.dictionaryMarkdown(l.fields, l.recordLength, [...warnings, ...l.warnings]);
        const dl = [["Download data dictionary (.csv)", "data-dictionary.csv", rep.dictionaryCsv(l.fields), "text/csv"]];
        const [f] = await readBytes($("#df", card));
        const bytes = f ? f.bytes : sampleData;
        if (bytes) {
          const fmt = $("#fmt", card).value;
          const d = m.decodeData(l.fields, bytes, { encoding: $("#enc", card).value, recordLength: l.recordLength, rdw: fmt === "rdw", lineSeparated: fmt === "lines" });
          md += "\n" + rep.decodeSummary(d);
          dl.push(["Download decoded data (.csv)", "decoded.csv", rep.dataCsv(d), "text/csv"]);
        }
        show(md, dl);
      } catch (e) { showError(e); }
    };
  }

  if (solution === "migration-reconciler") {
    const m = __m["migration-reconciler/src/reconcile.js"], rep = __m["migration-reconciler/src/report.js"];
    const card = simpleCard(`<h2>Source and target extracts</h2><div class="row"><div>${csvBox("src", "Source (legacy) CSV", "")}</div><div>${csvBox("tgt", "Target (new system) CSV", "")}</div></div>
      <div class="row"><div><label>Key column(s) in source</label><input type="text" id="key" placeholder="customer_id"></div><div><label>Column mapping <span class="hint">source:target, comma-separated</span></label><input type="text" id="map"></div></div>
      <div class="row"><div><label>Numeric tolerance</label><input type="text" id="tol" value="0"></div><div><label>Ignore columns</label><input type="text" id="ign"></div></div>
      <label><input type="checkbox" id="lz" checked> Ignore leading zeros in keys</label> <label><input type="checkbox" id="ic" checked> Ignore case in keys</label>
      <div class="actions"><button class="primary" id="go">Reconcile</button><button id="s">Load sample</button></div>`);
    wire(card, ["src", "tgt"]);
    $("#s", card).onclick = () => { $("#src", card).value = SAMPLES.source; $("#tgt", card).value = SAMPLES.target; $("#key", card).value = "customer_id"; $("#map", card).value = "customer_id:cust_no,full_name:customer_name,address_line:address,postcode:post_code,date_of_birth:dob,balance:balance_amt,marketing_consent:consent_marketing"; };
    $("#go", card).onclick = safe(() => {
      const map = Object.fromEntries($("#map", card).value.split(",").filter(Boolean).map((p) => p.split(":").map((x) => x.trim())));
      const r = m.reconcile(table.parseCsv($("#src", card).value), table.parseCsv($("#tgt", card).value), { key: $("#key", card).value.split(",").map((x) => x.trim()).filter(Boolean), map, tolerance: Number($("#tol", card).value) || 0, ignoreLeadingZeros: $("#lz", card).checked, ignoreCase: $("#ic", card).checked, ignoreFields: $("#ign", card).value.split(",").map((x) => x.trim()).filter(Boolean) });
      show(rep.toMarkdown(r), [["Download differences (.csv)", "differences.csv", rep.diffsCsv(r), "text/csv"]]);
    });
  }

  if (solution === "euc-risk-scanner") {
    const m = __m["euc-risk-scanner/src/scan.js"], rep = __m["euc-risk-scanner/src/report.js"], zip = __m["shared/zip.js"];
    const card = simpleCard(`<h2>Spreadsheets to scan</h2><div class="row"><div><label>Folder</label><input type="file" id="dir" webkitdirectory multiple></div><div><label>Or files</label><input type="file" id="files" multiple accept=".xlsx,.xlsm,.xls,.xltx,.xltm"></div></div>
      <div class="actions"><button class="primary" id="go">Scan</button><button id="s">Scan samples</button></div><p class="hint" id="st"></p>`);
    async function run(items) {
      const reports = [];
      for (const it of items.filter((x) => /\.(xlsx|xlsm|xls|xltx|xltm)$/i.test(x.name) && !/(^|\/)~\$/.test(x.name))) {
        try { reports.push(await m.scanWorkbook(it.name, it.bytes, zip.browserInflate)); } catch (e) { console.warn(it.name, e); }
      }
      if (!reports.length) throw new Error("No Excel workbooks found.");
      $("#st", card).textContent = `Scanned ${reports.length} workbook(s).`;
      show(rep.toMarkdown(reports), [["Download EUC register (.csv)", "euc-register.csv", rep.registerCsv(reports), "text/csv"]]);
    }
    $("#go", card).onclick = async () => { try { await run([...(await readBytes($("#dir", card))), ...(await readBytes($("#files", card)))]); } catch (e) { showError(e); } };
    $("#s", card).onclick = () => run(Object.entries(SAMPLES).map(([name, v]) => ({ name, bytes: fromB64(v) }))).catch(showError);
  }

  if (solution === "batch-dependency-mapper") {
    const m = __m["batch-dependency-mapper/src/map.js"], rep = __m["batch-dependency-mapper/src/report.js"];
    const card = simpleCard(`<h2>Batch files</h2><p class="hint">JCL, Control-M XML exports, crontabs and shell scripts.</p><div class="row"><div><label>Folder</label><input type="file" id="dir" webkitdirectory multiple></div><div><label>Or files</label><input type="file" id="files" multiple></div></div>
      <div class="actions"><button class="primary" id="go">Map</button><button id="s">Load sample</button></div>`);
    const diagram = h(`<section class="card" hidden><h2>Diagram</h2><div id="svg" style="overflow:auto"></div></section>`);
    app.insertBefore(diagram, resultCard);
    function run(files) {
      const { jobs, skipped } = m.parseAll(files);
      if (!jobs.length) throw new Error("No jobs found in these files.");
      const g = m.buildGraph(jobs);
      const svgText = rep.svg(g);
      diagram.hidden = false;
      $("#svg", diagram).innerHTML = svgText;
      show(rep.toMarkdown(g, skipped).replace(/```mermaid[\s\S]*?```\n/, ""), [["Download diagram (.svg)", "batch-map.svg", svgText, "image/svg+xml"], ["Download dependencies (.csv)", "dependencies.csv", rep.edgesCsv(g), "text/csv"], ["Download Mermaid (.mmd)", "batch-map.mmd", rep.mermaid(g), "text/plain"]]);
    }
    $("#go", card).onclick = async () => { try { run([...(await readFiles($("#dir", card))), ...(await readFiles($("#files", card)))]); } catch (e) { showError(e); } };
    $("#s", card).onclick = safe(() => run(Object.entries(SAMPLES).map(([name, text]) => ({ name, text }))));
  }
})();
