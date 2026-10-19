import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailConfigured, sendPasswordResetEmail } from '@/lib/email';
import { EMAIL_CODE_TTL_MS, generateEmailCode, hashEmailCode } from '@/lib/emailCodes';
import { consumeRateLimit } from '@/lib/rateLimit';
import { getClientAddress, isCrossSiteRequest, normalizeEmail } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (!emailConfigured()) return NextResponse.json({ error: 'Password reset email is not configured yet.' }, { status: 503 });

  // A rotating list of email addresses must not bypass per-IP email abuse limits.
  const ipRate = await consumeRateLimit('forgot-password-ip', getClientAddress(req), 15, 60 * 60_000);
  if (!ipRate.allowed) {
    return NextResponse.json({ error: 'Too many email requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(ipRate.retryAfterSeconds) } });
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const key = email || getClientAddress(req);
  const rate = await consumeRateLimit('forgot-password', key, 3, 60 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Please wait before requesting another reset email.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (user) {
    const previousHash = user.resetTokenHash;
    const previousExpiry = user.resetExpiresAt;
    const token = generateEmailCode();
    const pendingHash = hashEmailCode('reset-password', user.email, token);
    const pendingExpiry = new Date(Date.now() + EMAIL_CODE_TTL_MS);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: pendingHash, resetExpiresAt: pendingExpiry },
    });
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (error) {
      // Restore only this undelivered issuance. A newer request or a consumed
      // code must never be overwritten by an earlier failed send.
      await prisma.user.updateMany({
        where: { id: user.id, resetTokenHash: pendingHash, resetExpiresAt: pendingExpiry },
        data: { resetTokenHash: previousHash, resetExpiresAt: previousExpiry },
      });
      console.error('Password reset email error:', error);
      return NextResponse.json({ error: 'Could not send reset email right now.' }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: true, message: 'If an account exists for that email, a six-digit reset code has been sent.' });
}
