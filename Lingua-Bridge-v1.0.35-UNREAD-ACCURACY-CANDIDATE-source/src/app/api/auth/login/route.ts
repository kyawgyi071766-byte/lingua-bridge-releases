import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rateLimit';
import { emailVerificationRequired, getClientAddress, isCrossSiteRequest, normalizeEmail } from '@/lib/security';
import { ensureCurrentUsage } from '@/lib/usage';
import { ensureDeviceAccess, isLinguaDesktopRequest } from '@/lib/devices';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });

  const ipLimit = await consumeRateLimit('login-ip', getClientAddress(req), 30, 15 * 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';

    if (email) {
      const emailLimit = await consumeRateLimit('login-email', email, 10, 15 * 60_000);
      if (!emailLimit.allowed) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds) } }
        );
      }
    }

    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

    if (emailVerificationRequired() && !user.emailVerifiedAt) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in.', code: 'EMAIL_NOT_VERIFIED', email: user.email },
        { status: 403 }
      );
    }

    const state = await ensureCurrentUsage(user.id);
    if (!state) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    if (isLinguaDesktopRequest(req)) {
      const device = await ensureDeviceAccess(req, user.id, state, { requireDesktopFingerprint: true });
      if (!device.allowed) {
        return NextResponse.json(
          { error: device.error, code: device.code, deviceLimit: device.limit, deviceCount: device.activeCount },
          { status: 403, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, email: user.email, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
