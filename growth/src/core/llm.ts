// Optional Claude writer. With ANTHROPIC_API_KEY set, agents write real copy for
// the company. Without it, every agent falls back to its built-in demo writer,
// so the whole product runs offline. Nothing an LLM writes is ever published
// without passing the approval gate.

export function llmEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY && process.env.GROWTH_DEMO !== '1';
}

export interface WriteResult {
  text: string;
  source: 'claude' | 'demo';
}

export async function write(
  system: string,
  prompt: string,
  fallback: () => string,
  fetchImpl: typeof fetch = fetch,
): Promise<WriteResult> {
  if (!llmEnabled()) return { text: fallback(), source: 'demo' };
  try {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.HYNIQE_MODEL || 'claude-sonnet-5-5',
        max_tokens: 900,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === 'text')?.text?.trim();
    if (!text) throw new Error('empty response');
    return { text, source: 'claude' };
  } catch (err) {
    // Never block the week on the API: fall back and say so in the logs.
    console.warn(`[growth] Claude call failed, using demo writer: ${(err as Error).message}`);
    return { text: fallback(), source: 'demo' };
  }
}
