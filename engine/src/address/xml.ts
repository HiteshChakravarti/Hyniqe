// Render a PostalAddress24 block as it would appear inside a pacs.008 party.
import type { PostalAddress } from './parse.ts';

const ORDER: (keyof PostalAddress)[] = ['Dept', 'StrtNm', 'BldgNb', 'BldgNm', 'Flr', 'PstBx', 'Room', 'PstCd', 'TwnNm', 'CtrySubDvsn', 'Ctry'] as (keyof PostalAddress)[];

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function toPstlAdrXml(a: PostalAddress, indent = ''): string {
  const lines = [`${indent}<PstlAdr>`];
  for (const k of ORDER) {
    const v = a[k];
    if (typeof v === 'string' && v) lines.push(`${indent}  <${k}>${esc(v)}</${k}>`);
  }
  for (const l of a.AdrLine ?? []) lines.push(`${indent}  <AdrLine>${esc(l)}</AdrLine>`);
  lines.push(`${indent}</PstlAdr>`);
  return lines.join('\n');
}
