// Minimal, safe Markdown → HTML for the reports these tools produce (headings, tables, lists, checkboxes,
// bold/italic/code, line breaks). All text is HTML-escaped first.
function renderMarkdown(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,:;]|$)/g, "$1<em>$2</em>")
    .replace(/ {2}$/g, "<br>");
  const lines = md.replace(/\r/g, "").split("\n");
  const html = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^#{1,4} /.test(l)) { const n = l.match(/^#+/)[0].length; html.push(`<h${n + 1}>${inline(l.slice(n + 1))}</h${n + 1}>`); i++; continue; }
    if (/^\|.*\|$/.test(l) && /^\|\s*-+/.test(lines[i + 1] || "")) {
      const cells = (row) => row.slice(1, -1).split(/(?<!\\)\|/).map((c) => inline(c.trim().replace(/\\\|/g, "|")));
      const head = cells(l);
      i += 2;
      const body = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i])) body.push(cells(lines[i++]));
      html.push(`<div class="tablewrap"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^(\d+\.|-) /.test(l)) {
      const ordered = /^\d+\./.test(l);
      const items = [];
      while (i < lines.length && (/^(\d+\.|-) /.test(lines[i]) || /^ {2,}\S/.test(lines[i]))) {
        if (/^ {2,}\S/.test(lines[i]) && items.length) items[items.length - 1] += "<br>" + inline(lines[i].trim());
        else items.push(inline(lines[i].replace(/^(\d+\.|-) /, "")).replace(/^\[ \] /, '<input type="checkbox"> ').replace(/^\[x\] /i, '<input type="checkbox" checked> '));
        // keep "  " line-break markers inside items
        if (/ {2}$/.test(lines[i])) items[items.length - 1] = items[items.length - 1].replace(/<br>$/, "");
        i++;
      }
      html.push(`<${ordered ? "ol" : "ul"}>${items.map((x) => `<li>${x}</li>`).join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#|\||\d+\. |- )/.test(lines[i])) para.push(inline(lines[i++]));
    html.push(`<p>${para.join(" ")}</p>`);
  }
  return html.join("\n");
}
