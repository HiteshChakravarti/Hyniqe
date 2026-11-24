"""Build the Hyniqe Shield website into site/dist.

Reads data/scans.json (written by scan_directory.py), the rules and the browser engine,
and writes plain static HTML. No dependencies beyond the Python standard library.
Run from anywhere: python3 site/build_site.py
"""
from __future__ import annotations

import html
import json
import os
import runpy
import shutil
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent
ROOT = SITE.parent
DIST = SITE / "dist"
BASE_URL = os.environ.get("SITE_URL", "https://hyniqe-shield.vercel.app").rstrip("/")
REPO_URL = "https://github.com/HiteshChakravarti/Hyniqe"

sys.path.insert(0, str(ROOT))
from hyniqe_shield.engine import Scanner  # noqa: E402

RULES = json.loads((ROOT / "hyniqe_shield" / "rules.json").read_text("utf-8"))
RULE_INFO = {r["id"]: r for r in RULES["rules"]}
RULE_INFO.update({k: dict(v, id=k) for k, v in RULES["structural_rules"].items()})
DATA = json.loads((SITE / "data" / "scans.json").read_text("utf-8"))
ADDONS = DATA["addons"]
N_RULES = len(RULE_INFO)

VERDICT = {"NO_KNOWN_RISKS": ("No known risks", "clear"), "CAUTION": ("Caution", "caution"),
           "DANGEROUS": ("Dangerous", "danger")}
KIND = {"skill": "Skill", "mcp": "MCP server"}
e = html.escape


def label(a: dict) -> str:
    if a["sub"]:
        return a["name"]
    name = a["repo"].split("/")[1]
    return a["repo"] if name.lower() in ("mcp", "servers", "skills") else name


def source(a: dict) -> str:
    return a["repo"] + ("/" + a["sub"] if a["sub"] else "")


def gh_tree(a: dict) -> str:
    return f"https://github.com/{a['repo']}/tree/{a['commit']}" + (f"/{a['sub']}" if a["sub"] else "")


def gh_line(a: dict, file: str, line: int) -> str:
    path = (a["sub"] + "/" if a["sub"] else "") + file
    return f"https://github.com/{a['repo']}/blob/{a['commit']}/{path}#L{line}"


def findings_total(a: dict) -> int:
    return sum(g["count"] for g in a["groups"] if g["severity"] != "info")


# ---------------------------------------------------------------- layout

LOGO = ('<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M13 1 2 5v9c0 7 4.6 12.6 11 15 '
        '6.4-2.4 11-8 11-15V5z" fill="#08303d"/><circle cx="13" cy="9.5" r="2.6" fill="#e7f2f5"/><path d="m8 16 3.6 3.6L18.5 13" '
        'fill="none" stroke="#e7f2f5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>')
NAV = [("/directory/", "Directory"), ("/check/", "Check a file"), ("/rules/", "Rules"), ("/about/", "How it works"),
       (REPO_URL, "GitHub")]
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=Atkinson+Hyperlegible+Next:wght@400;700&display=swap" rel="stylesheet">')


def page(path: str, title: str, desc: str, body: str, current: str = "", scripts: str = "") -> None:
    nav = "".join(f'<a href="{h}"{" aria-current=page" if h == current else ""}>{t}</a>' for h, t in NAV)
    full_title = title if title.startswith("Hyniqe Shield") else f"{title} | Hyniqe Shield"
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(full_title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{BASE_URL}{path}">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{BASE_URL}{path}">
<meta name="theme-color" content="#08303d">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
{FONTS}
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
<a class="brand" href="/">{LOGO}Hyniqe Shield</a>
<nav class="nav" aria-label="Main">{nav}</nav>
</div></header>
<main id="main">
{body}
</main>
<footer class="site-foot"><div class="wrap">
<p>Hyniqe Shield is free and open source (AGPL-3.0), part of <a href="{REPO_URL}">Hyniqe</a>.<br>
Rules mapped to the OWASP Top 10 for Agentic Applications 2026.</p>
<nav aria-label="Footer"><a href="/directory/">Directory</a><a href="/check/">Check a file</a><a href="/rules/">Rules</a><a href="/about/">How it works</a><a href="/about/#badges">Badges</a><a href="{REPO_URL}/issues/new?title=Shield%20scan%20request">Request a scan</a></nav>
</div></footer>
{scripts}
</body>
</html>
"""
    out = DIST / path.lstrip("/") / "index.html" if path.endswith("/") else DIST / path.lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, "utf-8")


def tag(a: dict, tilt: bool = False, heading: str = "p") -> str:
    word, cls = VERDICT[a["verdict"]]
    n = findings_total(a)
    return f"""<div class="tag-hang"><div class="tag v-{cls}{' tilt' if tilt else ''}">
<div class="verdict-band"><div class="issuer">Hyniqe Shield inspection</div><{heading} class="verdict">{word}</{heading}></div>
<dl>
<dt>Add-on</dt><dd>{e(label(a))}</dd>
<dt>Type</dt><dd>{KIND[a['kind']]}</dd>
<dt>Source</dt><dd><a href="{gh_tree(a)}">{e(source(a))}</a></dd>
<dt>Commit</dt><dd><code>{a['commit'][:7]}</code></dd>
<dt>Files read</dt><dd>{a['files']:,}</dd>
<dt>Findings</dt><dd>{n if n else 'None'}</dd>
<dt>Checked</dt><dd>{e(DATA['scanned_on'])}, rules {e(DATA['rules_version'])}</dd>
</dl>
<div class="perf">Static check of the code at this commit. Not a guarantee of safety.</div>
</div></div>"""


def chip(verdict: str) -> str:
    word, cls = VERDICT[verdict]
    return f'<span class="chip v-{cls}">{word}</span>'


# ---------------------------------------------------------------- pages

def home() -> None:
    clear = sum(a["verdict"] == "NO_KNOWN_RISKS" for a in ADDONS)
    caution = sum(a["verdict"] == "CAUTION" for a in ADDONS)
    danger = sum(a["verdict"] == "DANGEROUS" for a in ADDONS)
    hero_addon = next(a for a in ADDONS if a["slug"] == "mcp-filesystem")

    # annotated specimen: the malicious test skill, scanned live at build time
    runpy.run_path(str(ROOT / "scripts" / "make_fixtures.py"))
    spec_text = (ROOT / "tests" / "fixtures" / "malicious" / "evil-skill" / "SKILL.md").read_text("utf-8")
    res = Scanner().scan_text(spec_text, "SKILL.md")
    by_line: dict[int, list] = {}
    for f in res.findings:
        by_line.setdefault(f.line, []).append(f)
    lines = []
    for i, raw in enumerate(spec_text.rstrip("\n").split("\n"), 1):
        visible = "".join(c for c in raw if not 0xE0000 <= ord(c) <= 0xE007F)
        hidden = "".join(chr(ord(c) - 0xE0000) for c in raw if 0xE0020 <= ord(c) <= 0xE007E)
        cls = ""
        if i in by_line:
            sev = {f.severity for f in by_line[i]}
            cls = ' class="hit"' if sev & {"critical", "high"} else ' class="hit med"'
        reveal = f'<span class="reveal" style="display:inline">  [invisible: {e(hidden)}]</span>' if hidden else ""
        lines.append(f'<span{cls}><i>{i}</i>{e(visible)}{reveal}</span>')
    notes, seen = [], set()
    order = ["critical", "high", "medium", "low", "info"]
    for f in sorted(res.findings, key=lambda f: (order.index(f.severity), f.line)):
        if f.rule_id in seen or len(notes) >= 6:
            continue
        seen.add(f.rule_id)
        notes.append(f'<li><b>{e(f.title)}</b><span class="where">Line {f.line} &middot; {f.severity} &middot; '
                     f'<a href="/rules/#{f.rule_id}">{f.rule_id}</a></span></li>')

    recent = sorted(ADDONS, key=lambda a: (a["kind"] != "mcp", -a["files"]))[:8]
    rows = "".join(f'<tr><td><a class="name" href="/a/{a["slug"]}/">{e(label(a))}</a><span class="desc">{e(source(a))}</span></td>'
                   f'<td class="hide-sm">{KIND[a["kind"]]}</td><td>{chip(a["verdict"])}</td><td class="num hide-sm">{a["files"]:,}</td></tr>' for a in recent)

    body = f"""
<section class="band"><div class="wrap hero">
<div>
<h1>Know what an AI add-on will do before you install it.</h1>
<p class="lede">Skills, MCP servers and agent workflows get access to your files, email and accounts. Hyniqe Shield reads them first and tells you, in plain English, what they could do with that access.</p>
<form class="find" action="/directory/" method="get" role="search">
<label class="sr" for="q">Search checked add-ons</label>
<input id="q" name="q" type="search" placeholder="Search {len(ADDONS)} checked skills and MCP servers" autocomplete="off">
<button class="btn" type="submit">Search</button>
</form>
<p class="tally-line">So far: <b>{clear}</b> with no known risks, <b>{caution}</b> to review, <b>{danger}</b> dangerous. Or <a href="/check/">check your own file</a> in your browser.</p>
</div>
{tag(hero_addon, tilt=True)}
</div></section>

<section class="band"><div class="wrap">
<h2>What a poisoned skill looks like</h2>
<p class="lede">This is a test file from Shield's own suite. It reads like a harmless PDF helper. Line 9 also carries a sentence written in invisible Unicode characters, which you can't see but the AI can read. Shield decodes it and flags every risky line.</p>
<div class="specimen">
<pre class="src" aria-label="Contents of a malicious SKILL.md with flagged lines highlighted"><code>{''.join(lines)}</code></pre>
<ol aria-label="What Shield found">{''.join(notes)}</ol>
</div>
</div></section>

<section class="band"><div class="wrap">
<h2>Checked add-ons</h2>
<p class="lede">Popular skills and MCP servers, scanned at a recorded commit. Every finding links to the exact line on GitHub, so you can judge it yourself.</p>
<div class="table-wrap" style="margin-top:24px"><table>
<thead><tr><th scope="col">Add-on</th><th scope="col" class="hide-sm">Type</th><th scope="col">Result</th><th scope="col" class="num hide-sm">Files read</th></tr></thead>
<tbody>{rows}</tbody></table></div>
<p style="margin-top:18px"><a class="btn ghost small" href="/directory/">See all {len(ADDONS)} add-ons</a></p>
</div></section>

<section class="band"><div class="wrap">
<h2>Use it where you already work</h2>
<div class="ways">
<div><h3>In your browser</h3><p>Paste a skill, a config or a whole folder. The check runs on your device and nothing is uploaded.</p><p><a href="/check/">Open the checker</a></p></div>
<div><h3>In the terminal</h3><p>One command, no dependencies, Python 3.</p>
<pre class="cmd"><code>git clone {REPO_URL}
cd Hyniqe/shield
python3 -m hyniqe_shield scan ~/.cursor/mcp.json</code></pre></div>
<div><h3>On every pull request</h3><p>The GitHub Action blocks risky add-ons and shows findings in code scanning.</p>
<pre class="cmd"><code>- uses: HiteshChakravarti/Hyniqe/shield@main
  with:
    fail-on: dangerous</code></pre></div>
</div>
</div></section>

<section class="band"><div class="wrap">
<h2>What a clear result means, and what it doesn't</h2>
<p class="lede">"No known risks" means none of the {N_RULES} rules matched. It does not prove an add-on is safe. Shield never runs the code, so it can't see what a remote server does after you connect, and new attack tricks appear all the time. Install from people you trust, keep confirmations on for tools that write, delete, pay or send, and pin versions.</p>
<p><a href="/about/">How Shield checks an add-on</a></p>
</div></section>
"""
    page("/", "Hyniqe Shield: check AI agent add-ons before you install them",
         "Free, open-source safety checks for Claude skills, MCP servers and n8n workflows. See what an add-on could do with your data before you install it.",
         body, "/")


def directory() -> None:
    rows = []
    for a in sorted(ADDONS, key=lambda a: (["DANGEROUS", "CAUTION", "NO_KNOWN_RISKS"].index(a["verdict"]), label(a).lower())):
        word, _ = VERDICT[a["verdict"]]
        search = " ".join([a["name"], a["repo"], a["sub"], a["description"], KIND[a["kind"]]]).lower()
        rows.append(f'<tr data-kind="{a["kind"]}" data-verdict="{a["verdict"]}" data-s="{e(search)}">'
                    f'<td><a class="name" href="/a/{a["slug"]}/">{e(label(a))}</a>'
                    f'<span class="desc">{e(a["description"]) if a["description"] else e(source(a))}</span></td>'
                    f'<td class="hide-sm"><a href="{gh_tree(a)}">{e(a["repo"])}</a></td>'
                    f'<td class="hide-sm">{KIND[a["kind"]]}</td><td>{chip(a["verdict"])}</td>'
                    f'<td class="num">{findings_total(a) or "None"}</td></tr>')
    body = f"""
<section class="band"><div class="wrap">
<h1>Directory</h1>
<p class="lede">{len(ADDONS)} skills and MCP servers, each checked at a recorded commit on {e(DATA['scanned_on'])}. Open one to see every finding and the exact line it came from.</p>
<div class="filters" role="search">
<label>Search<input id="fq" type="search" placeholder="Name, repo or purpose" autocomplete="off"></label>
<label>Type<select id="fk"><option value="">All types</option><option value="skill">Skills</option><option value="mcp">MCP servers</option></select></label>
<label>Result<select id="fv"><option value="">All results</option><option value="NO_KNOWN_RISKS">No known risks</option><option value="CAUTION">Caution</option><option value="DANGEROUS">Dangerous</option></select></label>
<p class="count" id="fc" aria-live="polite">{len(ADDONS)} add-ons</p>
</div>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Add-on</th><th scope="col" class="hide-sm">Repository</th><th scope="col" class="hide-sm">Type</th><th scope="col">Result</th><th scope="col" class="num">Findings</th></tr></thead>
<tbody id="rows">{''.join(rows)}</tbody></table></div>
<p class="muted small" style="margin-top:16px">Want an add-on checked, or maintain one listed here? <a href="{REPO_URL}/issues/new?title=Shield%20scan%20request">Open an issue</a> to request a scan or a re-check.</p>
</div></section>"""
    page("/directory/", "Directory of checked add-ons",
         f"Safety results for {len(ADDONS)} popular Claude skills and MCP servers, with every finding linked to its source line.",
         body, "/directory/", '<script src="/assets/directory.js"></script>')


def report(a: dict) -> None:
    word, cls = VERDICT[a["verdict"]]
    real = [g for g in a["groups"] if g["severity"] != "info"]
    info = [g for g in a["groups"] if g["severity"] == "info"]
    if a["verdict"] == "NO_KNOWN_RISKS" and not real:
        summary = f"None of the {N_RULES} rules matched in the {a['files']:,} files Shield read."
    elif a["verdict"] == "NO_KNOWN_RISKS":
        summary = "Only low-severity notes, listed below. Nothing here raised a concern on its own."
    else:
        reasons = [RULE_INFO[g["rule_id"]]["title"].lower() for g in real if g["severity"] in ("critical", "high", "medium")]
        lead = "Do not install without understanding these findings" if a["verdict"] == "DANGEROUS" else "Review before installing"
        summary = f"{lead}. The result comes from: {', '.join(reasons[:4])}{' and more' if len(reasons) > 4 else ''}."

    def group_html(g: dict) -> str:
        r = RULE_INFO[g["rule_id"]]
        items = [f'<li><a href="{gh_line(a, l["file"], l["line"])}">{e(l["file"])}, line {l["line"]}</a>'
                 + (f'<code class="ev">{e(l["evidence"])}</code>' if l["evidence"] else "")
                 + (f'<span class="muted small">{e(l["detail"])}</span>' if l["detail"] else "") + "</li>"
                 for l in g["locations"]]
        locs = "".join(items[:4])
        if len(items) > 4:
            locs += (f'<li><details class="more"><summary>Show {len(items) - 4} more</summary>'
                     f'<ul class="locs">{"".join(items[4:])}</ul></details></li>')
        more = g["count"] - len(g["locations"])
        more_txt = f'<li class="muted small">And {more} more place{"s" if more != 1 else ""}. Run the CLI on the repository to see them all.</li>' if more > 0 else ""
        return f"""<section class="finding" id="{g['rule_id']}">
<div class="finding-head"><h3>{e(r['title'])}</h3><span class="sev sev-{g['severity']}">{g['severity'].capitalize()}</span>
<a class="rid" href="/rules/#{g['rule_id']}">{g['rule_id']}</a><span class="rid">{g['count']} place{'s' if g['count'] != 1 else ''}</span></div>
<p>{e(r['explain'])}</p>
<p class="fix"><b>What to do:</b> {e(r['fix'])}</p>
<ul class="locs">{locs}{more_txt}</ul>
</section>"""

    findings = "".join(group_html(g) for g in real) or '<p class="muted">No findings.</p>'
    info_html = ""
    if info:
        info_html = "<h2 style='margin-top:40px'>For your information</h2><p class='muted'>Not risks on their own, but worth knowing.</p>" + "".join(group_html(g) for g in info)
    badge_md = f"[![Hyniqe Shield: {word}]({BASE_URL}/badge/{a['slug']}.svg)]({BASE_URL}/a/{a['slug']}/)"
    body = f"""
<section class="band"><div class="wrap">
<p class="crumbs"><a href="/directory/">Directory</a> / {KIND[a['kind']]}</p>
<div class="report">
<aside>{tag(a, heading="h2")}
<div class="snippet">
<label for="badge-md"><b>Badge for your README</b></label>
<img src="/badge/{a['slug']}.svg" alt="Hyniqe Shield: {word}" height="20">
<textarea id="badge-md" readonly>{e(badge_md)}</textarea>
<button class="btn ghost small" type="button" data-copy="badge-md">Copy badge Markdown</button>
<span class="status" id="copy-status" aria-live="polite"></span>
</div>
</aside>
<div>
<h1>{e(label(a))}</h1>
<p class="lede">{e(a['description']) if a['description'] else e(source(a))}</p>
<p><b>{e(summary)}</b></p>
{findings}
{info_html}
<div class="note"><p><b>About this result.</b> Shield read {a['files']:,} text files at commit <a href="{gh_tree(a)}"><code>{a['commit'][:7]}</code></a> and skipped tests, examples, demos and docs. It never ran any code. A finding is a pattern worth looking at, not proof of bad intent. The code may have changed since then.</p>
<p class="small">Maintainer? <a href="{REPO_URL}/issues/new?title={e('Shield re-check: ' + source(a))}">Request a re-check</a> or tell us about a wrong finding.</p></div>
</div>
</div>
</div></section>"""
    page(f"/a/{a['slug']}/", f"{label(a)} ({source(a)}): {word}",
         f"Hyniqe Shield result for {source(a)}: {word}. {summary}", body, "",
         '<script src="/assets/copy.js"></script>')


def badge(a: dict) -> None:
    word, cls = VERDICT[a["verdict"]]
    colors = {"clear": "#0b7f5c", "caution": "#b56d00", "danger": "#d4145a"}
    left, right = "Hyniqe Shield", word.lower()
    lw, rw = int(len(left) * 6.6 + 14), int(len(right) * 6.6 + 14)
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{lw + rw}" height="20" role="img" aria-label="{left}: {right}">
<title>{left}: {right}</title>
<clipPath id="r"><rect width="{lw + rw}" height="20" rx="3"/></clipPath>
<g clip-path="url(#r)"><rect width="{lw}" height="20" fill="#08303d"/><rect x="{lw}" width="{rw}" height="20" fill="{colors[cls]}"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">
<text x="{lw / 2}" y="14">{left}</text><text x="{lw + rw / 2}" y="14">{right}</text></g></svg>
"""
    out = DIST / "badge" / f"{a['slug']}.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(svg, "utf-8")


def rules_page() -> None:
    items = []
    order = ["critical", "high", "medium", "low", "info"]
    for r in sorted(RULE_INFO.values(), key=lambda r: (order.index(r["severity"]), r["id"])):
        owasp = ", ".join(f'{o} {RULES["owasp"].get(o, "")}' for o in r["owasp"])
        items.append(f"""<div class="rule" id="{r['id']}"><div><div class="id">{r['id']}</div><span class="sev sev-{r['severity']}">{r['severity'].capitalize()}</span></div>
<div><h3>{e(r['title'])}</h3><p>{e(r['explain'])}</p><p><b>What to do:</b> {e(r['fix'])}</p><p class="owasp">OWASP: {e(owasp)}</p></div></div>""")
    body = f"""
<section class="band"><div class="wrap">
<h1>Rules</h1>
<p class="lede">The {N_RULES} checks Shield runs, ordered by severity, each mapped to the OWASP Top 10 for Agentic Applications 2026. Rules version {e(RULES['version'])}.</p>
<p>A result is <b>Dangerous</b> when any critical rule matches, or two or more different high-severity rules do. It is <b>Caution</b> when a high-severity rule matches or smaller findings add up. Otherwise it is <b>No known risks</b>.</p>
<div class="rules-list">{''.join(items)}</div>
</div></section>"""
    page("/rules/", "Rules", f"The {N_RULES} checks Hyniqe Shield runs on AI agent add-ons, with what each means and how to fix it.",
         body, "/rules/")


def about() -> None:
    sample = next(a for a in ADDONS if a["slug"] == "mcp-filesystem")
    body = f"""
<section class="band"><div class="wrap">
<h1>How Shield checks an add-on</h1>
<p class="lede">Shield reads an add-on's files and looks for patterns that let it misuse the access you give your AI. It never runs the code.</p>

<h2 style="margin-top:44px">What it reads</h2>
<p>Skill files (<code>SKILL.md</code> and the scripts that come with them), MCP server source code, MCP configuration files such as <code>claude_desktop_config.json</code> and <code>.cursor/mcp.json</code>, and exported n8n workflows.</p>
<p>For the directory, Shield skips tests, examples, demos, documentation sites and CI files, because they aren't installed on your machine.</p>

<h2 style="margin-top:44px">What it looks for</h2>
<p>Hidden instructions (including text written in invisible Unicode characters), prompt injection and tool poisoning, instructions to send your data elsewhere, reading of keys and credentials, hard-coded secrets, remote shells, scripts piped straight from the internet, packages that aren't pinned to a version, broad file access, privileged containers, tools approved to run without asking, and unprotected webhooks. The full list is on the <a href="/rules/">rules page</a>.</p>

<h2 style="margin-top:44px">How results are worked out</h2>
<p>Each finding has a severity. <b>Dangerous</b> means a critical finding, or two or more different high-severity problems. <b>Caution</b> means a high-severity finding, or several smaller ones that add up. <b>No known risks</b> means nothing matched enough to raise a concern.</p>
<p>Shield was tuned against the real code of every add-on in the directory, so it flags real risks rather than ordinary code. If you find a wrong result, please <a href="{REPO_URL}/issues/new?title=Shield%20wrong%20finding">report it</a>.</p>

<h2 style="margin-top:44px">Limits</h2>
<p>A static check can miss new attack techniques, and it cannot see what a remote server does after you connect. Code changes after a scan. Treat a clear result as one good sign, not a guarantee.</p>

<h2 style="margin-top:44px" id="badges">Badges</h2>
<p>Every add-on in the directory has a badge that links to its full report. Maintainers can copy the Markdown from their report page.</p>
<p><img src="/badge/{sample['slug']}.svg" alt="Hyniqe Shield: no known risks" height="20"></p>

<h2 style="margin-top:44px">Getting an add-on checked</h2>
<p>Open an issue on <a href="{REPO_URL}/issues/new?title=Shield%20scan%20request">GitHub</a> with a link to the repository. You can also run the same check yourself: everything is open source under AGPL-3.0, with a commercial licence for companies that want to build it into their products.</p>
</div></section>"""
    page("/about/", "How it works", "How Hyniqe Shield checks AI agent add-ons, how results are worked out, and its limits.",
         body, "/about/")


def check() -> None:
    examples = [
        ("Malicious skill", "SKILL.md", ROOT / "tests/fixtures/malicious/evil-skill/SKILL.md"),
        ("Poisoned MCP server", "server.py", ROOT / "tests/fixtures/malicious/poisoned_server.py"),
        ("Risky MCP config", "claude_desktop_config.json", ROOT / "tests/fixtures/malicious/claude_desktop_config.json"),
        ("Risky n8n workflow", "workflow.json", ROOT / "tests/fixtures/malicious/n8n-workflow.json"),
        ("Clean MCP config", "mcp.json", ROOT / "tests/fixtures/benign/mcp.json"),
    ]
    payload = {"rules": RULES, "examples": [{"label": l, "name": n, "text": p.read_text("utf-8")} for l, n, p in examples]}
    (DIST / "assets" / "check-data.js").write_text(
        "window.SHIELD_DATA=" + json.dumps(payload, ensure_ascii=True).replace("</", "<\\/") + ";\n", "utf-8")
    body = f"""
<section class="band"><div class="wrap">
<h1>Check a file</h1>
<p class="lede">Paste a skill, an MCP server's code, your MCP config or an n8n workflow. The check runs in your browser and nothing is uploaded.</p>
<div class="checker">
<div>
<div class="examples" id="examples" role="group" aria-label="Load an example"></div>
<div class="drop" id="drop">Drop files or a folder here, or <label for="files" style="text-decoration:underline;cursor:pointer">choose files</label>
<input class="sr" type="file" id="files" multiple></div>
<label class="sr" for="src">Content to check</label>
<textarea id="src" spellcheck="false" placeholder="Paste the add-on here"></textarea>
<div class="row"><label class="sr" for="fname">File name</label><input type="text" id="fname" value="SKILL.md" aria-describedby="fname-help" autocomplete="off" spellcheck="false">
<button class="btn" id="run" type="button">Check it</button></div>
<p class="muted small" id="fname-help">The file name tells Shield what kind of file this is, for example SKILL.md or mcp.json.</p>
</div>
<div id="result" aria-live="polite"></div>
</div>
<div id="findings" style="margin-top:36px"></div>
</div></section>"""
    page("/check/", "Check a file", "Check a Claude skill, MCP server, MCP config or n8n workflow in your browser. Nothing is uploaded.",
         body, "/check/",
         '<script src="/assets/engine.js"></script><script src="/assets/check-data.js"></script><script src="/assets/check.js"></script>')


def not_found() -> None:
    body = """<section class="band"><div class="wrap"><h1>Page not found</h1>
<p class="lede">That address doesn't match a page. The add-on may not be in the directory yet.</p>
<p><a class="btn" href="/directory/">Search the directory</a></p></div></section>"""
    page("/404.html", "Page not found", "Page not found.", body)


def extras() -> None:
    favicon = LOGO.replace('aria-hidden="true"', 'xmlns="http://www.w3.org/2000/svg"')
    (DIST / "favicon.svg").write_text(favicon, "utf-8")
    urls = ["/", "/directory/", "/check/", "/rules/", "/about/"] + [f"/a/{a['slug']}/" for a in ADDONS]
    (DIST / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                      + "".join(f"<url><loc>{BASE_URL}{u}</loc></url>\n" for u in urls) + "</urlset>\n", "utf-8")
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {BASE_URL}/sitemap.xml\n", "utf-8")
    (DIST / "data").mkdir(exist_ok=True)
    shutil.copy(SITE / "data" / "scans.json", DIST / "data" / "scans.json")


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "assets").mkdir(parents=True)
    for f in (SITE / "assets").iterdir():
        shutil.copy(f, DIST / "assets" / f.name)
    shutil.copy(ROOT / "web" / "engine.js", DIST / "assets" / "engine.js")
    home(); directory(); rules_page(); about(); check(); not_found(); extras()
    for a in ADDONS:
        report(a)
        badge(a)
    n = sum(1 for _ in DIST.rglob("*") if _.is_file())
    print(f"built {n} files into {DIST}")


if __name__ == "__main__":
    main()
