import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/security';

export const runtime = 'nodejs';
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg']);
const EXTENSIONS = new Set(['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg']);

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (user.suspended) return NextResponse.json({ error: 'Account suspended.' }, { status: 403 });
  const rate = await consumeRateLimit('audio-transcribe-user', user.id, 10, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Too many uploads.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const length = Number(req.headers.get('content-length') || 0);
  if (length > MAX_AUDIO_BYTES + 4096) return NextResponse.json({ error: 'Audio file too large (10 MB maximum).' }, { status: 413 });
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Audio file required.' }, { status: 400 });
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!EXTENSIONS.has(extension) || !TYPES.has(file.type) || file.size === 0 || file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Unsupported audio format or size (10 MB maximum).' }, { status: 400 });
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: 'Audio transcription is not configured.' }, { status: 503 });
  const upstreamForm = new FormData();
  upstreamForm.set('file', file, file.name);
  upstreamForm.set('model', 'whisper-1');
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: upstreamForm,
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) return NextResponse.json({ error: 'Transcription service unavailable.' }, { status: 502 });
    const data = await response.json();
    const text = typeof data.text === 'string' ? data.text.trim() : '';
    if (!text) return NextResponse.json({ error: 'No speech detected.' }, { status: 422 });
    return NextResponse.json({ text }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Transcription failed. Please try again.' }, { status: 502 });
  }
}
