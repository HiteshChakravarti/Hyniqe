// Minimal XML reader and writer for bank files (payment files, statements, status reports).
// Dependency-free so it runs the same in Node and in the browser. Namespace prefixes are dropped
// from element names; the default namespace is kept on the root as `ns`.

export interface XmlNode {
  name: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
  /** 1-based line where the element starts, for error messages. */
  line: number;
}

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s: string): string =>
  s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e: string) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e],
  );

export class XmlError extends Error {}

export function parseXml(src: string): XmlNode {
  const text = src.charCodeAt(0) === 0xfeff ? src.slice(1) : src;
  let i = 0;
  let line = 1;
  const stack: XmlNode[] = [];
  let root: XmlNode | null = null;
  const advance = (to: number): void => {
    for (let k = i; k < to; k++) if (text.charCodeAt(k) === 10) line++;
    i = to;
  };
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    if (lt < 0) break;
    if (lt > i && stack.length) stack[stack.length - 1].text += decode(text.slice(i, lt));
    advance(lt);
    if (text.startsWith('<?', i)) {
      const end = text.indexOf('?>', i);
      if (end < 0) throw new XmlError(`Line ${line}: unterminated declaration.`);
      advance(end + 2);
    } else if (text.startsWith('<!--', i)) {
      const end = text.indexOf('-->', i);
      if (end < 0) throw new XmlError(`Line ${line}: unterminated comment.`);
      advance(end + 3);
    } else if (text.startsWith('<![CDATA[', i)) {
      const end = text.indexOf(']]>', i);
      if (end < 0) throw new XmlError(`Line ${line}: unterminated CDATA section.`);
      if (stack.length) stack[stack.length - 1].text += text.slice(i + 9, end);
      advance(end + 3);
    } else if (text.startsWith('<!', i)) {
      const end = text.indexOf('>', i);
      advance(end + 1);
    } else if (text.startsWith('</', i)) {
      const end = text.indexOf('>', i);
      if (end < 0) throw new XmlError(`Line ${line}: unterminated closing tag.`);
      const name = local(text.slice(i + 2, end).trim());
      const open = stack.pop();
      if (!open || open.name !== name) throw new XmlError(`Line ${line}: closing tag </${name}> does not match <${open?.name ?? 'nothing'}>.`);
      advance(end + 1);
    } else {
      const end = findTagEnd(text, i);
      if (end < 0) throw new XmlError(`Line ${line}: unterminated tag.`);
      const raw = text.slice(i + 1, end);
      const selfClose = raw.endsWith('/');
      const body = selfClose ? raw.slice(0, -1) : raw;
      const m = /^([^\s/>]+)/.exec(body);
      if (!m) throw new XmlError(`Line ${line}: malformed tag.`);
      const node: XmlNode = { name: local(m[1]), attrs: {}, children: [], text: '', line };
      const attrRe = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
      let a: RegExpExecArray | null;
      while ((a = attrRe.exec(body.slice(m[1].length)))) node.attrs[a[1]] = decode(a[3] ?? a[4] ?? '');
      if (stack.length) stack[stack.length - 1].children.push(node);
      else if (!root) root = node;
      else throw new XmlError(`Line ${line}: more than one root element.`);
      advance(end + 1);
      if (!selfClose) stack.push(node);
    }
  }
  if (stack.length) throw new XmlError(`The file ends before <${stack[stack.length - 1].name}> (opened on line ${stack[stack.length - 1].line}) is closed.`);
  if (!root) throw new XmlError('This is not an XML file: no elements were found.');
  return root;
}

function findTagEnd(s: string, from: number): number {
  let q: string | null = null;
  for (let k = from + 1; k < s.length; k++) {
    const c = s[k];
    if (q) {
      if (c === q) q = null;
    } else if (c === '"' || c === "'") q = c;
    else if (c === '>') return k;
  }
  return -1;
}

const local = (n: string): string => (n.includes(':') ? n.slice(n.indexOf(':') + 1) : n);

/** First child (or descendant via path "A/B/C") with the given name. */
export function child(n: XmlNode | undefined | null, path: string): XmlNode | undefined {
  let cur: XmlNode | undefined = n ?? undefined;
  for (const p of path.split('/')) {
    if (!cur) return undefined;
    cur = cur.children.find((c) => c.name === p);
  }
  return cur;
}

export function children(n: XmlNode | undefined | null, name: string): XmlNode[] {
  return n ? n.children.filter((c) => c.name === name) : [];
}

/** Trimmed text at a path, or '' when absent. */
export function val(n: XmlNode | undefined | null, path: string): string {
  return child(n, path)?.text.trim() ?? '';
}

/** All descendants with a given name, depth first. */
export function findAll(n: XmlNode, name: string, out: XmlNode[] = []): XmlNode[] {
  for (const c of n.children) {
    if (c.name === name) out.push(c);
    findAll(c, name, out);
  }
  return out;
}

const escText = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string): string => escText(s).replace(/"/g, '&quot;');

/** Serialise a tree back to indented XML. */
export function writeXml(n: XmlNode, opts: { declaration?: boolean } = {}): string {
  const out: string[] = [];
  if (opts.declaration !== false) out.push('<?xml version="1.0" encoding="UTF-8"?>');
  const walk = (x: XmlNode, depth: number): void => {
    const pad = '  '.repeat(depth);
    const attrs = Object.entries(x.attrs).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join('');
    if (!x.children.length) {
      const t = x.text.trim();
      out.push(t ? `${pad}<${x.name}${attrs}>${escText(t)}</${x.name}>` : `${pad}<${x.name}${attrs}/>`);
      return;
    }
    out.push(`${pad}<${x.name}${attrs}>`);
    for (const c of x.children) walk(c, depth + 1);
    out.push(`${pad}</${x.name}>`);
  };
  walk(n, 0);
  return out.join('\n') + '\n';
}

/** Build an element: el('Nm', {}, 'text') or el('Cdtr', {}, [el(...), ...]). */
export function el(name: string, attrs: Record<string, string> = {}, content: string | (XmlNode | null | undefined | false)[] = ''): XmlNode {
  return typeof content === 'string'
    ? { name, attrs, children: [], text: content, line: 0 }
    : { name, attrs, children: content.filter((c): c is XmlNode => !!c), text: '', line: 0 };
}
