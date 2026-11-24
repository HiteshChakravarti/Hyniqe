"""Build web/index.html: inline the engine, the rules and the example files into one page."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIX = ROOT / "tests" / "fixtures"

EXAMPLES = [
    ("Malicious skill", "SKILL.md", FIX / "malicious" / "evil-skill" / "SKILL.md"),
    ("Poisoned MCP server", "server.py", FIX / "malicious" / "poisoned_server.py"),
    ("Risky MCP config", "claude_desktop_config.json", FIX / "malicious" / "claude_desktop_config.json"),
    ("Risky n8n workflow", "workflow.json", FIX / "malicious" / "n8n-workflow.json"),
    ("Clean MCP config", "mcp.json", FIX / "benign" / "mcp.json"),
    ("Clean skill", "SKILL.md", FIX / "benign" / "good-skill" / "SKILL.md"),
]


def safe_json(obj) -> str:
    # ASCII-only so invisible characters in the examples are stored as visible escapes
    return json.dumps(obj, ensure_ascii=True).replace("</", "<\\/")


def main():
    import runpy
    runpy.run_path(str(ROOT / "scripts" / "make_fixtures.py"))  # samples with invisible characters are generated
    template = (ROOT / "web" / "template.html").read_text(encoding="utf-8")
    engine = (ROOT / "web" / "engine.js").read_text(encoding="utf-8")
    rules = json.loads((ROOT / "hyniqe_shield" / "rules.json").read_text(encoding="utf-8"))
    examples = [{"label": l, "name": n, "text": p.read_text(encoding="utf-8")} for l, n, p in EXAMPLES]
    html = (template.replace("/*__ENGINE__*/", engine.replace("</script", "<\\/script"))
            .replace("/*__RULES__*/null", safe_json(rules))
            .replace("/*__EXAMPLES__*/[]", safe_json(examples)))
    out = ROOT / "web" / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()
