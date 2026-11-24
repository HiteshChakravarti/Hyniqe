"""Hyniqe Shield scanning engine.

Static analysis only: Hyniqe Shield reads files and never executes them.
"""
from __future__ import annotations

import fnmatch
import json
import os
import re
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Iterable

RULES_PATH = Path(__file__).with_name("rules.json")

MAX_FILE_BYTES = 2_000_000
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".tox"}
TEXT_EXTS = {
    ".md", ".markdown", ".txt", ".json", ".jsonc", ".yaml", ".yml", ".toml", ".ini", ".cfg",
    ".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".sh", ".bash", ".zsh", ".ps1",
    ".rb", ".go", ".rs", ".java", ".kt", ".php", ".env", ".html", ".xml", "",
}
CODE_EXTS = {".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".sh", ".bash", ".zsh", ".ps1",
             ".rb", ".go", ".rs", ".java", ".kt", ".php"}
IGNORE_FILE = ".hyniqeshieldignore"
INLINE_IGNORE = re.compile(r"hyniqe-shield:\s*ignore(?:\s+(HS-[A-Z0-9-]+(?:\s*,\s*HS-[A-Z0-9-]+)*))?", re.I)

SEVERITY_ORDER = ["info", "low", "medium", "high", "critical"]

SECRET_NAME = re.compile(r"(token|secret|password|passwd|api[_-]?key|apikey|access[_-]?key|private[_-]?key|auth|bearer|credential)", re.I)
PLACEHOLDER = re.compile(r"\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]{2,}\b|\$env:|\{\{.*\}\}|^\s*$|^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?$|^\$\{\{.*\}\}$|^<.*>$|^(your|xxx|changeme|replace|example|placeholder|todo|\*+)", re.I)


@dataclass
class Finding:
    rule_id: str
    title: str
    severity: str
    category: str
    owasp: list[str]
    file: str
    line: int
    evidence: str
    explain: str
    fix: str
    detail: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class FileResult:
    path: str
    kind: str
    findings: list[Finding] = field(default_factory=list)
    score: int = 0
    verdict: str = "NO_KNOWN_RISKS"


@dataclass
class ScanResult:
    target: str
    files: list[FileResult]
    findings: list[Finding]
    score: int
    verdict: str
    rules_version: str

    def counts(self) -> dict[str, int]:
        c = {s: 0 for s in SEVERITY_ORDER}
        for f in self.findings:
            c[f.severity] += 1
        return c

    def to_dict(self) -> dict:
        return {
            "tool": "hyniqe-shield",
            "rules_version": self.rules_version,
            "target": self.target,
            "verdict": self.verdict,
            "score": self.score,
            "counts": self.counts(),
            "files_scanned": len(self.files),
            "files": [{"path": fr.path, "kind": fr.kind, "verdict": fr.verdict, "score": fr.score,
                       "findings": len(fr.findings)} for fr in self.files],
            "findings": [f.to_dict() for f in self.findings],
        }


def load_rules(path: Path = RULES_PATH) -> dict:
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    for rule in data["rules"]:
        flags = re.M
        if "i" in rule.get("flags", ""):
            flags |= re.I
        rule["_re"] = re.compile(rule["pattern"], flags)
        rule["_not"] = re.compile(rule["not_if_line"], re.I) if rule.get("not_if_line") else None
    return data


# ---------------------------------------------------------------- file typing

def detect_kind(name: str, text: str) -> tuple[str, object]:
    """Return (kind, parsed_json_or_None)."""
    base = os.path.basename(name).lower()
    ext = os.path.splitext(base)[1]
    parsed = None
    if ext in (".json", ".jsonc") or text.lstrip().startswith("{"):
        try:
            parsed = json.loads(_strip_json_comments(text) if ext == ".jsonc" else text)
        except (ValueError, RecursionError):
            parsed = None
        if isinstance(parsed, dict):
            if _mcp_servers(parsed) is not None:
                return "mcp_config", parsed
            if isinstance(parsed.get("nodes"), list) and "connections" in parsed:
                return "n8n", parsed
    if base == "skill.md":
        return "skill", None
    if ext in (".md", ".markdown"):
        return "markdown", None
    if ext in CODE_EXTS:
        return "code", None
    return "text", parsed


def _strip_json_comments(text: str) -> str:
    return re.sub(r"(?m)^\s*//.*$", "", text)


def _mcp_servers(data: dict):
    if isinstance(data.get("mcpServers"), dict):
        return data["mcpServers"]
    if isinstance(data.get("servers"), dict) and any(
        isinstance(v, dict) and ("command" in v or "url" in v) for v in data["servers"].values()
    ):
        return data["servers"]
    mcp = data.get("mcp")
    if isinstance(mcp, dict) and isinstance(mcp.get("servers"), dict):
        return mcp["servers"]
    return None


# ---------------------------------------------------------------- helpers

def _line_of(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def _line_text(text: str, line: int) -> str:
    lines = text.splitlines()
    return lines[line - 1] if 0 < line <= len(lines) else ""


def _snippet(text: str, start: int, end: int, mask: bool = False) -> str:
    match = text[start:end]
    if mask:
        match = match[:6] + "…" + "*" * 6 if len(match) > 8 else "*" * len(match)
    match = match.replace("\n", " ")
    if len(match) > 160:
        match = match[:157] + "..."
    return match


def mask_value(value: str) -> str:
    return value[:4] + "…" + "*" * 6 if len(value) > 6 else "*" * len(value)


def _ignored(line_text: str, rule_id: str) -> bool:
    m = INLINE_IGNORE.search(line_text)
    if not m:
        return False
    if not m.group(1):
        return True
    return rule_id.upper() in {r.strip().upper() for r in m.group(1).split(",")}


# ---------------------------------------------------------------- scanner

class Scanner:
    def __init__(self, rules: dict | None = None):
        self.rules = rules or load_rules()
        self.srules = self.rules["structural_rules"]
        self.weights = self.rules["severity_weights"]

    # ---- public API
    def scan_text(self, text: str, name: str = "input.txt") -> FileResult:
        kind, parsed = detect_kind(name, text)
        fr = FileResult(path=name, kind=kind)
        fr.findings.extend(self._regex_rules(text, name, kind))
        fr.findings.extend(self._unicode(text, name))
        if kind == "mcp_config":
            fr.findings.extend(self._mcp(parsed, text, name))
        elif kind == "n8n":
            fr.findings.extend(self._n8n(parsed, text, name))
        elif kind in ("skill", "markdown"):
            fr.findings.extend(self._skill_frontmatter(text, name))
        fr.findings.extend(self._combos(fr.findings, name))
        seen, kept = set(), []
        for f in fr.findings:
            key = (f.rule_id, f.line, f.evidence)
            if key in seen or _ignored(_line_text(text, f.line), f.rule_id):
                continue
            seen.add(key)
            kept.append(f)
        fr.findings = kept
        fr.score, fr.verdict = self._score(kept)
        return fr

    def scan_path(self, target: str, excludes: Iterable[str] = ()) -> ScanResult:
        root = Path(target)
        excludes = list(excludes) + _read_ignore_file(root)
        files: list[FileResult] = []
        for path in _iter_files(root, excludes):
            try:
                if path.stat().st_size > MAX_FILE_BYTES:
                    continue
                raw = path.read_bytes()
            except OSError:
                continue
            if b"\x00" in raw[:4096]:
                continue  # binary
            text = raw.decode("utf-8", errors="replace")
            rel = str(path.relative_to(root)) if root.is_dir() else path.name
            files.append(self.scan_text(text, rel))
        return self.summarise(target, files)

    def summarise(self, target: str, files: list[FileResult]) -> ScanResult:
        findings = [f for fr in files for f in fr.findings]
        findings.sort(key=lambda f: (-SEVERITY_ORDER.index(f.severity), f.file, f.line))
        score, verdict = self._score(findings)
        return ScanResult(target, files, findings, score, verdict, self.rules["version"])

    # ---- scoring
    def _score(self, findings: list[Finding]) -> tuple[int, str]:
        seen: dict[str, int] = {}
        total = 0
        for f in findings:
            key = f.rule_id  # repeats of a rule anywhere in the target add less
            n = seen.get(key, 0)
            w = self.weights[f.severity]
            if w:
                total += w if n == 0 else (max(1, w // 4) if n < 5 else 0)
            seen[key] = n + 1
        score = min(100, total)
        sev = {f.severity for f in findings}
        high_rules = {f.rule_id for f in findings if f.severity == "high"}
        if "critical" in sev or len(high_rules) >= 2:
            verdict = "DANGEROUS"
        elif "high" in sev or score >= 10:
            verdict = "CAUTION"
        else:
            verdict = "NO_KNOWN_RISKS"
        return score, verdict

    # ---- finding factories
    def _rule_finding(self, rule: dict, name: str, line: int, evidence: str, detail: str = "") -> Finding:
        return Finding(rule["id"], rule["title"], rule["severity"], rule["category"], rule["owasp"],
                       name, line, evidence, rule["explain"], rule["fix"], detail)

    def _s(self, rid: str, name: str, line: int, evidence: str, detail: str = "") -> Finding:
        r = self.srules[rid]
        return Finding(rid, r["title"], r["severity"], r["category"], r["owasp"], name, line,
                       evidence, r["explain"], r["fix"], detail)

    # ---- regex rules
    def _regex_rules(self, text: str, name: str, kind: str) -> list[Finding]:
        out = []
        for rule in self.rules["rules"]:
            if kind not in rule["applies_to"]:
                continue
            hits = 0
            for m in rule["_re"].finditer(text):
                if rule["_not"] is not None and rule["_not"].search(_line_text(text, _line_of(text, m.start()))):
                    continue  # the line negates or explains the pattern, e.g. "never ... without consent"
                hits += 1
                if hits > 20:
                    break
                out.append(self._rule_finding(rule, name, _line_of(text, m.start()),
                                              _snippet(text, m.start(), m.end(), rule.get("mask", False))))
        return out

    # ---- unicode
    def _unicode(self, text: str, name: str) -> list[Finding]:
        out = []
        tag_runs: list[tuple[int, str]] = []
        cur_start, cur = None, []
        zw_lines, bidi_lines = set(), set()
        for i, ch in enumerate(text):
            cp = ord(ch)
            if 0xE0000 <= cp <= 0xE007F:
                if cur_start is None:
                    cur_start = i
                if 0xE0020 <= cp <= 0xE007E:
                    cur.append(chr(cp - 0xE0000))
                continue
            if cur_start is not None:
                tag_runs.append((cur_start, "".join(cur)))
                cur_start, cur = None, []
            if cp in (0x200B, 0x200C, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064) or (cp == 0xFEFF and i > 0):
                zw_lines.add(_line_of(text, i))
            elif 0x202A <= cp <= 0x202E or 0x2066 <= cp <= 0x2069:
                bidi_lines.add(_line_of(text, i))
        if cur_start is not None:
            tag_runs.append((cur_start, "".join(cur)))
        for start, decoded in tag_runs:
            out.append(self._s("HS-UNI-001", name, _line_of(text, start), "(invisible characters)",
                               f"Hidden text decodes to: \"{decoded[:300]}\""))
            # hidden text may itself carry injection: scan it
            for f in self._regex_rules(decoded, name, "text"):
                f.line = _line_of(text, start)
                f.detail = "Found inside hidden invisible text."
                out.append(f)
        for ln in sorted(zw_lines)[:20]:
            out.append(self._s("HS-UNI-002", name, ln, "(zero-width characters)"))
        for ln in sorted(bidi_lines)[:20]:
            out.append(self._s("HS-UNI-003", name, ln, "(direction-override characters)"))
        return out

    # ---- combos
    def _combos(self, findings: list[Finding], name: str) -> list[Finding]:
        cats = {f.category for f in findings}
        if "sensitive-access" in cats and "exfiltration" in cats:
            line = min(f.line for f in findings if f.category in ("sensitive-access", "exfiltration"))
            return [self._s("HS-COMBO-001", name, line, "sensitive access + outbound data",
                            "Both a sensitive-data access and a data-sending pattern were found in this file.")]
        return []

    # ---- skills
    def _skill_frontmatter(self, text: str, name: str) -> list[Finding]:
        m = re.match(r"\A---\s*\n(.*?)\n---", text, re.S)
        if not m:
            return []
        fm = m.group(1)
        at = re.search(r"(?im)^allowed-tools\s*:\s*(.+)$", fm)
        if at and re.search(r"(?<![\w(])Bash(?!\s*\()", at.group(1)):
            return [self._s("HS-SKILL-001", name, _line_of(text, m.start(1) + at.start()), at.group(0).strip()[:160])]
        return []

    # ---- MCP configs
    def _mcp(self, data: dict, text: str, name: str) -> list[Finding]:
        out = []
        servers = _mcp_servers(data) or {}
        for sname, cfg in servers.items():
            if not isinstance(cfg, dict):
                continue
            line = _find_line(text, f'"{sname}"')
            command = str(cfg.get("command", ""))
            args = [str(a) for a in cfg.get("args", []) if isinstance(a, (str, int, float))]
            cmd_base = os.path.basename(command).lower().replace(".cmd", "").replace(".exe", "")
            # unpinned packages
            if cmd_base in ("npx", "bunx", "pnpx") or (cmd_base in ("pnpm", "yarn") and args[:1] == ["dlx"]):
                pkg = _first_positional(args[1:] if cmd_base in ("pnpm", "yarn") else args, {"-p", "--package"})
                if pkg and not _npm_pinned(pkg):
                    out.append(self._s("HS-MCP-001", name, line, f"{command} {pkg}",
                                       f"Server '{sname}' runs '{pkg}' without a fixed version."))
                if (pkg and "mcp-remote" in pkg) or "mcp-remote" in args:
                    out.append(self._s("HS-MCP-006", name, line, "mcp-remote", f"Server '{sname}'."))
            elif cmd_base in ("uvx", "pipx"):
                rest = args[1:] if cmd_base == "pipx" and args[:1] == ["run"] else args
                pkg = _first_positional(rest, {"--from", "--with", "--python", "-p"})
                from_spec = _flag_value(rest, "--from")
                spec = from_spec or pkg
                if spec and not re.search(r"(==|@)\s*v?\d", spec) and not spec.startswith(("git+", "/", ".")):
                    out.append(self._s("HS-MCP-001", name, line, f"{command} {spec}",
                                       f"Server '{sname}' runs '{spec}' without a fixed version."))
            # docker
            if cmd_base in ("docker", "podman"):
                joined = " ".join(args)
                bad = []
                if "--privileged" in args:
                    bad.append("--privileged")
                if re.search(r"--(network|net)[= ]host", joined):
                    bad.append("--network host")
                if re.search(r"(-v|--volume)[= ]/:/", joined) or re.search(r"(-v|--volume)[= ]/var/run/docker\.sock", joined):
                    bad.append("mounts host root or docker socket")
                if bad:
                    out.append(self._s("HS-MCP-005", name, line, ", ".join(bad), f"Server '{sname}'."))
                img = _docker_image(args)
                if img and (":" not in img.split("/")[-1] or img.endswith(":latest")) and "@sha256:" not in img:
                    out.append(self._s("HS-MCP-001", name, line, f"image {img}",
                                       f"Server '{sname}' uses image '{img}' without a fixed tag or digest."))
            # broad filesystem
            for a in args:
                if a.strip() in ("/", "~", "~/", "$HOME", "${HOME}", "C:\\", "C:/", "/Users", "/home", "%USERPROFILE%") or \
                        re.fullmatch(r"/(Users|home)/[^/]+/?", a.strip()):
                    out.append(self._s("HS-MCP-004", name, line, a, f"Server '{sname}' is given '{a}'."))
                    break
            # remote url
            url = cfg.get("url") or cfg.get("serverUrl")
            if isinstance(url, str):
                if re.match(r"http://(?!(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]))", url, re.I):
                    out.append(self._s("HS-MCP-003", name, line, url, f"Server '{sname}'."))
                elif not re.match(r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])", url, re.I):
                    out.append(self._s("HS-MCP-007", name, line, url, f"Server '{sname}'."))
            # inline secrets in env / headers / args
            for section in ("env", "headers"):
                vals = cfg.get(section)
                if isinstance(vals, dict):
                    for k, v in vals.items():
                        if isinstance(v, str) and SECRET_NAME.search(k) and not PLACEHOLDER.search(v) and len(v) >= 8:
                            vline = _find_line(text, f'"{k}"', start_line=line)
                            out.append(self._s("HS-MCP-002", name, vline, f"{k}={mask_value(v)}",
                                               f"Server '{sname}' stores {section} value '{k}' in plain text."))
            for i, a in enumerate(args):
                if re.match(r"--?(api[-_]?key|token|secret|password)(=|$)", a, re.I):
                    val = a.split("=", 1)[1] if "=" in a else (args[i + 1] if i + 1 < len(args) else "")
                    if val and not PLACEHOLDER.search(val) and len(val) >= 8:
                        out.append(self._s("HS-MCP-002", name, line, f"{a.split('=')[0]} {mask_value(val)}",
                                           f"Server '{sname}' passes a secret on the command line."))
            # auto approve
            for key in ("alwaysAllow", "autoApprove"):
                v = cfg.get(key)
                if (isinstance(v, list) and v) or v is True:
                    out.append(self._s("HS-MCP-008", name, line, f"{key}: {v if v is True else ', '.join(map(str, v))[:120]}",
                                       f"Server '{sname}'."))
        return out

    # ---- n8n
    def _n8n(self, data: dict, text: str, name: str) -> list[Finding]:
        out = []
        nodes = [n for n in data.get("nodes", []) if isinstance(n, dict)]
        has_agent = untrusted = private = outbound = False
        untrusted_types = ("webhook", "emailreadimap", "gmailtrigger", "rssfeedread", "formtrigger",
                           "telegramtrigger", "slacktrigger", "chattrigger", "httprequest", "microsoftoutlooktrigger")
        private_types = ("gmail", "googledrive", "googlesheets", "notion", "postgres", "mysql", "mongodb",
                         "microsoftoutlook", "airtable", "hubspot", "salesforce", "readbinaryfile", "readwritefile",
                         "onedrive", "dropbox", "supabase", "jira", "github")
        outbound_types = ("httprequest", "gmail", "slack", "telegram", "discord", "emailsend", "microsoftoutlook",
                          "sendgrid", "twilio", "webhook", "respondtowebhook", "toolhttprequest")
        for node in nodes:
            ntype = str(node.get("type", "")).lower()
            nname = str(node.get("name", ntype))
            line = _find_line(text, json.dumps(nname))
            params = node.get("parameters") or {}
            short = ntype.split(".")[-1]
            if "agent" in short and "langchain" in ntype:
                has_agent = True
            if any(t in short for t in untrusted_types):
                untrusted = True
            if any(t in short for t in private_types):
                private = True
            if any(t in short for t in outbound_types):
                outbound = True
            if short == "executecommand":
                out.append(self._s("HS-N8N-001", name, line, str(params.get("command", ""))[:160],
                                   f"Node '{nname}'."))
            if short in ("code", "function", "functionitem"):
                code = str(params.get("jsCode") or params.get("functionCode") or params.get("pythonCode") or "")
                if re.search(r"require\(\s*['\"](child_process|fs|os|net|http|https)['\"]\s*\)|\bimport\s+(os|subprocess|socket)\b|process\.env|\$env\.", code):
                    out.append(self._s("HS-N8N-002", name, line,
                                       _snippet(code, 0, min(len(code), 160)), f"Node '{nname}'."))
            if short == "webhook":
                auth = str(params.get("authentication", "none")).lower()
                if auth in ("none", ""):
                    out.append(self._s("HS-N8N-003", name, line, f"path: {params.get('path', '?')}", f"Node '{nname}'."))
        if has_agent and untrusted and private and outbound:
            out.append(self._s("HS-N8N-004", name, 1, "AI agent + untrusted input + private data + outbound",
                               "Workflow-level combination."))
        return out


# ---------------------------------------------------------------- small utils

def _find_line(text: str, needle: str, start_line: int = 1) -> int:
    lines = text.splitlines()
    for i in range(max(0, start_line - 1), len(lines)):
        if needle in lines[i]:
            return i + 1
    idx = text.find(needle)
    return _line_of(text, idx) if idx >= 0 else 1


def _first_positional(args: list[str], value_flags: set[str]) -> str | None:
    skip = False
    for a in args:
        if skip:
            skip = False
            continue
        if a in value_flags:
            skip = True
            continue
        if a.startswith("-"):
            continue
        return a
    return None


def _flag_value(args: list[str], flag: str) -> str | None:
    for i, a in enumerate(args):
        if a == flag and i + 1 < len(args):
            return args[i + 1]
        if a.startswith(flag + "="):
            return a.split("=", 1)[1]
    return None


def _npm_pinned(pkg: str) -> bool:
    body = pkg[1:] if pkg.startswith("@") else pkg
    if "@" not in body:
        return False
    version = body.split("@", 1)[1]
    return bool(re.match(r"^v?\d+\.\d+\.\d+", version))


def _docker_image(args: list[str]) -> str | None:
    if not args or args[0] != "run":
        return None
    value_flags = {"-e", "--env", "-v", "--volume", "--name", "--network", "--net", "-p", "--publish",
                   "-w", "--workdir", "--env-file", "-u", "--user", "--entrypoint", "--mount", "--platform"}
    skip = False
    for a in args[1:]:
        if skip:
            skip = False
            continue
        if a in value_flags:
            skip = True
            continue
        if a.startswith("-"):
            continue
        return a
    return None


def _read_ignore_file(root: Path) -> list[str]:
    p = (root if root.is_dir() else root.parent) / IGNORE_FILE
    if p.is_file():
        return [l.strip() for l in p.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    return []


def _iter_files(root: Path, excludes: list[str]):
    if root.is_file():
        yield root
        return
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            p = Path(dirpath) / fn
            rel = str(p.relative_to(root))
            if any(fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(fn, pat) for pat in excludes):
                continue
            if p.suffix.lower() in TEXT_EXTS or fn.lower() in ("skill.md", "dockerfile", "makefile"):
                yield p
