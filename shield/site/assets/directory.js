// Filter the directory table by search text, type and result. Reads ?q= from the home page search.
(function () {
  var q = document.getElementById("fq"), k = document.getElementById("fk"), v = document.getElementById("fv");
  var rows = Array.prototype.slice.call(document.querySelectorAll("#rows tr")), count = document.getElementById("fc");
  var params = new URLSearchParams(location.search);
  if (params.get("q")) q.value = params.get("q");
  function apply() {
    var words = q.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    rows.forEach(function (r) {
      var ok = (!k.value || r.dataset.kind === k.value) && (!v.value || r.dataset.verdict === v.value) &&
        words.every(function (w) { return r.dataset.s.indexOf(w) !== -1; });
      r.hidden = !ok; if (ok) shown++;
    });
    count.textContent = shown === 0 ? "No add-ons match. Try fewer words." : shown + (shown === 1 ? " add-on" : " add-ons");
  }
  [q, k, v].forEach(function (el) { el.addEventListener("input", apply); });
  apply();
})();
