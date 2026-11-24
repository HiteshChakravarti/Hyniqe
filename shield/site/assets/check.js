// In-browser checker. Uses the same engine and rules as the command-line tool.
(function () {
  var D = window.SHIELD_DATA, S = HyniqeShield.createScanner(D.rules), ORDER = HyniqeShield.SEVERITY_ORDER;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); };
  var V = {DANGEROUS: ["Dangerous", "danger", "Do not install this without understanding every finding."],
           CAUTION: ["Caution", "caution", "Review the findings before installing."],
           NO_KNOWN_RISKS: ["No known risks", "clear", "None of the rules matched enough to raise a concern."]};
  var loaded = [];

  $("examples").innerHTML = D.examples.map(function (x, i) {
    return '<button type="button" aria-pressed="false" data-i="' + i + '">' + esc(x.label) + "</button>"; }).join("");
  $("examples").addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    var x = D.examples[+b.dataset.i]; loaded = [];
    $("fname").value = x.name; $("src").value = x.text;
    Array.prototype.forEach.call($("examples").children, function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
    run();
  });

  function run() {
    var files;
    if (loaded.length) files = loaded.map(function (f) { return S.scanText(f.text, f.name); });
    else {
      if (!$("src").value.trim()) { $("result").innerHTML = '<p class="muted">Paste something, drop files, or pick an example to see a result.</p>'; $("findings").innerHTML = ""; return; }
      files = [S.scanText($("src").value, $("fname").value.trim() || "input.txt")];
    }
    var target = loaded.length ? loaded.length + " files" : ($("fname").value.trim() || "pasted text");
    var r = S.summarise(target, files), v = V[r.verdict];
    var real = r.findings.filter(function (f) { return f.severity !== "info"; }).length;
    $("result").innerHTML = '<div class="tag-hang" style="padding-top:0"><div class="tag plain v-' + v[1] + '">' +
      '<div class="verdict-band"><div class="issuer">Hyniqe Shield check</div><p class="verdict">' + v[0] + '</p></div>' +
      '<dl><dt>Checked</dt><dd>' + esc(target) + '</dd><dt>Files</dt><dd>' + r.files_scanned + '</dd><dt>Findings</dt><dd>' + (real || "None") +
      '</dd><dt>Risk score</dt><dd>' + r.score + ' out of 100</dd></dl><div class="perf">' + v[2] + '</div></div></div>';
    if (!r.findings.length) { $("findings").innerHTML = '<p class="muted">No findings. Still, only install add-ons from people you trust.</p>'; return; }
    var groups = {};
    r.findings.forEach(function (f) { (groups[f.rule_id] = groups[f.rule_id] || []).push(f); });
    var list = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) {
      return ORDER.indexOf(b[0].severity) - ORDER.indexOf(a[0].severity); });
    $("findings").innerHTML = "<h2>" + r.findings.length + (r.findings.length === 1 ? " finding" : " findings") + "</h2>" + list.map(function (g) {
      var f = g[0];
      return '<section class="finding"><div class="finding-head"><h3>' + esc(f.title) + '</h3><span class="sev sev-' + f.severity + '">' +
        esc(f.severity[0].toUpperCase() + f.severity.slice(1)) + '</span><a class="rid" href="/rules/#' + f.rule_id + '">' + f.rule_id + "</a></div>" +
        "<p>" + esc(f.explain) + '</p><p class="fix"><b>What to do:</b> ' + esc(f.fix) + '</p><ul class="locs">' + g.map(function (x) {
          return "<li>" + esc(x.file) + ", line " + x.line + (x.evidence ? '<code class="ev">' + esc(x.evidence) + "</code>" : "") +
            (x.detail ? '<span class="muted small">' + esc(x.detail) + "</span>" : "") + "</li>"; }).join("") + "</ul></section>";
    }).join("");
  }

  async function take(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i], path = f.webkitRelativePath || f.name;
      if (f.size > 2000000 || /(^|\/)(node_modules|\.git)\//.test(path)) continue;
      if (!/\.(md|markdown|txt|json|jsonc|ya?ml|toml|py|js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|ps1|rb|go|rs|java|kt|php|env|html|xml|ini|cfg)$/i.test(path)) continue;
      var text = await f.text();
      if (text.slice(0, 4096).indexOf("\u0000") !== -1) continue;
      out.push({name: path, text: text});
    }
    if (!out.length) { $("result").innerHTML = '<p class="muted">No readable text files found. Shield reads code, Markdown, JSON and YAML files.</p>'; return; }
    Array.prototype.forEach.call($("examples").children, function (c) { c.setAttribute("aria-pressed", "false"); });
    if (out.length === 1) { loaded = []; $("fname").value = out[0].name.split("/").pop(); $("src").value = out[0].text; }
    else { loaded = out; $("src").value = ""; $("fname").value = ""; }
    run();
  }
  $("files").addEventListener("change", function (e) { take(e.target.files); });
  var drop = $("drop");
  drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", function () { drop.classList.remove("over"); });
  drop.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove("over"); take(e.dataTransfer.files); });
  $("run").addEventListener("click", run);
  $("fname").addEventListener("change", run);
  var t; $("src").addEventListener("input", function () { loaded = []; clearTimeout(t); t = setTimeout(run, 350); });
  D.examples.length ? $("examples").children[0].click() : run();
})();
