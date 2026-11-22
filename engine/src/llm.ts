// Optional Claude fallback for addresses the deterministic parser cannot
// resolve. Disabled unless ANTHROPIC_API_KEY is set. Anything an LLM infers is
// only ever a *suggestion* routed to a human reviewer; it is never auto-applied.

import type { PostalAddress } from './address/parse.ts';

export interface LlmSuggestion {
  address: PostalAddress;
  confidence: number;
  reasoning: string;
}

export function llmEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const SYSTEM = `You convert free-text postal addresses into ISO 20022 PostalAddress24 fields for CBPR+ payments.
Return ONLY a JSON object: {"address": {StrtNm?, BldgNb?, BldgNm?, Flr?, Room?, PstBx?, PstCd?, TwnNm?, CtrySubDvsn?, Ctry?, AdrLine?: string[]}, "confidence": 0..1, "reasoning": "one sentence"}.
Ctry must be an ISO 3166-1 alpha-2 code. Never invent data that is not supported by the input or the supplied bank-account country; if town or country cannot be determined, omit the field and lower confidence.`;

export async function suggestAddress(
  input: { text: string; countryHint?: string | null; bankCountry?: string | null },
  fetchImpl: typeof fetch = fetch,
): Promise<LlmSuggestion | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.HYNIQE_MODEL || 'claude-sonnet-5-5',
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Address text:\n${input.text}\n\nERP country field: ${input.countryHint || 'none'}\nBank account country (from IBAN): ${input.bankCountry || 'unknown'}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[0]) as LlmSuggestion;
    if (!parsed.address || typeof parsed.address !== 'object') return null;
    return { address: parsed.address, confidence: Math.min(Number(parsed.confidence) || 0, 0.79), reasoning: String(parsed.reasoning ?? '') };
  } catch {
    return null;
  }
}
