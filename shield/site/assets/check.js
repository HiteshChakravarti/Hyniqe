// In-browser checker. Uses the same engine and rules as the command-line tool.
// Checks pasted text, dropped files, or a public GitHub link (fetched straight from GitHub by the visitor's browser).
(function () {
  var D = window.SHIELD_DATA, S = HyniqeShield.createScanner(D.rules), ORDER = HyniqeShield.SEVERITY_ORDER;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); };
  var V = {DANGEROUS: ["Dangerous", "danger", "Do not install this without understanding every finding."],
           CAUTION: ["Caution", "caution", "Review the findings before installing."],
           NO_KNOWN_RISKS: ["No known risks", "clear", "None of the rules matched enough to raise a concern."]};
  var TEXT_EXT = /\.(md|markdown|txt|json|jsonc|ya?ml|toml|py|js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|ps1|rb|go|rs|java|kt|php|env|html|xml|ini|cfg)$/i;
  var MAX_FILES = 300;
  var loaded = [];

  // ---------- results
  function areaStatus(findings) {
    var sev = findings.filter(function (f) { return f.severity !== "info"; }).map(function (f) { return f.severity; });
    if (sev.indexOf("critical") !== -1) return ["fail", "Failed"];
    if (sev.indexOf("high") !== -1 || sev.indexOf("medium") !== -1) return ["review", "Review"];
    if (sev.length) return ["note", "Notes only"];
    return ["pass", "Passed"];
  }
  function checklist(findings) {
    return '<ul class="areas">' + D.areas.map(function (a) {
      var mine = findings.filter(function (f) { return a.categories.indexOf(f.category) !== -1; });
      var st = areaStatus(mine), n = mine.filter(function (f) { return f.severity !== "info"; }).length;
      return '<li class="area a-' + st[0] + '"><span class="mark" aria-hidden="true"></span><div><b>' + esc(a.title) + "</b>" +
        '<span class="muted small">' + esc(a.blurb) + "</span></div>" +
        '<span class="astatus">' + st[1] + (n ? " (" + n + ")" : "") + "</span></li>";
    }).join("") + "</ul>";
  }

  function render(r, target, link) {
    var v = V[r.verdict];
    var real = r.findings.filter(function (f) { return f.severity !== "info"; }).length;
    var known = link && D.directory.filter(function (d) { return d.match === link.key; })[0];
    $("result").innerHTML = '<div class="tag-hang" style="padding-top:0"><div class="tag plain v-' + v[1] + '">' +
      '<div class="verdict-band"><div class="issuer">Hyniqe Shield check</div><p class="verdict">' + v[0] + "</p></div>" +
      "<dl><dt>Checked</dt><dd>" + esc(target) + "</dd><dt>Files</dt><dd>" + r.files_scanned + "</dd><dt>Findings</dt><dd>" + (real || "None") +
      "</dd><dt>Risk score</dt><dd>" + r.score + ' out of 100</dd></dl><div class="perf">' + v[2] + "</div></div></div>" +
      (known ? '<p class="small" style="margin-top:14px">This add-on is in the directory. <a href="/a/' + known.slug + '/">See its full report</a>.</p>' : "");
    var head = "<h2>Safety checklist</h2>" + checklist(r.findings);
    if (!r.findings.length) { $("findings").innerHTML = head + '<p class="muted">No findings. Still, only install add-ons from people you trust.</p>'; return; }
    var groups = {};
    r.findings.forEach(function (f) { (groups[f.rule_id] = groups[f.rule_id] || []).push(f); });
    var list = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) {
      return ORDER.indexOf(b[0].severity) - ORDER.indexOf(a[0].severity); });
    $("findings").innerHTML = head + '<h2 style="margin-top:36px">' + r.findings.length + (r.findings.length === 1 ? " finding" : " findings") + "</h2>" + list.map(function (g) {
      var f = g[0];
      var items = g.slice(0, 30).map(function (x) {
        var where = esc(x.file) + ", line " + x.line;
        if (link) where = '<a href="' + esc(link.blob + x.file) + "#L" + x.line + '">' + where + "</a>";
        return "<li>" + where + (x.evidence ? '<code class="ev">' + esc(x.evidence) + "</code>" : "") +
          (x.detail ? '<span class="muted small">' + esc(x.detail) + "</span>" : "") + "</li>"; }).join("");
      if (g.length > 30) items += '<li class="muted small">And ' + (g.length - 30) + " more.</li>";
      return '<section class="finding"><div class="finding-head"><h3>' + esc(f.title) + '</h3><span class="sev sev-' + f.severity + '">' +
        esc(f.severity[0].toUpperCase() + f.severity.slice(1)) + '</span><a class="rid" href="/rules/#' + f.rule_id + '">' + f.rule_id + "</a></div>" +
        "<p>" + esc(f.explain) + '</p><p class="fix"><b>What to do:</b> ' + esc(f.fix) + '</p><ul class="locs">' + items + "</ul></section>";
    }).join("");
  }

  function runText() {
    var files;
    if (loaded.length) files = loaded.map(function (f) { return S.scanText(f.text, f.name); });
    else {
      if (!$("src").value.trim()) { $("result").innerHTML = '<p class="muted">Paste a GitHub link or a file, or pick an example, to see a result.</p>'; $("findings").innerHTML = ""; return; }
      files = [S.scanText($("src").value, $("fname").value.trim() || "input.txt")];
    }
    var target = loaded.length ? loaded.length + " files" : ($("fname").value.trim() || "pasted text");
    render(S.summarise(target, files), target, null);
  }

  // ---------- GitHub links
  function parseGitHub(raw) {
    var u;
    try { u = new URL(raw.trim().replace(/^(?!https?:\/\/)/, "https://")); } catch (e) { return null; }
    var p = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    if (u.hostname === "raw.githubusercontent.com" && p.length >= 4)
      return {owner: p[0], repo: p[1], ref: p[2], path: p.slice(3).join("/"), file: true};
    if (u.hostname !== "github.com" && u.hostname !== "www.github.com") return null;
    if (p.length < 2) return null;
    var out = {owner: p[0], repo: p[1].replace(/\.git$/, ""), ref: null, path: "", file: false};
    if ((p[2] === "tree" || p[2] === "blob") && p.length >= 4) { out.ref = p[3]; out.path = p.slice(4).join("/"); out.file = p[2] === "blob"; }
    return out;
  }
  function globRe(pat) { return new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$"); }
  var EXCL = (D.excludes || []).map(globRe);
  function excluded(rel) {
    var base = rel.split("/").pop();
    if (/(^|\/)(node_modules|\.git|dist|build|\.next|__pycache__|\.venv|venv)\//.test(rel)) return true;
    return EXCL.some(function (re) { return re.test(rel) || re.test(base); });
  }
  async function gh(url) {
    var r = await fetch(url, {headers: {Accept: "application/vnd.github+json"}});
    if (r.status === 404) throw new Error("not-found");
    if (r.status === 403 || r.status === 429) throw new Error("rate");
    if (!r.ok) throw new Error("http " + r.status);
    return r.json();
  }
  function status(msg) { $("gh-status").textContent = msg; }

  async function checkLink(raw) {
    var g = parseGitHub(raw);
    if (!g) { status("That isn't a GitHub link. Paste a link like github.com/owner/repo, or a folder or file inside it."); return; }
    $("result").innerHTML = ""; $("findings").innerHTML = "";
    Array.prototype.forEach.call($("examples").children, function (c) { c.setAttribute("aria-pressed", "false"); });
    try {
      if (!g.ref) { status("Looking up " + g.owner + "/" + g.repo + "..."); g.ref = (await gh("https://api.github.com/repos/" + g.owner + "/" + g.repo)).default_branch; }
      var files = [];
      if (g.file) files = [{path: g.path}];
      else {
        status("Listing files...");
        var tree = await gh("https://api.github.com/repos/" + g.owner + "/" + g.repo + "/git/trees/" + encodeURIComponent(g.ref) + "?recursive=1");
        var prefix = g.path ? g.path + "/" : "";
        files = tree.tree.filter(function (t) {
          if (t.type !== "blob" || (prefix && t.path.indexOf(prefix) !== 0) || (t.size || 0) > 2000000) return false;
          var rel = t.path.slice(prefix.length);
          return (TEXT_EXT.test(rel) || /(^|\/)SKILL\.md$/i.test(rel)) && !excluded(rel);
        });
      }
      if (!files.length) { status("No files Shield can read were found at that link."); return; }
      var total = files.length;
      files = files.slice(0, MAX_FILES);
      var base = "https://raw.githubusercontent.com/" + g.owner + "/" + g.repo + "/" + g.ref + "/";
      var results = [], done = 0;
      for (var i = 0; i < files.length; i += 8) {
        var batch = await Promise.all(files.slice(i, i + 8).map(async function (f) {
          var r = await fetch(base + f.path.split("/").map(encodeURIComponent).join("/"));
          if (!r.ok) return null;
          var text = await r.text();
          if (text.slice(0, 4096).indexOf("\u0000") !== -1) return null;
          var rel = g.file ? f.path.split("/").pop() : f.path.slice(g.path ? g.path.length + 1 : 0);
          return S.scanText(text, rel);
        }));
        batch.forEach(function (x) { if (x) results.push(x); });
        done += batch.length;
        status("Checked " + done + " of " + files.length + " files...");
      }
      var target = g.owner + "/" + g.repo + (g.path ? "/" + g.path : "");
      var dir = g.file ? g.path.split("/").slice(0, -1).join("/") : g.path;
      var blobBase = "https://github.com/" + g.owner + "/" + g.repo + "/blob/" + g.ref + "/" + (dir ? dir + "/" : "");
      render(S.summarise(target, results), target, {blob: blobBase, key: (g.owner + "/" + g.repo + (g.path && !g.file ? "/" + g.path : "")).toLowerCase()});
      status(total > MAX_FILES ? "Checked the first " + MAX_FILES + " of " + total + " files. Run the command-line tool to check them all." :
        "Checked " + results.length + " files from " + target + " at " + g.ref + ". Tests, examples and docs were skipped.");
    } catch (e) {
      if (e.message === "not-found") status("GitHub couldn't find that repository. It may be private, or the link may be wrong.");
      else if (e.message === "rate") status("GitHub allows about 60 lookups an hour without signing in, and that limit has been reached. Try again later, or paste the file below.");
      else status("Couldn't reach GitHub (" + e.message + "). Check your connection and try again.");
    }
  }

  // ---------- wiring
  $("gh-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var v = $("gh").value;
    history.replaceState(null, "", "?url=" + encodeURIComponent(v.trim()));
    checkLink(v);
  });
  $("examples").innerHTML = D.examples.map(function (x, i) {
    return '<button type="button" aria-pressed="false" data-i="' + i + '">' + esc(x.label) + "</button>"; }).join("");
  $("examples").addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    var x = D.examples[+b.dataset.i]; loaded = [];
    $("fname").value = x.name; $("src").value = x.text;
    Array.prototype.forEach.call($("examples").children, function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
    status(""); runText();
  });

  async function take(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i], path = f.webkitRelativePath || f.name;
      if (f.size > 2000000 || /(^|\/)(node_modules|\.git)\//.test(path)) continue;
      if (!TEXT_EXT.test(path)) continue;
      var text = await f.text();
      if (text.slice(0, 4096).indexOf("\u0000") !== -1) continue;
      out.push({name: path, text: text});
    }
    if (!out.length) { $("result").innerHTML = '<p class="muted">No readable text files found. Shield reads code, Markdown, JSON and YAML files.</p>'; return; }
    Array.prototype.forEach.call($("examples").children, function (c) { c.setAttribute("aria-pressed", "false"); });
    if (out.length === 1) { loaded = []; $("fname").value = out[0].name.split("/").pop(); $("src").value = out[0].text; }
    else { loaded = out; $("src").value = ""; $("fname").value = ""; }
    status(""); runText();
  }
  $("files").addEventListener("change", function (e) { take(e.target.files); });
  var drop = $("drop");
  drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", function () { drop.classList.remove("over"); });
  drop.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove("over"); take(e.dataTransfer.files); });
  $("run").addEventListener("click", runText);
  $("fname").addEventListener("change", runText);
  var t; $("src").addEventListener("input", function () { loaded = []; clearTimeout(t); t = setTimeout(runText, 350); });

  var start = new URLSearchParams(location.search).get("url");
  if (start) { $("gh").value = start; checkLink(start); }
  else if (D.examples.length) $("examples").children[0].click();
  else runText();
})();
