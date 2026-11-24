"""Scan the add-ons listed in data/sources.json and write data/scans.json for the website.

Usage: python3 site/scan_directory.py <folder with cloned repos>
Each source names a GitHub repo, an optional sub-folder, and the folder name it was cloned to.
Clone with:  git clone --depth 1 https://github.com/<owner>/<repo> <corpus>/<owner>_<repo>
"""
from __future__ import annotations

import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from hyniqe_shield.engine import Scanner  # noqa: E402

# Code that is not shipped to users: tests, examples, demos, docs sites and CI.
EXCLUDES = ["*demo/*", "*mocks*/*", "*test*/*", "*tests/*", "*__tests__/*", "*.test.*", "*.spec.*", "*_test.go",
            "*_test.py", "test_*.py", "*fixtures/*", "*testdata/*", "*e2e/*", "*examples/*", "*example/*",
            "docs/*", "*/docs/*", "*.lock", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "*CHANGELOG*",
            "*.github/*", ".github/*", "*evals/*", "*benchmark*/*"]
MAX_LOCATIONS = 12


def describe(path: Path, kind: str) -> str:
    """A one-line description taken from the add-on's own metadata."""
    text = ""
    if kind == "skill" and (path / "SKILL.md").exists():
        md = (path / "SKILL.md").read_text("utf-8", "replace")
        m = re.search(r"^description:[ \t]*(.*)$((?:\n[ \t]+.*)*)", md, re.M)
        if m:
            first = m.group(1).strip()
            text = m.group(2).strip() if first in (">", ">-", "|", "|-", "") else first
            text = text.strip("\"'")
    for name in ("package.json",):
        p = path / name
        if not text and p.exists():
            try:
                text = json.loads(p.read_text("utf-8")).get("description", "") or ""
            except ValueError:
                pass
    if not text and (path / "pyproject.toml").exists():
        m = re.search(r'^description\s*=\s*"(.+)"', (path / "pyproject.toml").read_text("utf-8", "replace"), re.M)
        text = m.group(1) if m else ""
    text = re.sub(r"\s+", " ", text)
    return text if len(text) <= 180 else text[:177].rsplit(" ", 1)[0] + "..."


def main(corpus: str) -> None:
    sources = json.loads((HERE / "data" / "sources.json").read_text())
    scanner = Scanner()
    out = []
    for s in sources:
        repo_dir = Path(corpus) / s["clone"]
        path = repo_dir / s.get("sub", "")
        sha = subprocess.run(["git", "-C", str(repo_dir), "rev-parse", "HEAD"], capture_output=True, text=True,
                             check=True).stdout.strip()
        r = scanner.scan_path(str(path), EXCLUDES)
        groups = {}
        for f in r.findings:
            g = groups.setdefault(f.rule_id, {"rule_id": f.rule_id, "severity": f.severity, "count": 0, "locations": []})
            g["count"] += 1
            if len(g["locations"]) < MAX_LOCATIONS:
                g["locations"].append({"file": f.file.replace("\\", "/"), "line": f.line, "evidence": f.evidence,
                                       "detail": f.detail})
        order = ["critical", "high", "medium", "low", "info"]
        out.append({
            "slug": s["slug"], "name": s["name"], "kind": s["kind"], "repo": s["repo"], "sub": s.get("sub", ""),
            "commit": sha, "description": describe(path, s["kind"]),
            "verdict": r.verdict, "score": r.score, "files": len(r.files), "counts": r.counts(),
            "groups": sorted(groups.values(), key=lambda g: (order.index(g["severity"]), -g["count"])),
        })
        print(f"{r.verdict:15} {s['slug']}")
    data = {"scanned_on": dt.date.today().isoformat(), "rules_version": scanner.rules["version"],
            "excludes": EXCLUDES, "addons": out}
    (HERE / "data" / "scans.json").write_text(json.dumps(data, ensure_ascii=True, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "corpus")
