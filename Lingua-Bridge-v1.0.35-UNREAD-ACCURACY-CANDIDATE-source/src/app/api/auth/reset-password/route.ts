import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { hashToken, isCrossSiteRequest, strongPasswordError, getClientAddress, normalizeEmail } from '@/lib/security';
import { hashEmailCode, isEmailCode, isValidEmailAddress } from '@/lib/emailCodes';
import { consumeRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });

  const limit = await consumeRateLimit('reset-password-ip', getClientAddress(req), 30, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many password reset attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } });
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const numericCode = isEmailCode(token);
  if (!((numericCode && isValidEmailAddress(email)) || /^[a-f0-9]{64}$/i.test(token))) {
    return NextResponse.json({ error: 'Invalid or expired reset code.' }, { status: 400 });
  }

  if (numericCode) {
    const attempts = await consumeRateLimit('reset-password-code', email, 6, 15 * 60_000);
    if (!attempts.allowed) {
      return NextResponse.json({ error: 'Too many reset attempts. Request another code later.' }, { status: 429, headers: { 'Retry-After': String(attempts.retryAfterSeconds) } });
    }
  }

  const passwordError = strongPasswordError(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const tokenHash = numericCode ? hashEmailCode('reset-password', email, token) : hashToken(token);
  const user = await prisma.user.findUnique({ where: { resetTokenHash: tokenHash } });
  const now = new Date();
  if (!user || !user.resetExpiresAt || user.resetExpiresAt <= now) {
    return NextResponse.json({ error: 'Invalid or expired reset code.' }, { status: 400 });
  }

  const updated = await prisma.user.updateMany({
    where: { id: user.id, resetTokenHash: tokenHash, resetExpiresAt: { gt: now } },
    data: {
      passwordHash: await hashPassword(password),
      resetTokenHash: null,
      resetExpiresAt: null,
      sessionVersion: { increment: 1 },
      // Successful recovery proves control over the mailbox.
      emailVerifiedAt: user.emailVerifiedAt || now,
    },
  });
  if (updated.count !== 1) return NextResponse.json({ error: 'Invalid or expired reset code.' }, { status: 400 });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
