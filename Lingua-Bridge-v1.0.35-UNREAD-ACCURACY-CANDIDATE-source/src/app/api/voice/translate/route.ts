import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureCurrentUsage } from '@/lib/usage';
import { ensureDeviceAccess, isLinguaDesktopRequest } from '@/lib/devices';
import { voicePlanLimit } from '@/lib/plans';
import { translateText, TranslationInputError } from '@/lib/translator';
import { consumeRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) {
    return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in to use Voice Translator.' }, { status: 401 });
  if (user.suspended) {
    return NextResponse.json(
      { error: 'Your account is temporarily suspended. Contact support via the chat widget.' },
      { status: 403 }
    );
  }

  const state = await ensureCurrentUsage(user.id);
  if (!state) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  if (state.suspended) {
    return NextResponse.json(
      { error: 'Your account is temporarily suspended. Contact support via the chat widget.' },
      { status: 403 }
    );
  }

  if (isLinguaDesktopRequest(req)) {
    const device = await ensureDeviceAccess(req, user.id, state, { requireDesktopFingerprint: true });
    if (!device.allowed) {
      return NextResponse.json(
        { error: device.error, code: device.code, deviceLimit: device.limit, deviceCount: device.activeCount },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  const minuteLimit = state.plan === 'business' ? 90 : state.plan === 'pro' ? 45 : 15;
  const rate = await consumeRateLimit('voice-user', user.id, minuteLimit, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many voice translation requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const targetLang = typeof body.targetLang === 'string' ? body.targetLang : '';
  const sourceLang = typeof body.sourceLang === 'string' ? body.sourceLang : undefined;

  if (!text || !targetLang) {
    return NextResponse.json({ error: 'Voice transcript and target language are required.' }, { status: 400 });
  }
  // A voice item is intended to be <= 30 seconds. Transcript length is also capped
  // server-side so one voice use cannot be abused as a long-document translation.
  if (text.length > 1500) {
    return NextResponse.json({ error: 'Voice transcript is too long. Keep each voice item to about 30 seconds.' }, { status: 400 });
  }

  const limit = voicePlanLimit(state.plan);
  if (limit <= 0 || state.voiceUses >= limit) {
    return NextResponse.json(
      {
        error: `Monthly voice translation allowance reached for your ${state.plan} plan. Upgrade to continue.`,
        upgrade: true,
        plan: state.plan,
        used: state.voiceUses,
        limit,
        remaining: 0,
      },
      { status: 402 }
    );
  }

  const reservation = await prisma.user.updateMany({
    where: { id: user.id, voiceUses: { lte: limit - 1 } },
    data: { voiceUses: { increment: 1 } },
  });
  if (reservation.count !== 1) {
    return NextResponse.json(
      { error: 'Monthly voice translation allowance reached. Upgrade to continue.', upgrade: true },
      { status: 402 }
    );
  }

  try {
    const result = await translateText(text, targetLang, sourceLang);
    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: { voiceUses: true, plan: true },
    });
    const used = refreshed?.voiceUses ?? state.voiceUses + 1;
    return NextResponse.json({
      ok: true,
      translated: result.text,
      provider: result.provider,
      detectedSource: result.detectedSource,
      plan: refreshed?.plan ?? state.plan,
      used,
      limit,
      remaining: Math.max(0, limit - used),
    });
  } catch (error) {
    await prisma.user.updateMany({
      where: { id: user.id, voiceUses: { gte: 1 } },
      data: { voiceUses: { decrement: 1 } },
    }).catch(() => {});

    if (error instanceof TranslationInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Voice translation failed. Please try again.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
