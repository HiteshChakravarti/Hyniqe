// Copy buttons: <button data-copy="id-of-textarea">. Format tabs: <button data-fmt="id-of-textarea"> switch which one is shown and copied.
document.addEventListener("click", function (ev) {
  var tab = ev.target.closest("[data-fmt]");
  if (tab) {
    var group = tab.parentNode;
    Array.prototype.forEach.call(group.querySelectorAll("[data-fmt]"), function (b) {
      var on = b === tab;
      b.setAttribute("aria-selected", on ? "true" : "false");
      document.getElementById(b.dataset.fmt).hidden = !on;
    });
    var btn = document.getElementById("copy-btn");
    if (btn) btn.dataset.copy = tab.dataset.fmt;
    return;
  }
  var b = ev.target.closest("[data-copy]");
  if (!b) return;
  var el = document.getElementById(b.dataset.copy), status = document.getElementById("copy-status");
  navigator.clipboard.writeText(el.value).then(function () { status.textContent = "Copied. Paste it into your README."; },
    function () { el.select(); status.textContent = "Press Ctrl+C (or Cmd+C) to copy."; });
});
