// Copy buttons: <button data-copy="id-of-textarea">
document.addEventListener("click", function (ev) {
  var b = ev.target.closest("[data-copy]");
  if (!b) return;
  var el = document.getElementById(b.dataset.copy), status = document.getElementById("copy-status");
  navigator.clipboard.writeText(el.value).then(function () { status.textContent = "Badge Markdown copied."; },
    function () { el.select(); status.textContent = "Press Ctrl+C (or Cmd+C) to copy."; });
});
