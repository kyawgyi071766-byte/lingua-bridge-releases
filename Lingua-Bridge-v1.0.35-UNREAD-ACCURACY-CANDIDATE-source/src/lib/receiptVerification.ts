import { cryptoConfig } from './cryptoPayments';

export type ReceiptReview = {
  verdict: 'consistent' | 'suspicious' | 'unreadable' | 'unavailable';
  confidence: number;
  amount: string | null;
  network: string | null;
  txHash: string | null;
  destination: string | null;
  concerns: string[];
  summary: string;
};

function configured(value?: string) {
  return Boolean(value && !value.startsWith('replace-'));
}

function cleanJsonText(value: string) {
  let text = String(value || '').trim();
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) text = fenced[1].trim();
  return text;
}

function normalizeReview(value: any): ReceiptReview {
  const rawVerdict = String(value?.verdict || '').toLowerCase();
  const verdict: ReceiptReview['verdict'] = rawVerdict === 'consistent' || rawVerdict === 'suspicious' || rawVerdict === 'unreadable'
    ? rawVerdict
    : 'unreadable';
  const confidence = Math.max(0, Math.min(1, Number(value?.confidence ?? 0) || 0));
  const textOrNull = (item: unknown) => typeof item === 'string' && item.trim() ? item.trim().slice(0, 500) : null;
  const concerns = Array.isArray(value?.concerns)
    ? value.concerns.filter((item: unknown) => typeof item === 'string').map((item: string) => item.trim().slice(0, 240)).filter(Boolean).slice(0, 8)
    : [];
  return {
    verdict,
    confidence,
    amount: textOrNull(value?.amount),
    network: textOrNull(value?.network),
    txHash: textOrNull(value?.txHash),
    destination: textOrNull(value?.destination),
    concerns,
    summary: textOrNull(value?.summary) || 'Receipt image review completed.',
  };
}

function modelCandidates() {
  return [...new Set([
    process.env.GEMINI_RECEIPT_MODEL?.trim(),
    'gemini-3.8-flash',
    process.env.GEMINI_TRANSLATE_MODEL?.trim(),
    'gemini-3.5-flash-lite',
  ].filter(Boolean) as string[])];
}

export async function reviewPaymentReceipt(args: {
  bytes: Buffer;
  mimeType: string;
  expectedAmount: string;
  expectedNetwork: string;
  claimedAt: Date;
}): Promise<ReceiptReview> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!configured(key)) {
    return {
      verdict: 'unavailable', confidence: 0, amount: null, network: null, txHash: null,
      destination: null, concerns: ['AI receipt screening is not configured.'],
      summary: 'Receipt image screening is unavailable; blockchain verification is still required.',
    };
  }

  const { walletAddress } = cryptoConfig();
  const prompt = [
    'Review this payment receipt image only as a fraud-screening assistant. Do NOT claim that payment was received or confirmed from the image alone.',
    'Extract visible payment facts and look for obvious inconsistencies, edits, reused-looking content, impossible fields, mismatched network/amount/destination, or unreadable details.',
    `Expected amount: ${args.expectedAmount} USDT.`,
    `Expected network: ${args.expectedNetwork}.`,
    `Expected destination wallet: ${walletAddress}.`,
    `Payment claim created at: ${args.claimedAt.toISOString()}.`,
    'Return JSON only with: verdict (consistent|suspicious|unreadable), confidence (0..1), amount (string|null), network (string|null), txHash (string|null), destination (string|null), concerns (string[]), summary (string).',
    'A visually convincing receipt is NOT proof of payment. Final confirmation must come from an independent blockchain lookup.',
  ].join('\n');

  const data = args.bytes.toString('base64');
  let lastError: unknown;
  for (const model of modelCandidates()) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': key!, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [
            { inline_data: { mime_type: args.mimeType, data } },
            { text: prompt },
          ] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1200, responseMimeType: 'application/json' },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        lastError = new Error(`Gemini receipt review failed with HTTP ${response.status}: ${detail.slice(0, 180)}`);
        if (response.status === 404 || response.status === 429 || response.status >= 500) continue;
        break;
      }
      const body = await response.json().catch(() => ({}));
      const raw = Array.isArray(body?.candidates?.[0]?.content?.parts)
        ? body.candidates[0].content.parts.map((part: any) => typeof part?.text === 'string' ? part.text : '').join('').trim()
        : '';
      if (!raw) throw new Error('Gemini receipt review returned no text.');
      return normalizeReview(JSON.parse(cleanJsonText(raw)));
    } catch (error) {
      lastError = error;
    }
  }

  console.error('Receipt AI review unavailable:', lastError);
  return {
    verdict: 'unavailable', confidence: 0, amount: null, network: null, txHash: null,
    destination: null, concerns: ['AI receipt screening is temporarily unavailable.'],
    summary: 'Receipt image screening could not complete; blockchain verification is still required.',
  };
}
