import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (user.suspended) return NextResponse.json({ error: 'Account suspended.' }, { status: 403 });
  const rate = await consumeRateLimit('voice-speak-user', user.id, 10, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Too many speech requests.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 1500) return NextResponse.json({ error: 'Speech text must be 1–1500 characters.' }, { status: 400 });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'Speech synthesis is not configured.' }, { status: 503 });
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', voice: 'alloy', input: text, response_format: 'mp3' }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) return NextResponse.json({ error: 'Speech service unavailable.' }, { status: 502 });
    return new Response(response.body, { status: 200, headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'Content-Disposition': 'inline; filename="lingua-translation.mp3"' } });
  } catch {
    return NextResponse.json({ error: 'Speech synthesis failed.' }, { status: 502 });
  }
}
