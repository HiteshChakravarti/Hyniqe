"""Output formats for Hyniqe Shield results."""
from __future__ import annotations

import json
import os
import sys

from .engine import ScanResult, SEVERITY_ORDER

VERDICT_LABEL = {
    "DANGEROUS": "DANGEROUS - do not install",
    "CAUTION": "CAUTION - review before installing",
    "NO_KNOWN_RISKS": "NO KNOWN RISKS FOUND",
}
VERDICT_NOTE = ("Hyniqe Shield is a static checker. 'No known risks found' means none of its rules matched; "
                "it is not a guarantee that something is safe.")

_COLORS = {"critical": "\033[1;97;41m", "high": "\033[1;31m", "medium": "\033[33m", "low": "\033[36m",
           "info": "\033[90m", "DANGEROUS": "\033[1;97;41m", "CAUTION": "\033[1;30;43m",
           "NO_KNOWN_RISKS": "\033[1;30;42m", "bold": "\033[1m", "dim": "\033[2m", "reset": "\033[0m"}


def _c(key: str, text: str, color: bool) -> str:
    return f"{_COLORS[key]}{text}{_COLORS['reset']}" if color else text


def to_text(result: ScanResult, color: bool | None = None) -> str:
    if color is None:
        color = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
    out = []
    out.append(_c("bold", "Hyniqe Shield", color) + f"  ·  scanned {len(result.files)} file(s) in {result.target}")
    out.append("")
    out.append("  " + _c(result.verdict, f" {VERDICT_LABEL[result.verdict]} ", color) + f"   risk score {result.score}/100")
    counts = result.counts()
    out.append("  " + "  ".join(f"{s}: {counts[s]}" for s in reversed(SEVERITY_ORDER) if counts[s]) or "  no findings")
    out.append("")
    for f in result.findings:
        out.append(f"{_c(f.severity, f.severity.upper().ljust(8), color)} {f.rule_id}  {_c('bold', f.title, color)}")
        out.append(f"         {f.file}:{f.line}   [{', '.join(f.owasp)}]")
        if f.evidence:
            out.append(_c("dim", f"         > {f.evidence}", color))
        if f.detail:
            out.append(f"         {f.detail}")
        out.append(f"         Why: {f.explain}")
        out.append(f"         Fix: {f.fix}")
        out.append("")
    out.append(_c("dim", VERDICT_NOTE, color))
    return "\n".join(out)


def to_json(result: ScanResult) -> str:
    d = result.to_dict()
    d["note"] = VERDICT_NOTE
    return json.dumps(d, indent=2, ensure_ascii=False)


def to_markdown(result: ScanResult) -> str:
    icon = {"DANGEROUS": "🔴", "CAUTION": "🟡", "NO_KNOWN_RISKS": "🟢"}[result.verdict]
    lines = [f"## {icon} Hyniqe Shield: {VERDICT_LABEL[result.verdict]}", "",
             f"**Risk score:** {result.score}/100 · **Files scanned:** {len(result.files)}", ""]
    if result.findings:
        lines += ["| Severity | Rule | Finding | Location | OWASP |", "|---|---|---|---|---|"]
        for f in result.findings:
            loc = f"`{f.file}:{f.line}`"
            lines.append(f"| {f.severity} | {f.rule_id} | {f.title} | {loc} | {', '.join(f.owasp)} |")
        lines += ["", "<details><summary>Details and fixes</summary>", ""]
        for f in result.findings:
            lines.append(f"- **{f.rule_id} {f.title}** (`{f.file}:{f.line}`): {f.explain} *Fix:* {f.fix}"
                         + (f" {f.detail}" if f.detail else ""))
        lines += ["", "</details>"]
    lines += ["", f"_{VERDICT_NOTE}_"]
    return "\n".join(lines)


def to_sarif(result: ScanResult, rules: dict) -> str:
    level = {"critical": "error", "high": "error", "medium": "warning", "low": "note", "info": "note"}
    rule_meta = {r["id"]: r for r in rules["rules"]}
    rule_meta.update({k: {"id": k, **v} for k, v in rules["structural_rules"].items()})
    used = sorted({f.rule_id for f in result.findings})
    sarif = {
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "version": "2.1.0",
        "runs": [{
            "tool": {"driver": {
                "name": "Hyniqe Shield",
                "informationUri": "https://github.com/HiteshChakravarti/Hyniqe",
                "version": rules["version"],
                "rules": [{
                    "id": rid,
                    "name": rid,
                    "shortDescription": {"text": rule_meta[rid]["title"]},
                    "fullDescription": {"text": rule_meta[rid]["explain"]},
                    "help": {"text": rule_meta[rid]["fix"]},
                    "properties": {"tags": rule_meta[rid]["owasp"] + [rule_meta[rid]["category"]],
                                   "security-severity": {"critical": "9.5", "high": "7.5", "medium": "5.0",
                                                         "low": "3.0", "info": "1.0"}[rule_meta[rid]["severity"]]},
                } for rid in used],
            }},
            "results": [{
                "ruleId": f.rule_id,
                "level": level[f.severity],
                "message": {"text": f"{f.title}. {f.explain}" + (f" {f.detail}" if f.detail else "")},
                "locations": [{"physicalLocation": {
                    "artifactLocation": {"uri": f.file.replace(os.sep, "/")},
                    "region": {"startLine": max(1, f.line)},
                }}],
            } for f in result.findings],
        }],
    }
    return json.dumps(sarif, indent=2, ensure_ascii=False)
