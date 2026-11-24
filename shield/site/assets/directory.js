// Directory: search, filter chips with counts, and sorting. Reads ?q= from the home page.
(function () {
  var q = document.getElementById("fq"), sort = document.getElementById("fs"), count = document.getElementById("fc");
  var body = document.getElementById("rows");
  var rows = Array.prototype.slice.call(body.querySelectorAll("tr"));
  var state = {kind: "", verdict: "", pub: ""};
  var params = new URLSearchParams(location.search);
  if (params.get("q")) q.value = params.get("q");

  function matches(r, ignore) {
    var words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    return (ignore === "kind" || !state.kind || r.dataset.kind === state.kind) &&
      (ignore === "verdict" || !state.verdict || r.dataset.verdict === state.verdict) &&
      (ignore === "pub" || !state.pub || r.dataset.pub === state.pub) &&
      words.every(function (w) { return r.dataset.s.indexOf(w) !== -1; });
  }
  function apply() {
    var shown = 0;
    rows.forEach(function (r) { var ok = matches(r); r.hidden = !ok; if (ok) shown++; });
    count.textContent = shown === 0 ? "No add-ons match. Try fewer words or clear a filter." : shown + (shown === 1 ? " add-on" : " add-ons");
    // counts on each chip reflect the other active filters
    document.querySelectorAll(".chips [data-f]").forEach(function (b) {
      var f = b.dataset.f, v = b.dataset.v;
      var n = rows.filter(function (r) { return matches(r, f) && (!v || r.dataset[f] === v); }).length;
      b.querySelector(".n").textContent = n;
      b.setAttribute("aria-pressed", state[f] === v ? "true" : "false");
    });
  }
  function order() {
    var key = sort.value;
    rows.sort(function (a, b) {
      if (key === "name") return a.dataset.name.localeCompare(b.dataset.name);
      if (key === "findings") return (+b.dataset.findings - +a.dataset.findings) || a.dataset.name.localeCompare(b.dataset.name);
      if (key === "files") return (+b.dataset.files - +a.dataset.files) || a.dataset.name.localeCompare(b.dataset.name);
      return (+a.dataset.rank - +b.dataset.rank) || (+b.dataset.findings - +a.dataset.findings) || a.dataset.name.localeCompare(b.dataset.name);
    });
    rows.forEach(function (r) { body.appendChild(r); });
  }
  document.querySelector(".chips").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-f]"); if (!b) return;
    state[b.dataset.f] = b.dataset.v; apply();
  });
  q.addEventListener("input", apply);
  sort.addEventListener("change", function () { order(); apply(); });
  order(); apply();
})();
