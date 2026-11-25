"""Build the Hyniqe Shield website into site/dist.

Reads data/scans.json (written by scan_directory.py), the rules and the browser engine,
and writes plain static HTML. No dependencies beyond the Python standard library.
Run from anywhere: python3 site/build_site.py
"""
from __future__ import annotations

import datetime as dt
import html
import json
import urllib.parse
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
q = urllib.parse.quote
_d = dt.date.fromisoformat(DATA["scanned_on"])
SCANNED_ON = f"{_d.day} {_d.strftime('%B %Y')}"

# The six areas every report is checked against, each made of rule categories.
AREAS = [
    {"key": "hidden", "title": "Hidden instructions", "blurb": "Prompt injection, invisible text, fake system tags, planted memories",
     "categories": ["injection", "hidden-text", "memory"]},
    {"key": "theft", "title": "Data theft", "blurb": "Sending your data out, reading keys and private files",
     "categories": ["exfiltration", "sensitive-access", "combo"]},
    {"key": "secrets", "title": "Exposed secrets", "blurb": "API keys and tokens written into files",
     "categories": ["secrets"]},
    {"key": "exec", "title": "Code execution", "blurb": "Shell commands, remote shells, destructive deletes, startup changes",
     "categories": ["code-execution", "destructive", "persistence"]},
    {"key": "supply", "title": "Supply chain", "blurb": "Unpinned packages, remote servers, encoded blobs, plain http",
     "categories": ["supply-chain", "network", "obfuscation"]},
    {"key": "perms", "title": "Permissions", "blurb": "Auto-approved tools, whole-disk access, privileged containers",
     "categories": ["privilege"]},
]
# GitHub owners that are the company or project behind the product they publish.
OFFICIAL = {"anthropics": "Anthropic", "modelcontextprotocol": "MCP project", "github": "GitHub", "stripe": "Stripe",
            "getsentry": "Sentry", "microsoft": "Microsoft", "cloudflare": "Cloudflare", "makenotion": "Notion",
            "mongodb-js": "MongoDB", "grafana": "Grafana", "hashicorp": "HashiCorp", "heroku": "Heroku",
            "elastic": "Elastic", "redis": "Redis", "neondatabase": "Neon", "upstash": "Upstash",
            "firecrawl": "Firecrawl", "exa-labs": "Exa", "tavily-ai": "Tavily", "browserbase": "Browserbase"}
SUBMIT_URL = (REPO_URL + "/issues/new?title=" + q("Scan request: ") + "&body="
              + q("Link to the repository or folder:\n\nWhat it is (skill, MCP server, n8n workflow):\n\nAre you the maintainer? (yes or no):\n"))
TEAMS_URL = (REPO_URL + "/issues/new?title=" + q("Shield for Teams: early access") + "&body="
             + q("Company:\n\nRoughly how many people use AI agents:\n\nWhat you'd want Shield to do for your team:\n"))


def publisher(a: dict) -> str:
    return OFFICIAL.get(a["repo"].split("/")[0], "")


def area_status(sevs: list[str]) -> tuple[str, str]:
    sev = [s for s in sevs if s != "info"]
    if "critical" in sev:
        return "fail", "Failed"
    if "high" in sev or "medium" in sev:
        return "review", "Review"
    if sev:
        return "note", "Notes only"
    return "pass", "Passed"


def checklist(a: dict) -> str:
    items = []
    for ar in AREAS:
        groups = [g for g in a["groups"] if RULE_INFO[g["rule_id"]]["category"] in ar["categories"]]
        cls, word = area_status([g["severity"] for g in groups])
        n = sum(g["count"] for g in groups if g["severity"] != "info")
        n_rules = sum(1 for r in RULE_INFO.values() if r["category"] in ar["categories"])
        items.append(f'<li class="area a-{cls}"><span class="mark" aria-hidden="true"></span><div><b>{e(ar["title"])}</b>'
                     f'<span class="muted small">{e(ar["blurb"])}. {n_rules} checks.</span></div>'
                     f'<span class="astatus">{word}{f" ({n})" if n else ""}</span></li>')
    return f'<ul class="areas">{"".join(items)}</ul>'


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

LOGO = ('<svg width="18" height="18" viewBox="0 0 26 26" aria-hidden="true"><path d="M13 2 23 6v7c0 6-4.5 9.5-10 11'
        'C7.5 22.5 3 19 3 13V6Z" fill="none" stroke="#9fe3f2" stroke-width="2.4"/></svg>')
FAVICON = ('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#03141a"/>'
           '<path d="M16 5 26 9v7c0 6-4.5 9.5-10 11C10.5 25.5 6 22 6 16V9Z" fill="none" stroke="#9fe3f2" stroke-width="2.6"/></svg>')
NAV = [("/check/", "Check"), ("/directory/", "Directory"), ("/rules/", "Rules"), ("/badges/", "Badges"), ("/about/", "About")]
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400;600&display=swap" rel="stylesheet">')


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
<meta name="theme-color" content="#03141a">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
{FONTS}
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
<a class="brand" href="/">{LOGO}Shield</a>
<nav class="tabs" aria-label="Main">{nav}</nav>
<a class="pill" href="{e(SUBMIT_URL)}">Submit an add-on</a>
</div></header>
<main id="main">
{body}
</main>
<footer class="site-foot"><div class="wrap">
<p>Hyniqe Shield is free and open source (AGPL-3.0), part of <a href="{REPO_URL}">Hyniqe</a>. Rules mapped to the OWASP Top 10 for Agentic Applications 2026.
Static analysis only, so a clean result is a good sign, not a guarantee.</p>
<nav aria-label="Footer"><a href="{REPO_URL}">GitHub</a><a href="/rules/">Rules</a><a href="/badges/">Badges</a><a href="/about/">About</a><a href="{e(SUBMIT_URL)}">Request a scan</a></nav>
</div></footer>
{scripts}
</body>
</html>
"""
    out = DIST / path.lstrip("/") / "index.html" if path.endswith("/") else DIST / path.lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, "utf-8")


def tag(a: dict, heading: str = "p") -> str:
    """The verdict panel shown beside a report."""
    word, cls = VERDICT[a["verdict"]]
    n = findings_total(a)
    pub = publisher(a)
    return f"""<div class="glass verdict-panel v-{cls}">
<div class="issuer">Hyniqe Shield result</div><{heading} class="vword">{word}.</{heading}>
<dl>
<dt>Type</dt><dd>{KIND[a['kind']]}</dd>
<dt>Publisher</dt><dd>{e(pub) + ' <span class="official">Official</span>' if pub else e(a['repo'].split('/')[0])}</dd>
<dt>Source</dt><dd><a href="{gh_tree(a)}">{e(source(a))}</a></dd>
<dt>Commit</dt><dd><code>{a['commit'][:7]}</code></dd>
<dt>Files read</dt><dd>{a['files']:,}</dd>
<dt>Findings</dt><dd>{n if n else 'None'}</dd>
<dt>Risk score</dt><dd>{a['score']} of 100</dd>
<dt>Checked</dt><dd>{e(SCANNED_ON)}, rules {e(DATA['rules_version'])}</dd>
</dl>
<div class="perf">Static check of the code at this commit. Not a guarantee of safety.</div>
</div>"""


def chip(verdict: str) -> str:
    word, cls = VERDICT[verdict]
    return f'<span class="chip v-{cls}">{word}</span>'


# ---------------------------------------------------------------- pages

def _visible(raw: str) -> tuple[str, str]:
    visible = "".join(c for c in raw if not 0xE0000 <= ord(c) <= 0xE007F)
    hidden = "".join(chr(ord(c) - 0xE0000) for c in raw if 0xE0020 <= ord(c) <= 0xE007E)
    return visible, hidden


def slab_html(name: str, text: str, z: int) -> tuple[str, list]:
    """One file of the 3D stack: a window of its lines with flagged lines lit, scanned live at build time."""
    res = Scanner().scan_text(text, name)
    real = [f for f in res.findings if f.severity != "info"]
    sev = {f.severity for f in real}
    cls = "flag-high" if sev & {"critical", "high"} else "flag-med" if "medium" in sev else "flag-low" if sev else ""
    lines = text.rstrip("\n").split("\n")
    hit_lines = {f.line: f.severity for f in real}
    first = min(hit_lines) if hit_lines else 1
    start = max(1, first - 2)
    rows = []
    for i in range(start, min(len(lines), start + 8) + 1):
        vis, hidden = _visible(lines[i - 1])
        vis = vis.strip("\r")
        if len(vis) > 44:
            vis = vis[:43] + "…"
        if hidden:
            vis = (vis[:24] + "…" if len(vis) > 25 else vis) + " [invisible text]"
        txt = f"{i:>2}  {e(vis)}"
        if i in hit_lines:
            med = "" if hit_lines[i] in ("critical", "high") else " med"
            txt = f'<span class="hit{med}">{txt}</span>'
        rows.append(txt)
    body = "\n".join(rows)
    return (f'<div class="slab {cls}" style="transform:translateZ({z}px)"><div class="code"><b>{e(name)}</b>{body}</div></div>', real)


def home() -> None:
    clear = sum(a["verdict"] == "NO_KNOWN_RISKS" for a in ADDONS)
    caution = sum(a["verdict"] == "CAUTION" for a in ADDONS)

    # The hero stack: three clean files and one poisoned skill from Shield's own test suite, scanned at build time.
    runpy.run_path(str(ROOT / "scripts" / "make_fixtures.py"))
    fx = ROOT / "tests" / "fixtures"
    stack = [("README.md", fx / "benign" / "README.md"), ("mcp.json", fx / "benign" / "mcp.json"),
             ("weather_server.py", fx / "benign" / "weather_server.py"), ("SKILL.md", fx / "malicious" / "evil-skill" / "SKILL.md")]
    slabs, poison = [], []
    for i, (name, p) in enumerate(stack):
        html_, real = slab_html(name, p.read_text("utf-8"), i * 78)
        slabs.append(html_)
        if real:
            poison = real
    order = ["critical", "high", "medium", "low"]
    top = sorted(poison, key=lambda f: (order.index(f.severity), f.line))[0]
    skill_lines = (fx / "malicious" / "evil-skill" / "SKILL.md").read_text("utf-8").split("\n")
    hidden = _visible(skill_lines[top.line - 1])[1].strip()
    more = "…" if len(hidden) > 88 else ""
    said = f"Hidden text the AI can read but you can't: “{e(hidden[:88])}{more}”" if hidden else e(top.title)
    n_distinct = len({f.rule_id for f in poison})

    featured = [a for a in ADDONS if a["verdict"] != "NO_KNOWN_RISKS"][:3] + \
               [a for a in ADDONS if a["verdict"] == "NO_KNOWN_RISKS" and publisher(a)][:3]
    rows = "".join(f'<a href="/a/{a["slug"]}/"><span><strong>{e(label(a))}</strong><small>{KIND[a["kind"]]}, '
                   f'{a["files"]:,} files{", " + e(publisher(a)) if publisher(a) else ""}</small></span>{chip(a["verdict"])}</a>' for a in featured)
    areas = "".join(f'<div class="feature"><h3>{e(ar["title"])}</h3><p>{e(ar["blurb"])}.</p></div>' for ar in AREAS)
    sample = next(a for a in ADDONS if a["slug"] == "mcp-time")

    body = f"""
<section class="hero center"><div class="wrap">
<p class="eyebrow">Hyniqe Shield</p>
<h1>Scanned before it runs.</h1>
<p class="lede">A security check for Claude skills, MCP servers and n8n workflows. Every line. In your browser.</p>
<form class="find" action="/check/" method="get">
<label class="sr" for="url">GitHub link to an add-on</label>
<input id="url" name="url" type="text" inputmode="url" spellcheck="false" placeholder="Paste a GitHub link" autocomplete="off" required>
<button class="btn" type="submit">Check</button>
</form>
<p class="alt"><a href="/directory/">Or browse {len(ADDONS)} checked add-ons</a></p>
</div></section>

<section class="stage" role="img" aria-label="Four files from Shield's test suite stacked in 3D while a scan beam passes through them. The poisoned SKILL.md is flagged.">
<div class="rig">{''.join(slabs)}<div class="beam"></div></div>
<div class="callout"><b>Dangerous. SKILL.md, line {top.line}.</b><span>{said}</span>
<small>{n_distinct} different rules matched this file. It's a test file from Shield's own suite.</small></div>
</section>

<div class="wrap"><div class="stats">
<div class="stat"><b>{N_RULES}</b><span>open detection rules</span></div>
<div class="stat"><b>{len(ADDONS)}</b><span>add-ons in the directory</span></div>
<div class="stat"><b>300</b><span>files per check, at most</span></div>
<div class="stat"><b>0</b><span>files sent to our servers</span></div>
</div></div>

<section class="band light"><div class="wrap">
<h2 class="center">Six areas.<br><span style="color:#5d7f89">One verdict.</span></h2>
<div class="grid wide" style="margin-top:64px">{areas}</div>
<div class="grid" style="margin-top:72px">
<div class="card"><div class="big-word t-clear">No known risks.</div><p>None of the {N_RULES} rules matched enough to raise a concern.</p></div>
<div class="card"><div class="big-word t-caution">Caution.</div><p>A serious finding, or smaller ones that add up. Read them first.</p></div>
<div class="card"><div class="big-word t-danger">Dangerous.</div><p>A critical finding, or two different serious ones. Don't install it.</p></div>
</div>
</div></section>

<section class="band"><div class="wrap">
<div class="head-row"><h2>Already checked.</h2><a href="/directory/">See all {len(ADDONS)} add-ons</a></div>
<div class="list">{rows}</div>
<p class="dim small" style="margin-top:18px">{clear} with no known risks and {caution} to review, checked on {SCANNED_ON}.</p>
</div></section>

<section class="band tight"><div class="wrap">
<h2 class="center" style="margin-bottom:56px">Made for three kinds of people.</h2>
<div class="grid">
<div class="card"><h3>You install add-ons</h3><p>Paste a link before you add a skill or MCP server to Claude, Cursor or your own agent. Check the ones you already use from the terminal.</p>
<pre class="cmd"><code>python3 -m hyniqe_shield scan ~/.cursor/mcp.json</code></pre></div>
<div class="card"><h3>You build add-ons</h3><p>Run Shield on every pull request and show the badge on your README.</p>
<pre class="cmd"><code>- uses: HiteshChakravarti/Hyniqe/shield@main
  with:
    fail-on: dangerous</code></pre></div>
<div class="card"><h3>You run a team</h3><p>Shield for Teams will add an approved list, checks on every new install, and alerts when an approved add-on changes. In development.</p>
<p><a href="{e(TEAMS_URL)}">Join the early list</a></p></div>
</div>
</div></section>

<section class="band"><div class="wrap" style="display:flex;flex-wrap:wrap;align-items:center;gap:48px">
<div style="flex:1 1 380px">
<h2 style="font-size:clamp(32px,4vw,48px)">Built an add-on?<br><span class="dim">Show it's been checked.</span></h2>
<p class="muted" style="margin-top:18px;font-size:17px">Every add-on in the directory gets a badge that links to its public report.</p>
<a class="btn ghost" href="/badges/" style="margin-top:8px">Get your badge</a>
</div>
<div class="glass" style="flex:1 1 380px;padding:36px;display:grid;gap:18px">
<img src="/badge/{sample['slug']}.svg" alt="Hyniqe Shield: no known risks" height="28" style="height:28px;width:auto">
<code style="color:#87b1bc;font-size:13px;line-height:1.6;overflow-wrap:anywhere">[![Hyniqe Shield]({BASE_URL}/badge/{sample['slug']}.svg)]({BASE_URL}/a/{sample['slug']}/)</code>
</div>
</div></section>
"""
    page("/", "Hyniqe Shield: check AI agent add-ons before you install them",
         "Free, open-source safety checks for Claude skills, MCP servers and n8n workflows. See what an add-on could do with your data before you install it.",
         body, "/")


def directory() -> None:
    rank = {"DANGEROUS": 0, "CAUTION": 1, "NO_KNOWN_RISKS": 2}
    rows = []
    for a in sorted(ADDONS, key=lambda a: (rank[a["verdict"]], -findings_total(a), label(a).lower())):
        pub = publisher(a)
        search = " ".join([a["name"], a["repo"], a["sub"], a["description"], KIND[a["kind"]], pub]).lower()
        badge_html = f' <span class="official" title="Published by {e(pub)}">Official</span>' if pub else ""
        rows.append(f'<tr data-kind="{a["kind"]}" data-verdict="{a["verdict"]}" data-pub="{"official" if pub else "other"}" '
                    f'data-rank="{rank[a["verdict"]]}" data-findings="{findings_total(a)}" data-files="{a["files"]}" '
                    f'data-name="{e(label(a).lower())}" data-s="{e(search)}">'
                    f'<td><a class="name" href="/a/{a["slug"]}/">{e(label(a))}</a>{badge_html}'
                    f'<span class="desc">{e(a["description"]) if a["description"] else e(source(a))}</span></td>'
                    f'<td class="hide-sm"><a href="{gh_tree(a)}">{e(a["repo"])}</a></td>'
                    f'<td class="hide-sm">{KIND[a["kind"]]}</td><td>{chip(a["verdict"])}</td>'
                    f'<td class="num">{findings_total(a) or "None"}</td></tr>')

    def chips(field: str, label_text: str, options: list) -> str:
        btns = "".join(f'<button type="button" data-f="{field}" data-v="{v}" aria-pressed="false">{e(t)} <span class="n"></span></button>'
                       for v, t in options)
        return f'<div class="chip-row" role="group" aria-label="{e(label_text)}"><span class="chip-label">{e(label_text)}</span>{btns}</div>'

    body = f"""
<section class="band"><div class="wrap">
<h1>Directory.</h1>
<p class="lede" style="margin-top:20px">{len(ADDONS)} skills and MCP servers, each checked at a recorded commit. Open one to see its safety checklist, every finding, and the exact line each came from.</p>
<p class="small dim">Last checked on {SCANNED_ON} with rules version {e(DATA['rules_version'])}. <a href="{e(SUBMIT_URL)}">Submit an add-on</a> to have it checked.</p>
<div class="filters">
<label>Search<input id="fq" type="search" placeholder="Name, repo, publisher or purpose" autocomplete="off"></label>
<label>Sort by<select id="fs"><option value="risk">Riskiest first</option><option value="name">Name, A to Z</option><option value="findings">Most findings</option><option value="files">Largest (files read)</option></select></label>
</div>
<div class="chips">
{chips("verdict", "Result", [("", "All"), ("NO_KNOWN_RISKS", "No known risks"), ("CAUTION", "Caution"), ("DANGEROUS", "Dangerous")])}
{chips("kind", "Type", [("", "All"), ("skill", "Skills"), ("mcp", "MCP servers")])}
{chips("pub", "Publisher", [("", "Anyone"), ("official", "Official only")])}
</div>
<p class="count" id="fc" aria-live="polite">{len(ADDONS)} add-ons</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Add-on</th><th scope="col" class="hide-sm">Repository</th><th scope="col" class="hide-sm">Type</th><th scope="col">Result</th><th scope="col" class="num">Findings</th></tr></thead>
<tbody id="rows">{''.join(rows)}</tbody></table></div>
<p class="dim small" style="margin-top:16px">"Official" means the add-on is published by the company or project behind the product. Maintain an add-on listed here? <a href="{REPO_URL}/issues/new?title=Shield%20re-check%20request">Request a re-check</a>.</p>
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
        reasons = [(lambda t: t[0].lower() + t[1:])(RULE_INFO[g["rule_id"]]["title"]) for g in real if g["severity"] in ("critical", "high", "medium")]
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
        info_html = "<h2 class='section-title'>For your information</h2><p class='muted'>Not risks on their own, but worth knowing.</p>" + "".join(group_html(g) for g in info)
    badge_md = f"[![Hyniqe Shield: {word}]({BASE_URL}/badge/{a['slug']}.svg)]({BASE_URL}/a/{a['slug']}/)"
    body = f"""
<section class="band"><div class="wrap">
<p class="crumbs"><a href="/directory/">Directory</a> / {KIND[a['kind']]}</p>
<div class="report">
<aside>{tag(a, heading="h2")}
<div class="glass snippet">
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
<p class="summary">{e(summary)}</p>
<h2 class="section-title">Safety checklist</h2>
{checklist(a)}
<h2 class="section-title">Findings</h2>
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


def badge_svg(right: str, color: str) -> str:
    left = "Hyniqe Shield"
    lw, rw = int(len(left) * 6.6 + 14), int(len(right) * 6.6 + 14)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{lw + rw}" height="20" role="img" aria-label="{left}: {right}">
<title>{left}: {right}</title>
<clipPath id="r"><rect width="{lw + rw}" height="20" rx="4"/></clipPath>
<g clip-path="url(#r)"><rect width="{lw}" height="20" fill="#0d2f3a"/><rect x="{lw}" width="{rw}" height="20" fill="{color}"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">
<text x="{lw / 2}" y="14">{left}</text><text x="{lw + rw / 2}" y="14">{right}</text></g></svg>
"""


def badge(a: dict) -> None:
    word, cls = VERDICT[a["verdict"]]
    colors = {"clear": "#0b7f5c", "caution": "#b56d00", "danger": "#d4145a"}
    out = DIST / "badge" / f"{a['slug']}.svg"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(badge_svg(word.lower(), colors[cls]), "utf-8")


def rules_page() -> None:
    items = []
    order = ["critical", "high", "medium", "low", "info"]
    for r in sorted(RULE_INFO.values(), key=lambda r: (order.index(r["severity"]), r["id"])):
        owasp = ", ".join(f'{o} {RULES["owasp"].get(o, "")}' for o in r["owasp"])
        items.append(f"""<div class="rule" id="{r['id']}"><div><div class="id">{r['id']}</div><span class="sev sev-{r['severity']}">{r['severity'].capitalize()}</span></div>
<div><h3>{e(r['title'])}</h3><p>{e(r['explain'])}</p><p><b>What to do:</b> {e(r['fix'])}</p><p class="owasp">OWASP: {e(owasp)}</p></div></div>""")
    body = f"""
<section class="band"><div class="wrap">
<h1>Rules.</h1>
<p class="lede" style="margin-top:20px">The {N_RULES} checks Shield runs, ordered by severity, each mapped to the OWASP Top 10 for Agentic Applications 2026. Rules version {e(RULES['version'])}.</p>
<p class="muted">A result is <b>Dangerous</b> when any critical rule matches, or two or more different high-severity rules do. It is <b>Caution</b> when a high-severity rule matches or smaller findings add up. Otherwise it is <b>No known risks</b>.</p>
<div class="rules-list">{''.join(items)}</div>
</div></section>"""
    page("/rules/", "Rules", f"The {N_RULES} checks Hyniqe Shield runs on AI agent add-ons, with what each means and how to fix it.",
         body, "/rules/")


def about() -> None:
    body = f"""
<section class="band"><div class="wrap prose">
<h1>How it works.</h1>
<p class="lede" style="margin-top:20px">Shield reads an add-on's files and looks for patterns that let it misuse the access you give your AI. It never runs the code.</p>

<h2>What it reads</h2>
<p>Skill files (<code>SKILL.md</code> and the scripts that come with them), MCP server source code, MCP configuration files such as <code>claude_desktop_config.json</code> and <code>.cursor/mcp.json</code>, and exported n8n workflows.</p>
<p>Shield skips tests, examples, demos, documentation sites and CI files, because they aren't installed on your machine.</p>

<h2>What it looks for</h2>
<p>Hidden instructions (including text written in invisible Unicode characters), prompt injection and tool poisoning, instructions to send your data elsewhere, reading of keys and credentials, hard-coded secrets, remote shells, scripts piped straight from the internet, packages that aren't pinned to a version, broad file access, privileged containers, tools approved to run without asking, and unprotected webhooks. All {N_RULES} checks are on the <a href="/rules/">rules page</a>.</p>

<h2>How results are worked out</h2>
<p>Each finding has a severity. <b>Dangerous</b> means a critical finding, or two or more different high-severity problems. <b>Caution</b> means a high-severity finding, or several smaller ones that add up. <b>No known risks</b> means nothing matched enough to raise a concern.</p>
<p>Shield was tuned against the real code of every add-on in the directory, so it flags real risks rather than ordinary code. If you find a wrong result, please <a href="{REPO_URL}/issues/new?title=Shield%20wrong%20finding">report it</a>.</p>

<h2>Privacy</h2>
<p>When you check a link, your browser fetches the files straight from GitHub and runs the rules on your device. Nothing is sent to us. GitHub allows about 60 lookups an hour without signing in, so very large repositories can hit that limit.</p>

<h2>Limits</h2>
<p>A static check can miss new attack techniques, and it cannot see what a remote server does after you connect. Code changes after a scan. Treat a clear result as one good sign, not a guarantee.</p>

<h2>Getting an add-on checked</h2>
<p>Open an issue on <a href="{e(SUBMIT_URL)}">GitHub</a> with a link to the repository. You can also run the same check yourself: everything is open source under AGPL-3.0, with a commercial licence for companies that want to build it into their products.</p>
</div></section>"""
    page("/about/", "How it works", "How Hyniqe Shield checks AI agent add-ons, how results are worked out, and its limits.",
         body, "/about/")


def badges_page() -> None:
    sample = next(a for a in ADDONS if a["slug"] == "mcp-time")
    md = f"[![Hyniqe Shield]({BASE_URL}/badge/{sample['slug']}.svg)]({BASE_URL}/a/{sample['slug']}/)"
    html_snip = f'<a href="{BASE_URL}/a/{sample["slug"]}/"><img src="{BASE_URL}/badge/{sample["slug"]}.svg" alt="Hyniqe Shield result"></a>'
    body = f"""
<section class="hero center"><div class="wrap">
<h1>Show it's been checked.</h1>
<p class="lede">A badge for your README. It shows your add-on's Shield result and links to the full public report.</p>
</div></section>
<div class="wrap badge-row" aria-label="The three possible badges">
<img src="/assets/badge-clear.svg" alt="Hyniqe Shield: no known risks"><img src="/assets/badge-caution.svg" alt="Hyniqe Shield: caution"><img src="/assets/badge-danger.svg" alt="Hyniqe Shield: dangerous">
</div>

<section class="band light" style="margin-top:56px"><div class="wrap">
<h2 class="center">Three steps.</h2>
<ol class="grid" style="list-style:none;margin:56px 0 0;padding:0">
<li class="card"><div class="big-word" style="color:#5d7f89">1</div><h3 style="margin-top:10px">Get listed</h3><p>Find your add-on in the <a href="/directory/">directory</a>. Not there yet? <a href="{e(SUBMIT_URL)}">Submit it</a> and we'll add it on the next scan.</p></li>
<li class="card"><div class="big-word" style="color:#5d7f89">2</div><h3 style="margin-top:10px">Copy the snippet</h3><p>Every report page has its own badge code, ready to copy.</p></li>
<li class="card"><div class="big-word" style="color:#5d7f89">3</div><h3 style="margin-top:10px">Paste it in your README</h3><p>It shows at the top of your repository and links people to your report.</p></li>
</ol>
</div></section>

<section class="band"><div class="wrap">
<h2 style="font-size:32px;margin-bottom:8px">Badge code</h2>
<p class="dim">Example for <a href="/a/{sample['slug']}/">{e(label(sample))}</a>. Your report page has yours.</p>
<div class="glass codebox" style="margin-top:20px">
<div class="seg" role="tablist" aria-label="Format"><button type="button" role="tab" aria-selected="true" data-fmt="badge-md">Markdown</button><button type="button" role="tab" aria-selected="false" data-fmt="badge-html">HTML</button></div>
<div class="body">
<label class="sr" for="badge-md">Badge Markdown</label><textarea id="badge-md" readonly>{e(md)}</textarea>
<label class="sr" for="badge-html">Badge HTML</label><textarea id="badge-html" readonly hidden>{e(html_snip)}</textarea>
<button class="btn" type="button" data-copy="badge-md" id="copy-btn">Copy code</button>
</div>
</div>
<p class="status" id="copy-status" aria-live="polite"></p>
<div class="grid wide" style="margin-top:56px">
<div class="feature"><h3>What it means</h3><p>The result of Shield's {N_RULES} rules at the commit we last checked. The report shows that commit and the date.</p></div>
<div class="feature"><h3>Got caution?</h3><p>Open your report, fix or explain each finding, then <a href="{REPO_URL}/issues/new?title=Shield%20re-check%20request">ask for a re-check</a>.</p></div>
<div class="feature"><h3>What it doesn't mean</h3><p>It's not a certificate. Shield reads files and doesn't run them, so a clean badge is a good sign, not a guarantee.</p></div>
</div>
</div></section>"""
    page("/badges/", "Badges", "Add a Hyniqe Shield badge to your README. It shows your add-on's result and links to the full report.",
         body, "/badges/", '<script src="/assets/copy.js"></script>')


def check() -> None:
    examples = [
        ("Malicious skill", "SKILL.md", ROOT / "tests/fixtures/malicious/evil-skill/SKILL.md"),
        ("Poisoned MCP server", "server.py", ROOT / "tests/fixtures/malicious/poisoned_server.py"),
        ("Risky MCP config", "claude_desktop_config.json", ROOT / "tests/fixtures/malicious/claude_desktop_config.json"),
        ("Risky n8n workflow", "workflow.json", ROOT / "tests/fixtures/malicious/n8n-workflow.json"),
        ("Clean MCP config", "mcp.json", ROOT / "tests/fixtures/benign/mcp.json"),
    ]
    directory_index = [{"slug": a["slug"], "match": (a["repo"] + ("/" + a["sub"] if a["sub"] else "")).lower()} for a in ADDONS]
    payload = {"rules": RULES, "areas": AREAS, "excludes": DATA["excludes"], "directory": directory_index,
               "examples": [{"label": l, "name": n, "text": p.read_text("utf-8")} for l, n, p in examples]}
    (DIST / "assets" / "check-data.js").write_text(
        "window.SHIELD_DATA=" + json.dumps(payload, ensure_ascii=True).replace("</", "<\\/") + ";\n", "utf-8")
    body = f"""
<section class="check-head"><div class="wrap">
<div id="intro" class="center">
<h1 style="font-size:clamp(44px,7vw,88px)">Check an add-on.</h1>
<p class="lede" style="margin-top:20px">Paste a GitHub link to a skill, MCP server or n8n workflow. Your browser fetches the files from GitHub and checks them here. Nothing is uploaded.</p>
</div>
<form class="find" id="gh-form">
<label class="sr" for="gh">GitHub link</label>
<input id="gh" name="url" type="text" inputmode="url" spellcheck="false" placeholder="github.com/owner/repo, or a folder or file inside it" autocomplete="off" required>
<button class="btn" type="submit" id="gh-btn">Check</button>
</form>
<p class="status center" id="gh-status" aria-live="polite"></p>

<div class="scan-layout" id="scan" hidden>
<div class="stage live" id="stage" role="img" aria-label="The add-on's files as a 3D stack, lit up as they are checked"><div class="rig" id="rig"><div class="beam" id="beam"></div></div></div>
<div class="live-panel" id="live">
<div><p class="live-dot" id="live-label">Checking</p><p class="live-count" id="live-count">0 files</p><div class="bar"><i id="bar"></i></div>
<p class="dim small" style="margin-top:12px" id="where"></p></div>
<div class="tally"><div><b id="t-high" class="t-danger">0</b><span>critical or high</span></div><div><b id="t-med" class="t-caution">0</b><span>medium</span></div><div><b id="t-low">0</b><span>low</span></div></div>
<ol class="log" id="log"></ol>
</div>
</div>

<div class="results" id="results" hidden>
<div class="result-head" id="result"></div>
<div id="findings"></div>
<div class="note"><p>Shield reads the files, it doesn't run them. A result shows what the {N_RULES} rules found at this commit, not a guarantee.</p>
<p><a href="{REPO_URL}/issues/new?title=Shield%20wrong%20finding">Report a wrong result</a></p></div>
</div>

<details class="paste" id="paste">
<summary>Or paste a file, drop a folder, or try an example</summary>
<div class="checker">
<div class="examples" id="examples" role="group" aria-label="Load an example"></div>
<div class="drop" id="drop">Drop files or a folder here, or <label for="files">choose files</label>
<input class="sr" type="file" id="files" multiple></div>
<label class="sr" for="src">Content to check</label>
<textarea id="src" spellcheck="false" placeholder="Paste the add-on here"></textarea>
<div class="row"><label class="sr" for="fname">File name</label><input type="text" id="fname" value="SKILL.md" aria-describedby="fname-help" autocomplete="off" spellcheck="false">
<button class="btn" id="run" type="button">Check it</button></div>
<p class="dim small" id="fname-help">The file name tells Shield what kind of file this is, for example SKILL.md or mcp.json.</p>
</div>
</details>
</div></section>
<div style="height:80px"></div>"""
    page("/check/", "Check an add-on", "Check a Claude skill, MCP server, MCP config or n8n workflow from a GitHub link or a file, in your browser. Nothing is uploaded.",
         body, "/check/",
         '<script src="/assets/engine.js"></script><script src="/assets/check-data.js"></script><script src="/assets/check.js"></script>')


def not_found() -> None:
    body = """<section class="band"><div class="wrap"><h1>Page not found.</h1>
<p class="lede" style="margin-top:20px">That address doesn't match a page. The add-on may not be in the directory yet.</p>
<p><a class="btn" href="/directory/">Search the directory</a></p></div></section>"""
    page("/404.html", "Page not found", "Page not found.", body)


def extras() -> None:
    (DIST / "favicon.svg").write_text(FAVICON, "utf-8")
    colors = {"clear": ("no known risks", "#0b7f5c"), "caution": ("caution", "#b56d00"), "danger": ("dangerous", "#d4145a")}
    for k, (w, c) in colors.items():
        (DIST / "assets" / f"badge-{k}.svg").write_text(badge_svg(w, c), "utf-8")
    urls = ["/", "/directory/", "/check/", "/rules/", "/badges/", "/about/"] + [f"/a/{a['slug']}/" for a in ADDONS]
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
    home(); directory(); rules_page(); about(); badges_page(); check(); not_found(); extras()
    for a in ADDONS:
        report(a)
        badge(a)
    n = sum(1 for _ in DIST.rglob("*") if _.is_file())
    print(f"built {n} files into {DIST}")


if __name__ == "__main__":
    main()
