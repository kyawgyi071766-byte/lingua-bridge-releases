import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { hashToken, isCrossSiteRequest, getClientAddress, normalizeEmail } from '@/lib/security';
import { hashEmailCode, isEmailCode, isValidEmailAddress } from '@/lib/emailCodes';
import { consumeRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });

  const ip = getClientAddress(req);
  const limit = await consumeRateLimit('verify-email-ip', ip, 30, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many verification attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const email = normalizeEmail(body.email);
  const numericCode = isEmailCode(token);
  if (!((numericCode && isValidEmailAddress(email)) || /^[a-f0-9]{64}$/i.test(token))) {
    return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
  }

  if (numericCode) {
    const attempts = await consumeRateLimit('verify-email-code', email, 6, 15 * 60_000);
    if (!attempts.allowed) {
      return NextResponse.json({ error: 'Too many verification attempts. Request another code later.' }, { status: 429, headers: { 'Retry-After': String(attempts.retryAfterSeconds) } });
    }
  }

  const tokenHash = numericCode ? hashEmailCode('verify-email', email, token) : hashToken(token);
  const user = await prisma.user.findUnique({ where: { verificationTokenHash: tokenHash } });
  const now = new Date();
  if (!user || user.emailVerifiedAt || !user.verificationExpiresAt || user.verificationExpiresAt <= now) {
    return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
  }

  // Atomically consume the code to prevent replay and parallel double-verification.
  const updated = await prisma.user.updateMany({
    where: { id: user.id, verificationTokenHash: tokenHash, verificationExpiresAt: { gt: now }, emailVerifiedAt: null },
    data: { emailVerifiedAt: now, verificationTokenHash: null, verificationExpiresAt: null },
  });
  if (updated.count !== 1) return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
