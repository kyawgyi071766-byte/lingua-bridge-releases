import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { emailConfigured, sendVerificationEmail } from '@/lib/email';
import { consumeRateLimit } from '@/lib/rateLimit';
import {
  emailVerificationRequired,
  getClientAddress,
  hashToken,
  isCrossSiteRequest,
  normalizeEmail,
  randomToken,
  strongPasswordError,
} from '@/lib/security';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });

  const ipLimit = await consumeRateLimit('signup-ip', getClientAddress(req), 8, 15 * 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : undefined;

    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    const passwordError = strongPasswordError(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    const emailLimit = await consumeRateLimit('signup-email', email, 3, 60 * 60_000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts for this email. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds) } }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

    const verifyRequired = emailVerificationRequired();
    if (verifyRequired && !emailConfigured()) {
      console.error('Email verification is required but RESEND_API_KEY/EMAIL_FROM are not configured.');
      return NextResponse.json({ error: 'Account email service is not configured yet.' }, { status: 503 });
    }

    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || '');
    const token = verifyRequired ? randomToken() : '';
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: await hashPassword(password),
        role: adminEmail && email === adminEmail ? 'admin' : 'user',
        emailVerifiedAt: verifyRequired ? null : now,
        verificationTokenHash: verifyRequired ? hashToken(token) : null,
        verificationExpiresAt: verifyRequired ? new Date(now.getTime() + 24 * 60 * 60_000) : null,
      },
    });

    if (verifyRequired) {
      try {
        await sendVerificationEmail(email, token);
      } catch (error) {
        console.error('Verification email error:', error);
        return NextResponse.json(
          { error: 'Account created, but we could not send the verification email. Use “Resend verification” to try again.', needsVerification: true },
          { status: 503 }
        );
      }
      return NextResponse.json({ ok: true, needsVerification: true, email: user.email });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, email: user.email, role: user.role, needsVerification: false });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Could not create the account. Please try again.' }, { status: 500 });
  }
}
