// Minimal, dependency-free XML parser (elements, attributes, text, CDATA, entities). Namespace prefixes are
// dropped from element names so ISO 20022 / Office XML can be queried by local name. Not a validating parser.

export interface XNode { name: string; attrs: Record<string, string>; children: XNode[]; text: string }

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENT[e] ?? m;
  });
}

const local = (n: string) => n.includes(":") ? n.slice(n.indexOf(":") + 1) : n;

export function parseXml(xml: string): XNode {
  const root: XNode = { name: "#root", attrs: {}, children: [], text: "" };
  const stack: XNode[] = [root];
  let i = 0;
  const len = xml.length;
  while (i < len) {
    const lt = xml.indexOf("<", i);
    if (lt < 0) { stack[stack.length - 1].text += decodeEntities(xml.slice(i)); break; }
    if (lt > i) stack[stack.length - 1].text += decodeEntities(xml.slice(i, lt));
    if (xml.startsWith("<!--", lt)) { const e = xml.indexOf("-->", lt); i = e < 0 ? len : e + 3; continue; }
    if (xml.startsWith("<![CDATA[", lt)) { const e = xml.indexOf("]]>", lt); stack[stack.length - 1].text += xml.slice(lt + 9, e < 0 ? len : e); i = e < 0 ? len : e + 3; continue; }
    if (xml.startsWith("<?", lt) || xml.startsWith("<!", lt)) { const e = xml.indexOf(">", lt); i = e < 0 ? len : e + 1; continue; }
    const gt = findTagEnd(xml, lt);
    const raw = xml.slice(lt + 1, gt);
    i = gt + 1;
    if (raw.startsWith("/")) {
      const name = local(raw.slice(1).trim());
      for (let k = stack.length - 1; k > 0; k--) if (stack[k].name === name) { stack.length = k; break; }
      continue;
    }
    const selfClose = raw.endsWith("/");
    const body = selfClose ? raw.slice(0, -1) : raw;
    const m = body.match(/^\s*([^\s/>]+)/);
    if (!m) continue;
    const node: XNode = { name: local(m[1]), attrs: {}, children: [], text: "" };
    for (const a of body.slice(m[0].length).matchAll(/([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) node.attrs[local(a[1])] = decodeEntities(a[3] ?? a[4] ?? "");
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}

function findTagEnd(xml: string, from: number): number {
  let q: string | null = null;
  for (let i = from + 1; i < xml.length; i++) {
    const c = xml[i];
    if (q) { if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === ">") return i;
  }
  return xml.length - 1;
}

/** All descendants (depth-first) with this local name. */
export function findAll(node: XNode, name: string): XNode[] {
  const out: XNode[] = [];
  const walk = (n: XNode) => { for (const c of n.children) { if (c.name === name) out.push(c); walk(c); } };
  walk(node);
  return out;
}

/** Follow a path of direct children ("Dbtr/PstlAdr/TwnNm") from a node; first match at each step. */
export function at(node: XNode | undefined, path: string): XNode | undefined {
  let cur = node;
  for (const p of path.split("/")) { if (!cur) return undefined; cur = cur.children.find((c) => c.name === p); }
  return cur;
}
export function textAt(node: XNode | undefined, path: string): string {
  return at(node, path)?.text.trim() ?? "";
}
export function textsAt(node: XNode | undefined, path: string): string[] {
  const parts = path.split("/");
  const last = parts.pop() as string;
  const parent = parts.length ? at(node, parts.join("/")) : node;
  return parent ? parent.children.filter((c) => c.name === last).map((c) => c.text.trim()) : [];
}
