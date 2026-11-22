// HTML for the Hyniqe Hub website. Pages are generated, so each tool gets its own address and title.
import { GROUPS, TOOLS, type Group, type ToolPage } from './tools.ts';

const REPO = 'https://github.com/HiteshChakravarti/Hyniqe';
const HEALTH = `${REPO}/issues/new?title=Health%20Check%20request&body=Organisation%3A%0ATool%3A%0ARough%20data%20volume%3A%0ABest%20way%20to%20contact%20you%3A`;

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LOGO = `<svg viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="7" fill="currentColor"/><path d="M8 7v12M18 7v12M8 13h10" stroke="var(--paper)" stroke-width="2.6" stroke-linecap="round"/></svg>`;
const MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;
const GLASS = `<svg class="glass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
const FILE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 18v-6M9 14l3-3 3 3"/></svg>`;
const LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

function shell(opts: { title: string; description: string; base: string; body: string; script: string; current?: string; canonical: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="canonical" href="https://hiteshchakravarti.github.io/Hyniqe/${opts.canonical}">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<link rel="stylesheet" href="${opts.base}assets/site.css">
<script>try{const t=localStorage.getItem('hyniqe-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="wrap">
  <a class="logo" href="${opts.base}">${LOGO}Hyniqe Hub</a>
  <nav aria-label="Main">
    <a href="${opts.base}#tools"${opts.current === 'tools' ? ' aria-current="page"' : ''}>Tools</a>
    <a href="${opts.base}#accuracy">Accuracy</a>
    <a href="${opts.base}#health-check">Health Check</a>
    <a href="${REPO}">GitHub</a>
  </nav>
  <button class="icon-btn" id="theme" type="button" aria-label="Switch between light and dark">${MOON}</button>
</div></header>
<main id="main">
${opts.body}
</main>
<footer><div class="wrap">
  <p>Hyniqe Hub is free and open source. Files are processed in your browser and never uploaded. Checks are rule-based, and every flag states its reason; review flagged items before acting on them.</p>
  <p class="row"><a href="${REPO}">Source on GitHub</a><a href="${REPO}/blob/main/LICENSING.md">Licensing</a></p>
</div></footer>
<script type="module" src="${opts.base}assets/${opts.script}"></script>
</body>
</html>
`;
}

function toolLink(t: ToolPage, base: string): string {
  return `<a class="tool-link" href="${base}tools/${t.slug}/"><b>${esc(t.name)}<span class="tag ${t.status}">${t.status === 'live' ? 'Live' : 'In progress'}</span></b><span>${esc(t.short)}</span></a>`;
}

export function homePage(): string {
  const groups = (Object.keys(GROUPS) as Group[])
    .map((g) => `<div class="group"><div><h3>${esc(GROUPS[g].title)}</h3><p>${esc(GROUPS[g].blurb)}</p></div><div class="tool-list">${TOOLS.filter((t) => t.group === g).map((t) => toolLink(t, '')).join('')}</div></div>`)
    .join('');
  const body = `
<section class="hero"><div class="wrap">
  <div>
    <h1>Fix the files your bank rejects. Find the errors that cost money.</h1>
    <p class="lede">Free tools for payment files, bank statements, settlement instructions and supplier payments. Drop in a file, see what is wrong in plain English, and download the fix. Nothing leaves your computer.</p>
    <div class="finder" role="search">
      <label for="find">What are you trying to fix?</label>
      ${GLASS}
      <input id="find" type="search" autocomplete="off" placeholder="e.g. bank rejected my payment file" aria-controls="find-results" aria-expanded="false">
      <div class="results-pop" id="find-results" role="listbox" hidden></div>
    </div>
    <p class="tries">People ask: <button type="button">bank rejected my payment file</button><button type="button">camt.053 to Excel</button><button type="button">invoice paid twice</button><button type="button">T+1 settlement instructions</button></p>
  </div>
  <figure class="slip" id="slip" aria-label="Example: a supplier payment rejected for an unstructured address, then fixed">
    <div class="slip-head"><span>Credit transfer</span><span>EUR 12,480.00</span></div>
    <dl>
      <dt>Payee</dt><dd>Kestrel Textiles S.L.</dd>
      <dt>IBAN</dt><dd>ES57 2745 5335 9808 8667 0074</dd>
      <div class="before"><dt>Address</dt><dd>Calle de Alcalá 36, 08007 Barcelona</dd></div>
      <div class="after"><dt>Street</dt><dd>Calle de Alcalá</dd><dt>Building</dt><dd>36</dd><dt>Postcode</dt><dd>08007</dd><dt>Town</dt><dd>Barcelona</dd><dt>Country</dt><dd>ES</dd></div>
    </dl>
    <p class="slip-note" id="slip-note">Rejected: address is one line of text; the bank needs town and country as separate fields.</p>
    <span class="stamp rej">Rejected</span><span class="stamp ok">Fixed</span>
    <button class="slip-replay" type="button" id="slip-replay">Replay</button>
  </figure>
</div></section>

<section class="band" id="tools"><div class="wrap">
  <h2>Pick the problem, not the product</h2>
  <div class="groups">${groups}</div>
</div></section>

<section class="band" id="accuracy"><div class="wrap">
  <h2>Why you can trust a free tool with this</h2>
  <div class="promise">
    <div><h3>Your file stays with you</h3><p>Every check runs inside your browser tab. Nothing is uploaded, stored or tracked. You can switch off your internet after the page loads and it still works.</p></div>
    <div><h3>Every tool is measured</h3><p id="bench-line">Each solution ships with a benchmark that runs on every change and blocks the release if accuracy drops.</p></div>
    <div><h3>You can read the rules</h3><p>The code is open on GitHub. Every flag says which rule fired and why, so you can check it before you act on it.</p></div>
  </div>
  <table class="scores" id="scores" hidden><caption>Latest benchmark run, on generated files with known, labelled problems</caption><thead><tr><th>Tool</th><th>Tested on</th><th>Problems found</th><th>False alarms</th></tr></thead><tbody></tbody></table>
</div></section>

<section class="band" id="health-check"><div class="wrap health">
  <div>
    <h2>Want it done on your real data, with a fix plan?</h2>
    <p>A Health Check runs the tools on your files with you, explains what the results mean for your team, and leaves you with a prioritised fix plan and rules that stop the errors coming back.</p>
    <a class="btn primary" href="${HEALTH}">Request a Health Check</a>
  </div>
  <ul><li>A report your managers and auditors can read</li><li>The ten fixes that matter most, in order</li><li>Validation rules for your systems so it stays fixed</li></ul>
</div></section>`;
  return shell({ title: 'Hyniqe Hub: free tools to fix bank files and find costly finance errors', description: 'Fix rejected payment files, convert bank statements to Excel, find duplicate payments and check settlement instructions for T+1. Free, open source, and nothing is uploaded.', base: '', body, script: 'home.js', current: 'tools', canonical: '' });
}

export function toolPage(t: ToolPage): string {
  const base = '../../';
  const columns = t.columns
    ? `<section><h3>Columns it understands</h3><table>${t.columns.map(([f, n, r]) => `<tr><td>${esc(f)}${r ? '' : ' <span class="note">(optional)</span>'}</td><td><code>${esc(n)}</code></td></tr>`).join('')}</table><p class="note">Headers are matched without regard to case or punctuation. Save Excel files as CSV first.</p></section>`
    : '';
  const others = TOOLS.filter((o) => o.slug !== t.slug && o.group === t.group);
  const second = t.secondInput
    ? `<label class="drop second" id="drop-2"><input type="file" id="file-2" accept="${t.secondInput.accept}">${FILE}<strong>${esc(t.secondInput.label)}</strong><small id="file-2-name">No file chosen</small></label>`
    : '';
  const extra = t.slug === 'excel-to-payment-file'
    ? `<div class="fields"><label>Your company name<input id="f-name" value="Example Trading Ltd"></label><label>Your IBAN<input id="f-iban" value="DE89370400440532013000"></label><label>Payment date<input id="f-date" type="date"></label></div>`
    : '';
  const building = t.status === 'building' ? `<p class="note">This tool is being finished. It will run here as soon as its tests and benchmark pass.</p>` : '';
  const body = `
<div class="wrap">
  <p class="crumbs"><a href="${base}">Hyniqe Hub</a> / <a href="${base}#tools">${esc(GROUPS[t.group].title)}</a></p>
  <div class="tool-hero"><h1>${esc(t.h1)}</h1><p class="lede">${esc(t.lede)}</p></div>
  <div class="workspace" data-tool="${t.slug}">
    <div class="bench">
      <label class="drop" id="drop-1"><input type="file" id="file-1" accept="${t.accept}">${FILE}<strong>${esc(t.inputLabel)}</strong><small id="file-1-name">No file chosen</small></label>${t.paste ? `\n      <label class="paste">Or paste it here<textarea id="paste" rows="8" spellcheck="false" placeholder="${esc(t.paste)}"></textarea></label>` : ''}
      ${second}${extra}
      <div class="row"><button class="btn primary" id="run" disabled>Check my file</button><button class="btn" id="run-sample">Try it with sample data</button></div>
      <p class="samples">Or download ${t.samples.map((s) => `<a href="${base}samples/${s.file}" download>${esc(s.label)}</a>`).join(' or ')} to see the format.</p>
      <p class="private">${LOCK}Processed in your browser. Nothing is uploaded.</p>
      ${building}
      <p class="error" id="error" role="alert" hidden></p>
      <div class="results" id="results" hidden aria-live="polite">
        <div class="verdict" id="verdict"></div>
        <div class="stats" id="stats"></div>
        <div class="row"><button class="btn primary" id="dl-main">Download</button><button class="btn" id="open-report">Open full report</button><button class="btn" id="dl-csv">Download results (CSV)</button></div>
        <div class="table-wrap"><table class="data" id="table"></table></div>
        <p class="note" id="table-note"></p>
      </div>
    </div>
    <aside class="side">
      <section><h3>What it checks</h3><ul>${t.checks.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></section>
      ${columns}
    </aside>
  </div>
</div>
<section class="band"><div class="wrap">
  <h2>How it works</h2>
  <ol class="steps"><li><h3>Drop the file</h3><p>Straight from your bank portal, ERP or spreadsheet. No account, no install.</p></li><li><h3>Read the result</h3><p>Every problem in plain English, with the row it is in and why it matters.</p></li><li><h3>Download the fix</h3><p>A corrected file or a report and a CSV you can work through with your team.</p></li></ol>
</div></section>
<section class="band faq"><div class="wrap">
  <h2>Questions</h2>
  ${t.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
</div></section>
${others.length ? `<section class="band"><div class="wrap"><h2>${esc(GROUPS[t.group].title)}: other tools</h2><div class="tool-list" style="margin-top:22px">${others.map((o) => toolLink(o, base)).join('')}</div></div></section>` : ''}`;
  return shell({ title: t.title, description: t.lede, base, body, script: 'tool.js', canonical: `tools/${t.slug}/` });
}

export function searchIndex(): string {
  return `export const TOOL_INDEX = ${JSON.stringify(TOOLS.map((t) => ({ slug: t.slug, name: t.name, short: t.short, keywords: t.keywords, status: t.status })), null, 1)};\n`;
}
