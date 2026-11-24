// Copybook Decoder
// Reads a COBOL copybook (the record layout of a mainframe file), produces a data dictionary (field, position, length,
// type) and decodes fixed-length mainframe data (EBCDIC or ASCII; zoned, packed COMP-3 and binary numbers) into
// rows you can open in Excel. Handles groups, OCCURS, REDEFINES, 88-level values, signed and implied-decimal numbers.

import { CP037 } from "./ebcdic.ts";

export type Usage = "DISPLAY" | "COMP-3" | "BINARY" | "COMP-1" | "COMP-2";
export interface Item {
  level: number; name: string; pic: string; usage: Usage; occurs: number; redefines: string; values: string[]; signSeparate: boolean; signLeading: boolean;
  children: Item[]; line: number;
}
export interface Field {
  path: string; name: string; level: number; offset: number; length: number; kind: "alphanumeric" | "numeric" | "edited" | "group" | "float";
  pic: string; usage: Usage; digits: number; scale: number; signed: boolean; signSeparate: boolean; signLeading: boolean; values: string[]; redefines: boolean; leaf: boolean;
}

/** Remove sequence numbers / comment lines (fixed format) and split into period-terminated statements. */
export function statements(src: string): { text: string; line: number }[] {
  const lines = src.replace(/\r/g, "").split("\n");
  const fixed = lines.filter((l) => l.trim()).every((l) => l.length < 7 || /^[\d ]{6}/.test(l.slice(0, 6)) || /^\s/.test(l));
  let buf = "", startLine = 0;
  const out: { text: string; line: number }[] = [];
  lines.forEach((raw, i) => {
    let l = raw;
    if (fixed && l.length >= 7) { if ("*/".includes(l[6])) return; l = l.slice(7, 72); }
    else if (fixed && l.length < 7) return;
    if (/^\s*\*/.test(l)) return;
    l = l.replace(/\*>.*$/, "");
    if (!l.trim()) return;
    if (!buf) startLine = i + 1;
    buf += " " + l.trim();
    // a statement ends with a period followed by space/end (not inside PIC 9(5).99 style edits)
    while (/\.(\s|$)/.test(buf)) {
      const m = buf.match(/^(.*?\S)\.(\s+|$)/);
      if (!m) break;
      out.push({ text: m[1].trim(), line: startLine });
      buf = buf.slice(m[0].length);
      startLine = i + 1;
    }
  });
  if (buf.trim()) out.push({ text: buf.trim(), line: startLine });
  return out;
}

export function parseCopybook(src: string): { root: Item[]; warnings: string[] } {
  const warnings: string[] = [];
  const root: Item[] = [];
  const stack: Item[] = [];
  let last: Item | undefined;
  for (const st of statements(src)) {
    const tok = st.text.match(/^(\d{1,2})\s+([A-Za-z0-9][A-Za-z0-9-]*)?(.*)$/);
    if (!tok) { warnings.push(`Line ${st.line}: couldn't read "${st.text.slice(0, 40)}"`); continue; }
    const level = Number(tok[1]);
    const name = (tok[2] ?? "FILLER").toUpperCase();
    const rest = " " + (tok[3] ?? "") + " ";
    if (level === 88) {
      const v = rest.match(/VALUES?\s+(?:ARE\s+|IS\s+)?(.+)$/i)?.[1].trim() ?? "";
      if (last) last.values.push(`${name} = ${v}`);
      continue;
    }
    if (level === 66) { warnings.push(`Line ${st.line}: 66-level RENAMES ${name} ignored.`); continue; }
    const pic = rest.match(/\sPIC(?:TURE)?\s+(?:IS\s+)?(\S+)/i)?.[1].toUpperCase() ?? "";
    const u = rest.toUpperCase();
    const usage: Usage = /\s(COMP-3|COMPUTATIONAL-3|PACKED-DECIMAL)\b/.test(u) ? "COMP-3" : /\s(COMP-1|COMPUTATIONAL-1)\b/.test(u) ? "COMP-1" : /\s(COMP-2|COMPUTATIONAL-2)\b/.test(u) ? "COMP-2"
      : /\s(COMP|COMPUTATIONAL|COMP-4|COMPUTATIONAL-4|COMP-5|COMPUTATIONAL-5|BINARY)\b/.test(u) ? "BINARY" : "DISPLAY";
    const occ = u.match(/\sOCCURS\s+(?:\d+\s+TO\s+)?(\d+)/);
    if (/DEPENDING\s+ON/.test(u)) warnings.push(`Line ${st.line}: ${name} OCCURS DEPENDING ON. Laid out at its maximum size; real records may be shorter.`);
    const item: Item = { level: level === 77 ? 1 : level, name, pic, usage, occurs: occ ? Number(occ[1]) : 1, redefines: u.match(/\sREDEFINES\s+([A-Z0-9-]+)/)?.[1] ?? "", values: [],
      signSeparate: /SIGN\s+(IS\s+)?(LEADING|TRAILING)\s+SEPARATE|\sSEPARATE\b/.test(u), signLeading: /SIGN\s+(IS\s+)?LEADING/.test(u), children: [], line: st.line };
    while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop();
    const parent = stack[stack.length - 1];
    if (parent) {
      if (parent.usage !== "DISPLAY" && item.usage === "DISPLAY" && !/\sDISPLAY\b/.test(u)) item.usage = parent.usage; // group USAGE applies to children
      parent.children.push(item);
    } else root.push(item);
    stack.push(item);
    last = item;
  }
  return { root, warnings };
}

export function picInfo(pic: string): { kind: Field["kind"]; digits: number; scale: number; signed: boolean; chars: number } {
  const p = pic.replace(/(.)\((\d+)\)/g, (_m, c: string, n: string) => c.repeat(Number(n)));
  const signed = p.includes("S");
  if (/[XA]/.test(p)) return { kind: "alphanumeric", digits: 0, scale: 0, signed: false, chars: p.replace(/[S]/g, "").length };
  if (/[Z*$,.+\-B0\/]|CR|DB/.test(p.replace(/^S/, ""))) return { kind: "edited", digits: (p.match(/[9Z*]/g) ?? []).length, scale: 0, signed, chars: p.replace(/^S/, "").length };
  const [intPart, decPart = ""] = p.replace("S", "").split("V");
  const count = (s: string) => (s.match(/[9P]/g) ?? []).length;
  return { kind: "numeric", digits: count(intPart) + count(decPart), scale: count(decPart), signed, chars: count(intPart) + count(decPart) };
}

function storageLength(it: Item): number {
  if (it.usage === "COMP-1") return 4;
  if (it.usage === "COMP-2") return 8;
  const pi = picInfo(it.pic);
  if (it.usage === "COMP-3") return Math.floor(pi.digits / 2) + 1;
  if (it.usage === "BINARY") return pi.digits <= 4 ? 2 : pi.digits <= 9 ? 4 : 8;
  return pi.chars + (pi.kind === "numeric" && pi.signed && it.signSeparate ? 1 : 0);
}

function size(it: Item): number {
  if (!it.children.length) return storageLength(it);
  let total = 0;
  const offsets = new Map<string, number>();
  for (const c of it.children) {
    if (c.redefines && offsets.has(c.redefines)) continue; // redefinition doesn't add length (assumes it's not longer)
    offsets.set(c.name, total);
    total += size(c) * c.occurs;
  }
  return total;
}

/** Flatten into fields with absolute offsets (0-based). OCCURS are expanded as NAME(1), NAME(2)… */
export function layout(root: Item[], maxFields = 5000): { fields: Field[]; recordLength: number; warnings: string[] } {
  const fields: Field[] = [];
  const warnings: string[] = [];
  const rec = root[0];
  if (!rec) return { fields, recordLength: 0, warnings: ["No 01-level record found."] };
  if (root.length > 1) warnings.push(`${root.length} 01-level records found; using ${rec.name} (others may be alternative layouts).`);
  const walk = (it: Item, offset: number, path: string, suffix: string, isRedef: boolean) => {
    const name = it.name + suffix;
    const pi = picInfo(it.pic);
    const len = it.children.length ? size(it) : storageLength(it);
    if (fields.length < maxFields) fields.push({
      path: path ? `${path}.${name}` : name, name, level: it.level, offset, length: len, kind: it.children.length ? "group" : it.usage === "COMP-1" || it.usage === "COMP-2" ? "float" : pi.kind,
      pic: it.pic, usage: it.usage, digits: pi.digits, scale: pi.scale, signed: pi.signed, signSeparate: it.signSeparate, signLeading: it.signLeading, values: it.values, redefines: isRedef || !!it.redefines, leaf: !it.children.length,
    });
    let cur = offset;
    const childOffsets = new Map<string, number>();
    for (const c of it.children) {
      const start = c.redefines && childOffsets.has(c.redefines) ? (childOffsets.get(c.redefines) as number) : cur;
      if (c.redefines && !childOffsets.has(c.redefines)) warnings.push(`${c.name} REDEFINES ${c.redefines}, which isn't a sibling. Laid out sequentially.`);
      childOffsets.set(c.name, start);
      const csize = c.children.length ? size(c) : storageLength(c);
      for (let k = 0; k < c.occurs; k++) walk(c, start + k * csize, path ? `${path}.${name}` : name, `${suffix}${c.occurs > 1 ? `(${k + 1})` : ""}`, isRedef || !!c.redefines);
      if (!(c.redefines && start !== cur)) cur = Math.max(cur, start + csize * c.occurs);
    }
  };
  walk(rec, 0, "", "", false);
  if (fields.length >= maxFields) warnings.push(`Layout truncated at ${maxFields} fields.`);
  return { fields, recordLength: size(rec) * rec.occurs, warnings };
}

// ------------------------------------------------------------------ decoding

export type Encoding = "ebcdic" | "ascii";

function text(bytes: Uint8Array, enc: Encoding): string {
  let s = "";
  for (const b of bytes) s += enc === "ebcdic" ? CP037[b] : String.fromCharCode(b);
  return s;
}

export interface Decoded { value: string; problem?: string }

export function decodeField(f: Field, bytes: Uint8Array, enc: Encoding): Decoded {
  if (f.kind === "alphanumeric" || f.kind === "edited" || f.kind === "group") return { value: text(bytes, enc).replace(/[\u0000-\u001f]/g, " ").trimEnd() };
  if (f.kind === "float") return { value: "", problem: "COMP-1/COMP-2 floating point not decoded" };
  let digits = "", neg = false;
  if (f.usage === "COMP-3") {
    for (let i = 0; i < bytes.length; i++) {
      const hi = bytes[i] >> 4, lo = bytes[i] & 0x0f;
      if (i < bytes.length - 1) { if (hi > 9 || lo > 9) return { value: hex(bytes), problem: "invalid packed decimal digit" }; digits += `${hi}${lo}`; }
      else { if (hi > 9) return { value: hex(bytes), problem: "invalid packed decimal digit" }; digits += `${hi}`; if (![0xc, 0xd, 0xf, 0xa, 0xb, 0xe].includes(lo)) return { value: hex(bytes), problem: "invalid packed sign nibble" }; neg = lo === 0xd || lo === 0xb; }
    }
  } else if (f.usage === "BINARY") {
    let v = 0n;
    for (const b of bytes) v = (v << 8n) | BigInt(b);
    if (f.signed && bytes[0] & 0x80) v -= 1n << BigInt(bytes.length * 8);
    neg = v < 0n;
    digits = (neg ? -v : v).toString();
  } else {
    // zoned decimal
    const arr = [...bytes];
    if (f.signSeparate) {
      const signByte = f.signLeading ? arr.shift() as number : arr.pop() as number;
      const sc = enc === "ebcdic" ? CP037[signByte] : String.fromCharCode(signByte);
      neg = sc === "-";
    }
    for (let i = 0; i < arr.length; i++) {
      const b = arr[i];
      const signPos = f.signed && !f.signSeparate && (f.signLeading ? i === 0 : i === arr.length - 1);
      if (enc === "ebcdic") {
        const zone = b >> 4, d = b & 0x0f;
        if (d > 9) return { value: text(bytes, enc), problem: "not a number" };
        if (signPos) neg = zone === 0xd || zone === 0xb; else if (zone !== 0xf && !(b === 0x40)) return { value: text(bytes, enc), problem: "not a number" };
        digits += b === 0x40 ? "0" : String(d);
      } else {
        const c = String.fromCharCode(b);
        if (/\d/.test(c)) digits += c;
        else if (c === " ") digits += "0";
        else if (signPos && "{ABCDEFGHI".includes(c)) digits += String("{ABCDEFGHI".indexOf(c));
        else if (signPos && "}JKLMNOPQR".includes(c)) { digits += String("}JKLMNOPQR".indexOf(c)); neg = true; }
        else if (signPos && /[p-y]/.test(c)) { digits += String(c.charCodeAt(0) - 112); neg = true; }
        else return { value: text(bytes, enc), problem: "not a number" };
      }
    }
  }
  digits = digits.replace(/^0+(?=\d)/, "") || "0";
  if (f.scale) { digits = digits.padStart(f.scale + 1, "0"); digits = digits.slice(0, -f.scale) + "." + digits.slice(-f.scale); }
  const isZero = !/[1-9]/.test(digits);
  return { value: (neg && !isZero ? "-" : "") + digits, problem: neg && !f.signed ? "negative sign on unsigned field" : undefined };
}

const hex = (b: Uint8Array) => "0x" + [...b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();

export interface DecodeResult { columns: string[]; rows: string[][]; problems: { record: number; field: string; problem: string; raw: string }[]; records: number; leftover: number; recordLength: number }

export function decodeData(fields: Field[], data: Uint8Array, opts: { encoding: Encoding; recordLength: number; rdw?: boolean; includeRedefines?: boolean; maxRecords?: number; lineSeparated?: boolean }): DecodeResult {
  const leaves = fields.filter((f) => f.leaf && (opts.includeRedefines || !f.redefines) && f.name !== "FILLER" && !f.name.startsWith("FILLER("));
  const rows: string[][] = [];
  const problems: DecodeResult["problems"] = [];
  const max = opts.maxRecords ?? 100000;
  let pos = 0, rec = 0;
  const recLen = opts.recordLength;
  while (pos < data.length && rec < max) {
    let len = recLen, start = pos;
    if (opts.rdw) { len = ((data[pos] << 8) | data[pos + 1]) - 4; start = pos + 4; pos = start + len; }
    else if (opts.lineSeparated) {
      let end = pos;
      while (end < data.length && data[end] !== 0x0a) end++;
      start = pos; len = end - pos; if (len && data[end - 1] === 0x0d) len--;
      pos = end + 1;
      if (!len) continue;
    } else { if (pos + recLen > data.length) break; pos += recLen; }
    const recBytes = data.subarray(start, start + len);
    rec++;
    rows.push(leaves.map((f) => {
      if (f.offset + f.length > recBytes.length) { problems.push({ record: rec, field: f.path, problem: "record shorter than layout", raw: "" }); return ""; }
      const d = decodeField(f, recBytes.subarray(f.offset, f.offset + f.length), opts.encoding);
      if (d.problem && problems.length < 500) problems.push({ record: rec, field: f.path, problem: d.problem, raw: hex(recBytes.subarray(f.offset, f.offset + f.length)) });
      return d.value;
    }));
  }
  const leftover = opts.rdw || opts.lineSeparated ? 0 : data.length - rec * recLen;
  return { columns: leaves.map((f) => f.path.split(".").slice(1).join(".") || f.name), rows, problems, records: rec, leftover: rec >= max ? 0 : leftover, recordLength: recLen };
}
