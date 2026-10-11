import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hashAccessCode, normalizeAccessCode } from '@/lib/accessCodes';
import { prisma } from '@/lib/prisma';
import { planLimit, voicePlanLimit } from '@/lib/plans';
import { consumeRateLimit } from '@/lib/rateLimit';
import { ensureCurrentUsage } from '@/lib/usage';
import { getClientAddress, isUnsafeCrossOriginRequest } from '@/lib/security';
import { ensureDeviceAccess, isLinguaDesktopRequest, revokeAllActiveDevices } from '@/lib/devices';

export async function POST(req: Request) {
  if (isUnsafeCrossOriginRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in before redeeming a code.' }, { status: 401 });
  if (user.suspended) return NextResponse.json({ error: 'Your account is suspended.' }, { status: 403 });

  const [userRate, ipRate] = await Promise.all([
    consumeRateLimit('redeem-code-user', user.id, 8, 15 * 60_000),
    consumeRateLimit('redeem-code-ip', getClientAddress(req), 20, 15 * 60_000),
  ]);
  if (!userRate.allowed || !ipRate.allowed) {
    const retry = Math.max(userRate.retryAfterSeconds || 0, ipRate.retryAfterSeconds || 0);
    return NextResponse.json(
      { error: 'Too many code attempts. Please wait and try again.' },
      { status: 429, headers: { 'Retry-After': String(retry || 60) } }
    );
  }

  const state = await ensureCurrentUsage(user.id);
  if (!state) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  if (state.grantType === 'purchase' && state.plan !== 'free') {
    return NextResponse.json(
      { error: 'Your purchased plan is already active. Gift codes can be redeemed after the purchased access ends.' },
      { status: 409 }
    );
  }
  if (state.grantType === 'gift_code' && state.plan !== 'free') {
    return NextResponse.json({ error: 'A gift code is already active on this account.' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const rawCode = typeof body.code === 'string' ? body.code : '';
  const normalized = normalizeAccessCode(rawCode);
  if (normalized.length < 20 || normalized.length > 80) {
    return NextResponse.json({ error: 'Enter a valid Lingua gift code.' }, { status: 400 });
  }
  const codeHash = hashAccessCode(rawCode);
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (db) => {
      const code = await db.accessCode.findUnique({ where: { code: codeHash } });
      if (!code || !code.isActive) throw new Error('INVALID_CODE');
      if (code.expiresAt && code.expiresAt <= now) throw new Error('EXPIRED_CODE');
      if (code.usedCount >= code.maxUses) throw new Error('CODE_LIMIT');
      if (code.level !== 'pro' && code.level !== 'business') throw new Error('INVALID_CODE');

      const prior = await db.accessCodeRedemption.findUnique({
        where: { accessCodeId_userId: { accessCodeId: code.id, userId: user.id } },
      });
      if (prior) throw new Error('ALREADY_REDEEMED');

      const current = await db.user.findUnique({
        where: { id: user.id },
        select: { grantType: true, plan: true, suspended: true },
      });
      if (!current || current.suspended) throw new Error('ACCOUNT_BLOCKED');
      if (current.grantType === 'purchase' && current.plan !== 'free') throw new Error('PURCHASE_ACTIVE');
      if (current.grantType === 'gift_code' && current.plan !== 'free') throw new Error('GIFT_ACTIVE');

      await db.accessCode.update({ where: { id: code.id }, data: { usedCount: { increment: 1 } } });
      await db.accessCodeRedemption.create({
        data: {
          accessCodeId: code.id,
          userId: user.id,
          level: code.level,
          expiresAt: code.expiresAt,
        },
      });
      const updated = await db.user.update({
        where: { id: user.id },
        data: {
          plan: code.level,
          paidUntil: code.expiresAt,
          grantType: 'gift_code',
          accessCodeId: code.id,
        },
        select: { plan: true, paidUntil: true, grantType: true },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // A gift grant starts with a clean one-device slot. Historical paid devices
    // are revoked so the newly activated code cannot inherit two old paid slots.
    await revokeAllActiveDevices(user.id);
    if (isLinguaDesktopRequest(req)) {
      const device = await ensureDeviceAccess(req, user.id, { plan: result.plan, grantType: result.grantType }, { requireDesktopFingerprint: true });
      if (!device.allowed) {
        return NextResponse.json({ error: device.error, code: device.code }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
      }
    }

    return NextResponse.json({
      ok: true,
      plan: result.plan,
      grantType: result.grantType,
      paidUntil: result.paidUntil?.toISOString() ?? null,
      charLimit: planLimit(result.plan),
      voiceLimit: voicePlanLimit(result.plan),
      liveMode: true,
      message: result.paidUntil
        ? `${result.plan.toUpperCase()} gift access activated until ${result.paidUntil.toISOString().slice(0, 10)}.`
        : `${result.plan.toUpperCase()} permanent gift access activated.`,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const map: Record<string, [string, number]> = {
      INVALID_CODE: ['Gift code is invalid or has been deactivated.', 400],
      EXPIRED_CODE: ['This gift code has expired.', 410],
      CODE_LIMIT: ['This gift code has already reached its usage limit.', 409],
      ALREADY_REDEEMED: ['This code has already been redeemed by your account.', 409],
      ACCOUNT_BLOCKED: ['This account cannot redeem a code right now.', 403],
      PURCHASE_ACTIVE: ['Your purchased plan is already active.', 409],
      GIFT_ACTIVE: ['A gift code is already active on this account.', 409],
    };
    const known = map[code];
    if (known) return NextResponse.json({ error: known[0] }, { status: known[1] });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return NextResponse.json({ error: 'Another redemption happened at the same time. Please try once more.' }, { status: 409 });
    }
    console.error('Access code redemption failed:', error);
    return NextResponse.json({ error: 'Could not redeem this code right now.' }, { status: 500 });
  }
}
