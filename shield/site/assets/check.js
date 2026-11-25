// In-browser checker. Uses the same engine and rules as the command-line tool.
// Checks pasted text, dropped files, or a public GitHub link (fetched straight from GitHub by the visitor's browser),
// and shows the scan as a 3D stack of the add-on's files that light up as they are checked.
(function () {
  var D = window.SHIELD_DATA, S = HyniqeShield.createScanner(D.rules), ORDER = HyniqeShield.SEVERITY_ORDER;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); };
  var V = {DANGEROUS: ["Dangerous", "danger"], CAUTION: ["Caution", "caution"], NO_KNOWN_RISKS: ["No known risks", "clear"]};
  var TEXT_EXT = /\.(md|markdown|txt|json|jsonc|ya?ml|toml|py|js|mjs|cjs|ts|tsx|jsx|sh|bash|zsh|ps1|rb|go|rs|java|kt|php|env|html|xml|ini|cfg)$/i;
  var MAX_FILES = 300, MAX_SLABS = 8;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var loaded = [], busy = false, NUL = String.fromCharCode(0), ELL = String.fromCharCode(8230);

  // ---------- the live 3D stack
  var scan = null;
  function spacing(n, spread) { return n > 1 ? Math.round((spread ? 380 : 260) / (n - 1)) : 0; }
  function worst(findings) {
    var s = findings.filter(function (f) { return f.severity !== "info"; }).map(function (f) { return f.severity; });
    if (s.indexOf("critical") !== -1 || s.indexOf("high") !== -1) return "high";
    if (s.indexOf("medium") !== -1) return "med";
    return s.length ? "low" : "";
  }
  function startScan(names, fromGitHub) {
    $("where").textContent = fromGitHub ? "Fetched from GitHub straight into this tab. Nothing is uploaded." : "Checked on your device. Nothing is uploaded.";
    $("scan").hidden = false; $("results").hidden = true;
    $("findings").innerHTML = ""; $("result").innerHTML = "";
    $("stage").className = "stage live";
    $("live").classList.remove("done-panel");
    $("live-label").textContent = "Checking";
    var per = Math.ceil(names.length / Math.min(MAX_SLABS, names.length)), n = Math.ceil(names.length / per), rig = $("rig");
    Array.prototype.slice.call(rig.querySelectorAll(".slab")).forEach(function (s) { s.remove(); });
    scan = {names: names, n: n, per: per, done: 0, slabs: [], chunk: [], tally: {high: 0, med: 0, low: 0}, log: []};
    for (var i = 0; i < n; i++) {
      var part = names.slice(i * per, (i + 1) * per);
      var el = document.createElement("div");
      el.className = "slab pending";
      el.style.transform = "translateZ(" + (i * spacing(n)) + "px)";
      el.innerHTML = '<div class="code"><b>' + esc(part[0] + (part.length > 1 ? "  +" + (part.length - 1) : "")) + "</b>" +
        part.slice(1, 10).map(function (p) { return esc(p.length > 42 ? ELL + p.slice(-41) : p); }).join("\n") + "</div>";
      rig.insertBefore(el, $("beam"));
      scan.slabs.push(el); scan.chunk.push({left: part.length, findings: []});
    }
    moveBeam(0); progress();
  }
  function moveBeam(i) { $("beam").style.transform = "translateZ(" + (i * spacing(scan.n)) + "px)"; }
  function fileDone(index, name, result) {
    var c = Math.floor(index / scan.per), ch = scan.chunk[c];
    scan.done++;
    var real = result ? result.findings.filter(function (f) { return f.severity !== "info"; }) : [];
    real.forEach(function (f) {
      if (f.severity === "critical" || f.severity === "high") scan.tally.high++;
      else if (f.severity === "medium") scan.tally.med++; else scan.tally.low++;
    });
    if (ch) {
      ch.findings = ch.findings.concat(real); ch.left--;
      if (ch.left <= 0) { var w = worst(ch.findings); scan.slabs[c].className = "slab" + (w ? " flag-" + w : ""); }
    }
    var cls = !result ? "" : worst(real), word = !result ? "skipped" : real.length ? real.length + (real.length === 1 ? " finding" : " findings") : "clear";
    scan.log.unshift('<li><span>' + esc(name) + '</span><span class="' + (cls ? "f-" + cls : result ? "ok" : "") + '">' + word + "</span></li>");
    scan.log = scan.log.slice(0, 7);
    moveBeam(Math.min(scan.n - 1, Math.floor(scan.done / scan.per)));
    progress();
  }
  function progress() {
    $("live-count").textContent = scan.done + " of " + scan.names.length + (scan.names.length === 1 ? " file" : " files");
    $("bar").style.width = (scan.names.length ? Math.round(100 * scan.done / scan.names.length) : 0) + "%";
    $("t-high").textContent = scan.tally.high; $("t-med").textContent = scan.tally.med; $("t-low").textContent = scan.tally.low;
    $("log").innerHTML = scan.log.join("");
  }
  function finishScan() {
    $("stage").className = "stage done";
    scan.slabs.forEach(function (s, i) { s.style.transform = "translateZ(" + (i * spacing(scan.n, true)) + "px)"; });
    $("live").classList.add("done-panel");
    $("live-label").textContent = "Done";
    $("live-count").textContent = scan.done + (scan.done === 1 ? " file checked" : " files checked");
    $("bar").style.width = "100%";
  }

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
        '<span class="small">' + esc(a.blurb) + "</span></div>" +
        '<span class="astatus">' + st[1] + (n ? " (" + n + ")" : "") + "</span></li>";
    }).join("") + "</ul>";
  }
  function why(r, groups) {
    var serious = groups.filter(function (g) { return ["critical", "high", "medium"].indexOf(g[0].severity) !== -1; })
      .map(function (g) { var t = g[0].title; return t[0].toLowerCase() + t.slice(1); });
    var list = serious.slice(0, 3).join("; ") + (serious.length > 3 ? "; and more" : "");
    if (r.verdict === "DANGEROUS") return "Don't install this without understanding every finding." + (serious.length ? " Flagged for: " + list + "." : "");
    if (r.verdict === "CAUTION") return "Read the findings before installing." + (serious.length ? " Shield found: " + list + "." : "");
    return groups.length ? "Only low-severity notes. Nothing here raised a concern on its own." : "None of the rules matched. Still, only install add-ons from people you trust.";
  }

  function render(r, target, link) {
    var v = V[r.verdict];
    var real = r.findings.filter(function (f) { return f.severity !== "info"; });
    var known = link && D.directory.filter(function (d) { return d.match === link.key; })[0];
    var groups = {};
    r.findings.forEach(function (f) { (groups[f.rule_id] = groups[f.rule_id] || []).push(f); });
    var list = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) {
      return ORDER.indexOf(b[0].severity) - ORDER.indexOf(a[0].severity); });
    var sentence = why(r, list.filter(function (g) { return g[0].severity !== "info"; }));

    $("result").innerHTML = "<div><p class=\"target\">" + esc(target) + '</p><p class="vword t-' + v[1] + '">' + v[0] + ".</p>" +
      '<p class="why">' + esc(sentence) + "</p>" +
      '<div class="figures"><div><b>' + r.score + "<small> / 100</small></b><span>risk score</span></div>" +
      "<div><b>" + real.length + "</b><span>" + (real.length === 1 ? "finding" : "findings") + "</span></div>" +
      "<div><b>" + r.files_scanned + "</b><span>" + (r.files_scanned === 1 ? "file checked" : "files checked") + "</span></div></div>" +
      '<div class="actions">' + (link ? '<button class="btn" type="button" id="copy-link">Copy link to this result</button>' : "") +
      '<button class="btn ghost" type="button" id="again">Check another add-on</button>' +
      (known ? '<a class="btn ghost" href="/a/' + known.slug + '/">See its directory report</a>' : "") + "</div>" +
      '<p class="status" id="copy-status" aria-live="polite"></p></div>';

    var head = '<h2 class="section-title">Safety checklist</h2>' + checklist(r.findings);
    if (!r.findings.length) { $("findings").innerHTML = head; }
    else {
      $("findings").innerHTML = head + '<h2 class="section-title">' + r.findings.length + (r.findings.length === 1 ? " finding" : " findings") + "</h2>" + list.map(function (g) {
        var f = g[0];
        var items = g.slice(0, 30).map(function (x) {
          var where = esc(x.file) + ", line " + x.line;
          if (link) where = '<a href="' + esc(link.blob + x.file) + "#L" + x.line + '">' + where + " on GitHub</a>";
          return "<li>" + where + (x.evidence ? '<code class="ev">' + esc(x.evidence) + "</code>" : "") +
            (x.detail ? '<span class="dim small">' + esc(x.detail) + "</span>" : "") + "</li>"; }).join("");
        if (g.length > 30) items += '<li class="dim small">And ' + (g.length - 30) + " more.</li>";
        return '<section class="finding"><div class="finding-head"><span class="sev sev-' + f.severity + '">' +
          esc(f.severity[0].toUpperCase() + f.severity.slice(1)) + "</span><h3>" + esc(f.title) + '</h3><a class="rid" href="/rules/#' + f.rule_id + '">' + f.rule_id + "</a></div>" +
          "<p>" + esc(f.explain) + '</p><p class="fix"><b>What to do:</b> ' + esc(f.fix) + '</p><ul class="locs">' + items + "</ul></section>";
      }).join("");
    }
    $("results").hidden = false;
    var again = $("again");
    if (again) again.addEventListener("click", function () { $("gh").value = ""; window.scrollTo({top: 0, behavior: reduce ? "auto" : "smooth"}); $("gh").focus(); });
    var cl = $("copy-link");
    if (cl) cl.addEventListener("click", function () {
      navigator.clipboard.writeText(location.href).then(function () { $("copy-status").textContent = "Link copied."; },
        function () { $("copy-status").textContent = "Copy the address from your browser's address bar."; });
    });
  }

  function runFiles(files, target) {
    // files: [{name, text}] already in memory; the scan is instant, so the stack fills in one go
    startScan(files.map(function (f) { return f.name; }), false);
    var results = files.map(function (f, i) { var r = S.scanText(f.text, f.name); fileDone(i, f.name, r); return r; });
    finishScan();
    render(S.summarise(target, results), target, null);
  }
  function runText() {
    if (loaded.length) { runFiles(loaded, loaded.length + " files"); return; }
    if (!$("src").value.trim()) return;
    var name = $("fname").value.trim() || "input.txt";
    runFiles([{name: name, text: $("src").value}], name);
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
    if (busy) return;
    busy = true; $("gh-btn").disabled = true;
    $("results").hidden = true;
    Array.prototype.forEach.call($("examples").children, function (c) { c.setAttribute("aria-pressed", "false"); });
    try {
      if (!g.ref) { status("Looking up " + g.owner + "/" + g.repo + ELL); g.ref = (await gh("https://api.github.com/repos/" + g.owner + "/" + g.repo)).default_branch; }
      var files = [];
      if (g.file) files = [{path: g.path}];
      else {
        status("Listing files" + ELL);
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
      var rel = function (f) { return g.file ? f.path.split("/").pop() : f.path.slice(g.path ? g.path.length + 1 : 0); };
      status("");
      startScan(files.map(rel), true);
      $("scan").scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "start"});
      var base = "https://raw.githubusercontent.com/" + g.owner + "/" + g.repo + "/" + g.ref + "/";
      var results = [];
      for (var i = 0; i < files.length; i += 8) {
        await Promise.all(files.slice(i, i + 8).map(async function (f, j) {
          var idx = i + j, name = rel(f), out = null;
          try {
            var r = await fetch(base + f.path.split("/").map(encodeURIComponent).join("/"));
            if (r.ok) {
              var text = await r.text();
              if (text.slice(0, 4096).indexOf(NUL) === -1) { out = S.scanText(text, name); results.push(out); }
            }
          } catch (err) { out = null; }
          fileDone(idx, name, out);
        }));
      }
      finishScan();
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
    } finally { busy = false; $("gh-btn").disabled = false; }
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
    status(""); history.replaceState(null, "", location.pathname); runText();
  });

  async function take(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i], path = f.webkitRelativePath || f.name;
      if (f.size > 2000000 || /(^|\/)(node_modules|\.git)\//.test(path)) continue;
      if (!TEXT_EXT.test(path)) continue;
      var text = await f.text();
      if (text.slice(0, 4096).indexOf(NUL) !== -1) continue;
      out.push({name: path, text: text});
    }
    if (!out.length) { status("No readable text files found. Shield reads code, Markdown, JSON and YAML files."); return; }
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

  var start = new URLSearchParams(location.search).get("url");
  if (start) { $("gh").value = start; checkLink(start); }
})();
