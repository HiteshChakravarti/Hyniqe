/* Hyniqe Shield - browser/Node port of hyniqe_shield/engine.py.
 * Static analysis only: nothing is executed. Keep in sync with the Python engine
 * (tests/test_scanner.py::WebParity checks both engines report the same rules). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HyniqeShield = factory();
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this), function () {
  "use strict";

  const SEVERITY_ORDER = ["info", "low", "medium", "high", "critical"];
  const CODE_EXTS = new Set([".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".sh", ".bash", ".zsh", ".ps1",
    ".rb", ".go", ".rs", ".java", ".kt", ".php"]);
  const INLINE_IGNORE = /hyniqe-shield:\s*ignore(?:\s+(HS-[A-Z0-9-]+(?:\s*,\s*HS-[A-Z0-9-]+)*))?/i;
  const SECRET_NAME = /(token|secret|password|passwd|api[_-]?key|apikey|access[_-]?key|private[_-]?key|auth|bearer|credential)/i;
  const PLACEHOLDER = /\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]{2,}\b|\$env:|\{\{.*\}\}|^\s*$|^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?$|^\$\{\{.*\}\}$|^<.*>$|^(your|xxx|changeme|replace|example|placeholder|todo|\*+)/i;

  const basename = (p) => p.split(/[\\/]/).pop();
  const extname = (p) => { const b = basename(p); const i = b.lastIndexOf("."); return i > 0 ? b.slice(i).toLowerCase() : ""; };
  const lineOf = (text, index) => { let n = 1; for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++; return n; };
  const lineText = (text, line) => { const ls = text.split(/\r\n|\n|\r/); return line > 0 && line <= ls.length ? ls[line - 1] : ""; };
  const maskValue = (v) => (v.length > 6 ? v.slice(0, 4) + "…" + "******" : "*".repeat(v.length));
  function snippet(text, start, end, mask) {
    let m = text.slice(start, end);
    if (mask) m = m.length > 8 ? m.slice(0, 6) + "…" + "******" : "*".repeat(m.length);
    m = m.replace(/\n/g, " ");
    return m.length > 160 ? m.slice(0, 157) + "..." : m;
  }
  function findLine(text, needle, startLine) {
    const lines = text.split(/\r\n|\n|\r/);
    for (let i = Math.max(0, (startLine || 1) - 1); i < lines.length; i++) if (lines[i].includes(needle)) return i + 1;
    const idx = text.indexOf(needle);
    return idx >= 0 ? lineOf(text, idx) : 1;
  }
  function ignored(lt, ruleId) {
    const m = INLINE_IGNORE.exec(lt);
    if (!m) return false;
    if (!m[1]) return true;
    return m[1].split(",").map((s) => s.trim().toUpperCase()).includes(ruleId.toUpperCase());
  }
  function stripJsonComments(t) { return t.replace(/^\s*\/\/.*$/gm, ""); }

  function mcpServers(d) {
    if (d && typeof d.mcpServers === "object" && d.mcpServers && !Array.isArray(d.mcpServers)) return d.mcpServers;
    if (d && d.servers && typeof d.servers === "object" && !Array.isArray(d.servers) &&
      Object.values(d.servers).some((v) => v && typeof v === "object" && ("command" in v || "url" in v))) return d.servers;
    if (d && d.mcp && typeof d.mcp === "object" && d.mcp.servers && typeof d.mcp.servers === "object") return d.mcp.servers;
    return null;
  }

  function detectKind(name, text) {
    const base = basename(name).toLowerCase();
    const ext = extname(base);
    let parsed = null;
    if (ext === ".json" || ext === ".jsonc" || text.trimStart().startsWith("{")) {
      try { parsed = JSON.parse(ext === ".jsonc" ? stripJsonComments(text) : text); } catch (e) { parsed = null; }
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        if (mcpServers(parsed) !== null) return ["mcp_config", parsed];
        if (Array.isArray(parsed.nodes) && "connections" in parsed) return ["n8n", parsed];
      }
    }
    if (base === "skill.md") return ["skill", null];
    if (ext === ".md" || ext === ".markdown") return ["markdown", null];
    if (CODE_EXTS.has(ext)) return ["code", null];
    return ["text", parsed];
  }

  function firstPositional(args, valueFlags) {
    let skip = false;
    for (const a of args) {
      if (skip) { skip = false; continue; }
      if (valueFlags.has(a)) { skip = true; continue; }
      if (a.startsWith("-")) continue;
      return a;
    }
    return null;
  }
  function flagValue(args, flag) {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === flag && i + 1 < args.length) return args[i + 1];
      if (args[i].startsWith(flag + "=")) return args[i].split("=").slice(1).join("=");
    }
    return null;
  }
  function npmPinned(pkg) {
    const body = pkg.startsWith("@") ? pkg.slice(1) : pkg;
    const i = body.indexOf("@");
    if (i < 0) return false;
    return /^v?\d+\.\d+\.\d+/.test(body.slice(i + 1));
  }
  function dockerImage(args) {
    if (!args.length || args[0] !== "run") return null;
    const vf = new Set(["-e", "--env", "-v", "--volume", "--name", "--network", "--net", "-p", "--publish", "-w", "--workdir",
      "--env-file", "-u", "--user", "--entrypoint", "--mount", "--platform"]);
    return firstPositional(args.slice(1), vf);
  }

  function createScanner(rules) {
    const compiled = rules.rules.map((r) => ({ ...r, _re: new RegExp(r.pattern, "gm" + (r.flags.includes("i") ? "i" : "")),
      _not: r.not_if_line ? new RegExp(r.not_if_line, "i") : null }));
    const S = rules.structural_rules;
    const W = rules.severity_weights;

    const ruleFinding = (r, file, line, evidence, detail) => ({ rule_id: r.id, title: r.title, severity: r.severity,
      category: r.category, owasp: r.owasp, file, line, evidence, explain: r.explain, fix: r.fix, detail: detail || "" });
    const sf = (rid, file, line, evidence, detail) => { const r = S[rid]; return { rule_id: rid, title: r.title,
      severity: r.severity, category: r.category, owasp: r.owasp, file, line, evidence, explain: r.explain, fix: r.fix,
      detail: detail || "" }; };

    function regexRules(text, name, kind) {
      const out = [];
      for (const r of compiled) {
        if (!r.applies_to.includes(kind)) continue;
        r._re.lastIndex = 0;
        let m, hits = 0;
        while ((m = r._re.exec(text)) !== null) {
          if (m[0].length === 0) { r._re.lastIndex++; continue; }
          if (r._not && r._not.test(lineText(text, lineOf(text, m.index)))) continue;
          hits++;
          if (hits > 20) break;
          out.push(ruleFinding(r, name, lineOf(text, m.index), snippet(text, m.index, m.index + m[0].length, !!r.mask)));
        }
      }
      return out;
    }

    function unicode(text, name) {
      const out = [];
      const runs = [];
      let cur = null, line = 1;
      const zw = new Set(), bidi = new Set();
      let i = 0;
      for (const ch of text) {
        const cp = ch.codePointAt(0);
        if (cp >= 0xE0000 && cp <= 0xE007F) {
          if (cur === null) cur = { line, chars: [] };
          if (cp >= 0xE0020 && cp <= 0xE007E) cur.chars.push(String.fromCharCode(cp - 0xE0000));
        } else {
          if (cur !== null) { runs.push(cur); cur = null; }
          if ([0x200B, 0x200C, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064].includes(cp) || (cp === 0xFEFF && i > 0)) zw.add(line);
          else if ((cp >= 0x202A && cp <= 0x202E) || (cp >= 0x2066 && cp <= 0x2069)) bidi.add(line);
          if (cp === 10) line++;
        }
        i++;
      }
      if (cur !== null) runs.push(cur);
      for (const run of runs) {
        const decoded = run.chars.join("");
        out.push(sf("HS-UNI-001", name, run.line, "(invisible characters)", `Hidden text decodes to: "${decoded.slice(0, 300)}"`));
        for (const f of regexRules(decoded, name, "text")) { f.line = run.line; f.detail = "Found inside hidden invisible text."; out.push(f); }
      }
      [...zw].sort((a, b) => a - b).slice(0, 20).forEach((ln) => out.push(sf("HS-UNI-002", name, ln, "(zero-width characters)")));
      [...bidi].sort((a, b) => a - b).slice(0, 20).forEach((ln) => out.push(sf("HS-UNI-003", name, ln, "(direction-override characters)")));
      return out;
    }

    function combos(findings, name) {
      const cats = new Set(findings.map((f) => f.category));
      if (cats.has("sensitive-access") && cats.has("exfiltration")) {
        const line = Math.min(...findings.filter((f) => f.category === "sensitive-access" || f.category === "exfiltration").map((f) => f.line));
        return [sf("HS-COMBO-001", name, line, "sensitive access + outbound data",
          "Both a sensitive-data access and a data-sending pattern were found in this file.")];
      }
      return [];
    }

    function skillFrontmatter(text, name) {
      const m = /^---\s*\n([\s\S]*?)\n---/.exec(text);
      if (!m) return [];
      const fm = m[1];
      const at = /^allowed-tools\s*:\s*(.+)$/im.exec(fm);
      if (at && /(?<![\w(])Bash(?!\s*\()/.test(at[1])) {
        const start = m.index + m[0].indexOf(fm) + at.index;
        return [sf("HS-SKILL-001", name, lineOf(text, start), at[0].trim().slice(0, 160))];
      }
      return [];
    }

    function mcp(data, text, name) {
      const out = [];
      const servers = mcpServers(data) || {};
      for (const [sname, cfg] of Object.entries(servers)) {
        if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) continue;
        const line = findLine(text, `"${sname}"`);
        const command = String(cfg.command ?? "");
        const args = (Array.isArray(cfg.args) ? cfg.args : []).filter((a) => typeof a === "string" || typeof a === "number").map(String);
        const cmdBase = basename(command).toLowerCase().replace(".cmd", "").replace(".exe", "");
        if (["npx", "bunx", "pnpx"].includes(cmdBase) || (["pnpm", "yarn"].includes(cmdBase) && args[0] === "dlx")) {
          const pkg = firstPositional(["pnpm", "yarn"].includes(cmdBase) ? args.slice(1) : args, new Set(["-p", "--package"]));
          if (pkg && !npmPinned(pkg)) out.push(sf("HS-MCP-001", name, line, `${command} ${pkg}`, `Server '${sname}' runs '${pkg}' without a fixed version.`));
          if ((pkg && pkg.includes("mcp-remote")) || args.includes("mcp-remote")) out.push(sf("HS-MCP-006", name, line, "mcp-remote", `Server '${sname}'.`));
        } else if (["uvx", "pipx"].includes(cmdBase)) {
          const rest = cmdBase === "pipx" && args[0] === "run" ? args.slice(1) : args;
          const pkg = firstPositional(rest, new Set(["--from", "--with", "--python", "-p"]));
          const spec = flagValue(rest, "--from") || pkg;
          if (spec && !/(==|@)\s*v?\d/.test(spec) && !(spec.startsWith("git+") || spec.startsWith("/") || spec.startsWith(".")))
            out.push(sf("HS-MCP-001", name, line, `${command} ${spec}`, `Server '${sname}' runs '${spec}' without a fixed version.`));
        }
        if (["docker", "podman"].includes(cmdBase)) {
          const joined = args.join(" ");
          const bad = [];
          if (args.includes("--privileged")) bad.push("--privileged");
          if (/--(network|net)[= ]host/.test(joined)) bad.push("--network host");
          if (/(-v|--volume)[= ]\/:\//.test(joined) || /(-v|--volume)[= ]\/var\/run\/docker\.sock/.test(joined)) bad.push("mounts host root or docker socket");
          if (bad.length) out.push(sf("HS-MCP-005", name, line, bad.join(", "), `Server '${sname}'.`));
          const img = dockerImage(args);
          if (img && (!img.split("/").pop().includes(":") || img.endsWith(":latest")) && !img.includes("@sha256:"))
            out.push(sf("HS-MCP-001", name, line, `image ${img}`, `Server '${sname}' uses image '${img}' without a fixed tag or digest.`));
        }
        for (const a of args) {
          const t = a.trim();
          if (["/", "~", "~/", "$HOME", "${HOME}", "C:\\", "C:/", "/Users", "/home", "%USERPROFILE%"].includes(t) || /^\/(Users|home)\/[^/]+\/?$/.test(t)) {
            out.push(sf("HS-MCP-004", name, line, a, `Server '${sname}' is given '${a}'.`));
            break;
          }
        }
        const url = cfg.url || cfg.serverUrl;
        if (typeof url === "string") {
          if (/^http:\/\/(?!(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]))/i.test(url)) out.push(sf("HS-MCP-003", name, line, url, `Server '${sname}'.`));
          else if (!/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i.test(url)) out.push(sf("HS-MCP-007", name, line, url, `Server '${sname}'.`));
        }
        for (const section of ["env", "headers"]) {
          const vals = cfg[section];
          if (vals && typeof vals === "object" && !Array.isArray(vals)) {
            for (const [k, v] of Object.entries(vals)) {
              if (typeof v === "string" && SECRET_NAME.test(k) && !PLACEHOLDER.test(v) && v.length >= 8) {
                out.push(sf("HS-MCP-002", name, findLine(text, `"${k}"`, line), `${k}=${maskValue(v)}`,
                  `Server '${sname}' stores ${section} value '${k}' in plain text.`));
              }
            }
          }
        }
        args.forEach((a, i) => {
          if (/^--?(api[-_]?key|token|secret|password)(=|$)/i.test(a)) {
            const val = a.includes("=") ? a.split("=").slice(1).join("=") : (args[i + 1] || "");
            if (val && !PLACEHOLDER.test(val) && val.length >= 8)
              out.push(sf("HS-MCP-002", name, line, `${a.split("=")[0]} ${maskValue(val)}`, `Server '${sname}' passes a secret on the command line.`));
          }
        });
        for (const key of ["alwaysAllow", "autoApprove"]) {
          const v = cfg[key];
          if ((Array.isArray(v) && v.length) || v === true)
            out.push(sf("HS-MCP-008", name, line, `${key}: ${v === true ? "True" : v.map(String).join(", ").slice(0, 120)}`, `Server '${sname}'.`));
        }
      }
      return out;
    }

    function n8n(data, text, name) {
      const out = [];
      const nodes = (data.nodes || []).filter((n) => n && typeof n === "object");
      let hasAgent = false, untrusted = false, priv = false, outbound = false;
      const U = ["webhook", "emailreadimap", "gmailtrigger", "rssfeedread", "formtrigger", "telegramtrigger", "slacktrigger",
        "chattrigger", "httprequest", "microsoftoutlooktrigger"];
      const P = ["gmail", "googledrive", "googlesheets", "notion", "postgres", "mysql", "mongodb", "microsoftoutlook", "airtable",
        "hubspot", "salesforce", "readbinaryfile", "readwritefile", "onedrive", "dropbox", "supabase", "jira", "github"];
      const O = ["httprequest", "gmail", "slack", "telegram", "discord", "emailsend", "microsoftoutlook", "sendgrid", "twilio",
        "webhook", "respondtowebhook", "toolhttprequest"];
      for (const node of nodes) {
        const ntype = String(node.type ?? "").toLowerCase();
        const nname = String(node.name ?? ntype);
        const line = findLine(text, JSON.stringify(nname));
        const params = node.parameters || {};
        const short = ntype.split(".").pop();
        if (short.includes("agent") && ntype.includes("langchain")) hasAgent = true;
        if (U.some((t) => short.includes(t))) untrusted = true;
        if (P.some((t) => short.includes(t))) priv = true;
        if (O.some((t) => short.includes(t))) outbound = true;
        if (short === "executecommand") out.push(sf("HS-N8N-001", name, line, String(params.command ?? "").slice(0, 160), `Node '${nname}'.`));
        if (["code", "function", "functionitem"].includes(short)) {
          const code = String(params.jsCode || params.functionCode || params.pythonCode || "");
          if (/require\(\s*['"](child_process|fs|os|net|http|https)['"]\s*\)|\bimport\s+(os|subprocess|socket)\b|process\.env|\$env\./.test(code))
            out.push(sf("HS-N8N-002", name, line, snippet(code, 0, Math.min(code.length, 160)), `Node '${nname}'.`));
        }
        if (short === "webhook") {
          const auth = String(params.authentication ?? "none").toLowerCase();
          if (auth === "none" || auth === "") out.push(sf("HS-N8N-003", name, line, `path: ${params.path ?? "?"}`, `Node '${nname}'.`));
        }
      }
      if (hasAgent && untrusted && priv && outbound)
        out.push(sf("HS-N8N-004", name, 1, "AI agent + untrusted input + private data + outbound", "Workflow-level combination."));
      return out;
    }

    function score(findings) {
      const seen = new Map();
      let total = 0;
      for (const f of findings) {
        const key = f.rule_id;
        const n = seen.get(key) || 0;
        const w = W[f.severity];
        if (w) total += n === 0 ? w : (n < 5 ? Math.max(1, Math.floor(w / 4)) : 0);
        seen.set(key, n + 1);
      }
      const s = Math.min(100, total);
      const sev = new Set(findings.map((f) => f.severity));
      const highRules = new Set(findings.filter((f) => f.severity === "high").map((f) => f.rule_id));
      const verdict = sev.has("critical") || highRules.size >= 2 ? "DANGEROUS" : (sev.has("high") || s >= 10 ? "CAUTION" : "NO_KNOWN_RISKS");
      return [s, verdict];
    }

    function scanText(text, name) {
      name = name || "input.txt";
      const [kind, parsed] = detectKind(name, text);
      let findings = regexRules(text, name, kind).concat(unicode(text, name));
      if (kind === "mcp_config") findings = findings.concat(mcp(parsed, text, name));
      else if (kind === "n8n") findings = findings.concat(n8n(parsed, text, name));
      else if (kind === "skill" || kind === "markdown") findings = findings.concat(skillFrontmatter(text, name));
      findings = findings.concat(combos(findings, name));
      const seen = new Set();
      const kept = [];
      for (const f of findings) {
        const key = f.rule_id + "\u0000" + f.line + "\u0000" + f.evidence;
        if (seen.has(key) || ignored(lineText(text, f.line), f.rule_id)) continue;
        seen.add(key);
        kept.push(f);
      }
      const [s, v] = score(kept);
      return { path: name, kind, findings: kept, score: s, verdict: v };
    }

    function summarise(target, files) {
      const findings = files.flatMap((f) => f.findings);
      findings.sort((a, b) => (SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity)) ||
        (a.file < b.file ? -1 : a.file > b.file ? 1 : 0) || (a.line - b.line));
      const [s, v] = score(findings);
      const counts = Object.fromEntries(SEVERITY_ORDER.map((k) => [k, findings.filter((f) => f.severity === k).length]));
      return { tool: "hyniqe-shield", rules_version: rules.version, target, verdict: v, score: s, counts,
        files_scanned: files.length,
        files: files.map((f) => ({ path: f.path, kind: f.kind, verdict: f.verdict, score: f.score, findings: f.findings.length })),
        findings };
    }

    return { scanText, summarise, rules };
  }

  return { createScanner, SEVERITY_ORDER };
});
