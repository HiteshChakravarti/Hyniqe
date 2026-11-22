// Reads an MT103 (with or without the Swift header blocks).
import { emptyParty, emptyPayment, type Party, type Payment } from './model.ts';

export interface MtField {
  tag: string;
  value: string;
}

/** Splits block 4 into fields. Continuation lines belong to the field above. */
export function mtFields(text: string): MtField[] {
  const start = text.indexOf('{4:');
  let body = start >= 0 ? text.slice(start + 3) : text;
  const end = body.search(/\n-\}|^-\}/m);
  if (end >= 0) body = body.slice(0, end);
  const out: MtField[] = [];
  for (const raw of body.replace(/\r/g, '').split('\n')) {
    const m = /^:(\d{2}[A-Z]?):(.*)$/.exec(raw);
    if (m) out.push({ tag: m[1], value: m[2] });
    else if (out.length && raw.trim() !== '-' && raw.trim() !== '-}') out[out.length - 1].value += '\n' + raw;
  }
  return out;
}

const ltToBic = (lt: string): string => (lt.length >= 12 ? lt.slice(0, 8) + lt.slice(9, 12) : lt).replace(/XXX$/, '');

export function mtHeaders(text: string): { sender: string; receiver: string; uetr: string; type: string } {
  const b1 = /\{1:F01([A-Z0-9]{12})/.exec(text);
  const b2 = /\{2:(I|O)(\d{3})([A-Z0-9]+)/.exec(text);
  const uetr = /\{121:([0-9a-fA-F-]{36})\}/.exec(text)?.[1] ?? '';
  let sender = '', receiver = '';
  if (b2?.[1] === 'I') {
    sender = b1 ? ltToBic(b1[1]) : '';
    receiver = ltToBic(b2[3].slice(0, 12));
  } else if (b2?.[1] === 'O') {
    receiver = b1 ? ltToBic(b1[1]) : '';
    sender = ltToBic(b2[3].slice(10, 22));
  }
  return { sender, receiver, uetr: uetr.toLowerCase(), type: b2?.[2] ?? '' };
}

const BIC_LINE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

function party(tag: string, value: string): Party {
  const p = emptyParty();
  const lines = value.split('\n').map((l) => l.trimEnd());
  if (lines[0]?.startsWith('/')) p.account = lines.shift()!.replace(/^\/+/, '').trim();
  const opt = tag.slice(2);
  if (opt === 'A') {
    p.bic = (lines.find((l) => BIC_LINE.test(l.trim())) ?? '').trim();
  } else if (opt === 'F') {
    for (const l of lines) {
      const m = /^(\d)\/(.*)$/.exec(l);
      if (!m) continue;
      if (m[1] === '1') p.name = (p.name ? p.name + ' ' : '') + m[2].trim();
      else if (m[1] === '2') p.lines.push(m[2].trim());
      else if (m[1] === '3') {
        const [ctry, ...rest] = m[2].split('/');
        p.country = ctry.trim();
        p.town = rest.join('/').trim();
      }
    }
  } else {
    p.name = (lines.shift() ?? '').trim();
    p.lines = lines.map((l) => l.trim()).filter(Boolean);
  }
  return p;
}

const agent = (value: string): string => {
  const lines = value.split('\n').map((l) => l.trim());
  return lines.find((l) => BIC_LINE.test(l)) ?? lines.filter((l) => !l.startsWith('/')).join(', ');
};

export const mtAmount = (s: string): number | null => {
  const t = s.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$/.test(t)) return null;
  return Number(t);
};

export function parseMt103(text: string): { payment: Payment; fields: MtField[]; type: string } {
  const p = emptyPayment('MT103');
  const h = mtHeaders(text);
  Object.assign(p, { sender: h.sender, receiver: h.receiver, uetr: h.uetr });
  const fields = mtFields(text);
  for (const f of fields) {
    const v = f.value.trim();
    switch (f.tag) {
      case '20': p.ref = v; break;
      case '23B': p.bankOperation = v; break;
      case '32A': {
        const m = /^(\d{2})(\d{2})(\d{2})([A-Z]{3})([\d,]+)$/.exec(v.replace(/\s/g, ''));
        if (m) {
          p.valueDate = `20${m[1]}-${m[2]}-${m[3]}`;
          p.currency = m[4];
          p.amount = mtAmount(m[5]);
        }
        break;
      }
      case '33B': {
        const m = /^([A-Z]{3})([\d,]+)$/.exec(v);
        if (m) {
          p.instructedCurrency = m[1];
          p.instructedAmount = mtAmount(m[2]);
        }
        break;
      }
      case '36': p.rate = v.replace(',', '.'); break;
      case '50A': case '50F': case '50K': p.debtor = party(f.tag, f.value); break;
      case '52A': case '52D': p.debtorAgent = agent(f.value); break;
      case '56A': case '56D': p.intermediary = agent(f.value); break;
      case '57A': case '57D': p.creditorAgent = agent(f.value); break;
      case '59': case '59A': case '59F': p.creditor = party(f.tag === '59' ? '59K' : f.tag, f.value); break;
      case '70': p.remittance = f.value.split('\n').map((l) => l.trim()).join(' ').trim(); break;
      case '71A': p.charges = v; break;
      case '71F': p.senderCharges.push(v.replace(',', '.')); break;
      case '72': p.bankInfo = f.value.split('\n').map((l) => l.trim()).join(' ').trim(); break;
      case '77B': p.regulatory = f.value.split('\n').map((l) => l.trim()).join(' ').trim(); break;
    }
  }
  return { payment: p, fields, type: h.type || '103' };
}
