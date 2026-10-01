import { NextResponse } from 'next/server';
import { consumeRateLimit } from '@/lib/rateLimit';
import { getClientAddress, isCrossSiteRequest } from '@/lib/security';
import { DOWNLOAD_COOKIE, downloadCookieValue, downloadGateConfigured, downloadsArePublic, verifyDownloadToken } from '@/lib/downloadAccess';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (downloadsArePublic()) return NextResponse.json({ ok: true, public: true });
  if (!downloadGateConfigured()) return NextResponse.json({ error: 'Private downloads are not configured yet.' }, { status: 503 });

  const rate = await consumeRateLimit('download-access', getClientAddress(req), 12, 15 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (!verifyDownloadToken(body?.token)) return NextResponse.json({ error: 'Invalid or expired download link.' }, { status: 403 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DOWNLOAD_COOKIE, downloadCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
  return response;
}

export async function DELETE(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DOWNLOAD_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
