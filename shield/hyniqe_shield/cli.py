"""Command-line interface: `hyniqe-shield scan <path>`."""
from __future__ import annotations

import argparse
import sys

from . import __version__
from .engine import Scanner, load_rules
from . import report

FAIL_LEVELS = {"never": set(), "caution": {"CAUTION", "DANGEROUS"}, "dangerous": {"DANGEROUS"}}


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="hyniqe-shield",
        description="Check AI agent add-ons (skills, MCP servers and configs, n8n workflows) for security risks. "
                    "Static analysis only - nothing is executed.")
    p.add_argument("--version", action="version", version=f"hyniqe-shield {__version__}")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("scan", help="scan a file or folder")
    s.add_argument("target", help="file or folder to scan ('-' reads from stdin)")
    s.add_argument("-f", "--format", choices=["text", "json", "markdown", "sarif"], default="text")
    s.add_argument("-o", "--output", help="write the report to this file instead of stdout")
    s.add_argument("--fail-on", choices=list(FAIL_LEVELS), default="never",
                   help="exit with code 1 when the verdict is at least this level (default: never)")
    s.add_argument("--exclude", action="append", default=[], help="glob to skip (repeatable)")
    s.add_argument("--min-severity", choices=["info", "low", "medium", "high", "critical"], default="info",
                   help="hide findings below this severity")
    s.add_argument("--no-color", action="store_true")

    sub.add_parser("rules", help="list all detection rules")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    rules = load_rules()
    if args.command == "rules":
        for r in rules["rules"]:
            print(f"{r['id']:<12} {r['severity']:<8} {', '.join(r['owasp']):<12} {r['title']}")
        for rid, r in rules["structural_rules"].items():
            print(f"{rid:<12} {r['severity']:<8} {', '.join(r['owasp']):<12} {r['title']}")
        return 0

    scanner = Scanner(rules)
    if args.target == "-":
        text = sys.stdin.read()
        result = scanner.summarise("stdin", [scanner.scan_text(text, "stdin.txt")])
    else:
        import os
        if not os.path.exists(args.target):
            print(f"hyniqe-shield: path not found: {args.target}", file=sys.stderr)
            return 2
        result = scanner.scan_path(args.target, args.exclude)

    order = ["info", "low", "medium", "high", "critical"]
    if args.min_severity != "info":
        floor = order.index(args.min_severity)
        result.findings = [f for f in result.findings if order.index(f.severity) >= floor]

    if args.format == "json":
        text = report.to_json(result)
    elif args.format == "markdown":
        text = report.to_markdown(result)
    elif args.format == "sarif":
        text = report.to_sarif(result, rules)
    else:
        text = report.to_text(result, color=False if (args.no_color or args.output) else None)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(text + "\n")
        print(f"hyniqe-shield: {result.verdict} (score {result.score}/100), report written to {args.output}",
              file=sys.stderr)
    else:
        print(text)
    return 1 if result.verdict in FAIL_LEVELS[args.fail_on] else 0


if __name__ == "__main__":
    sys.exit(main())
