// Tiny CSV reader/writer shared by every Hyniqe Hub solution.
// Runs unchanged in Node and in the browser (no dependencies).

export type Row = Record<string, string>;

/** Parse CSV text into rows keyed by lower-cased, trimmed header names. Handles quotes, BOM, CRLF and ; or tab separators. */
export function parseCsv(text: string): Row[] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const sep = pickSeparator(firstLine);
  const cells: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      cells.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    cells.push(row);
  }
  const nonEmpty = cells.filter((r) => r.some((c) => c.trim() !== ''));
  if (!nonEmpty.length) return [];
  const header = nonEmpty[0].map(normHeader);
  return nonEmpty.slice(1).map((r) => {
    const o: Row = {};
    header.forEach((h, i) => {
      if (h) o[h] = (r[i] ?? '').trim();
    });
    return o;
  });
}

function pickSeparator(line: string): string {
  const counts = [',', ';', '\t', '|'].map((s) => [s, line.split(s).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

export function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Return the first non-empty value among several possible column names. */
export function pick(row: Row, ...names: string[]): string {
  for (const n of names) {
    const v = row[n];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}
