import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailConfigured, sendVerificationEmail } from '@/lib/email';
import { consumeRateLimit } from '@/lib/rateLimit';
import { getClientAddress, hashToken, isCrossSiteRequest, normalizeEmail, randomToken } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (!emailConfigured()) return NextResponse.json({ error: 'Email service is not configured yet.' }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const key = email || getClientAddress(req);
  const rate = await consumeRateLimit('resend-verification', key, 3, 60 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Please wait before requesting another verification email.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (user && !user.emailVerifiedAt) {
    const token = randomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationTokenHash: hashToken(token),
        verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60_000),
      },
    });
    try {
      await sendVerificationEmail(user.email, token);
    } catch (error) {
      console.error('Resend verification error:', error);
      return NextResponse.json({ error: 'Could not send verification email right now.' }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: true, message: 'If that account needs verification, a new email has been sent.' });
}
