import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { countCharacters, translateText, TranslationInputError } from '@/lib/translator';
import { planLimit } from '@/lib/plans';
import { consumeRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/security';
import { ensureCurrentUsage } from '@/lib/usage';
import { ensureDeviceAccess, isLinguaDesktopRequest } from '@/lib/devices';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in to translate.' }, { status: 401 });
  if (user.suspended) {
    return NextResponse.json(
      { error: 'Your account is temporarily suspended. Contact support via the chat widget.' },
      { status: 403 }
    );
  }

  const usageState = await ensureCurrentUsage(user.id);
  if (!usageState) return NextResponse.json({ error: 'Account not found.' }, { status: 401 });
  if (usageState.suspended) {
    return NextResponse.json(
      { error: 'Your account is temporarily suspended. Contact support via the chat widget.' },
      { status: 403 }
    );
  }

  if (isLinguaDesktopRequest(req)) {
    const device = await ensureDeviceAccess(req, user.id, usageState, { requireDesktopFingerprint: true });
    if (!device.allowed) {
      return NextResponse.json(
        { error: device.error, code: device.code, deviceLimit: device.limit, deviceCount: device.activeCount },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  const minuteLimit = usageState.plan === 'business' ? 180 : usageState.plan === 'pro' ? 120 : 60;
  const rate = await consumeRateLimit('translate-user', user.id, minuteLimit, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many translation requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === 'string' ? body.text : '';
  const targetLang = typeof body.targetLang === 'string' ? body.targetLang : '';
  const sourceLang = typeof body.sourceLang === 'string' ? body.sourceLang : undefined;
  const charCount = countCharacters(text);

  if (!text.trim() || !targetLang) return NextResponse.json({ error: 'Text and target language are required.' }, { status: 400 });
  if (charCount > 5000) return NextResponse.json({ error: 'Text too long. Max 5000 characters per request.' }, { status: 400 });

  const usageChars = usageState.usageChars;
  const limit = planLimit(usageState.plan);
  if (limit <= 0 || charCount > limit) {
    return NextResponse.json({ error: 'Your current plan has no remaining translation allowance. Upgrade to continue.', upgrade: true }, { status: 402 });
  }

  try {
    const preview = sourceLang && sourceLang !== 'auto' && sourceLang.toLowerCase() === targetLang.toLowerCase();
    if (preview) {
      const result = await translateText(text, targetLang, sourceLang);
      return NextResponse.json({ ok: true, translated: result.text, provider: result.provider, detectedSource: result.detectedSource, used: usageChars, limit });
    }

    const reservation = await prisma.user.updateMany({
      where: { id: user.id, usageChars: { lte: limit - charCount } },
      data: { usageChars: { increment: charCount } },
    });
    if (reservation.count !== 1) {
      return NextResponse.json(
        { error: `Monthly limit reached for your ${usageState.plan} plan. Upgrade to continue.`, upgrade: true },
        { status: 402 }
      );
    }

    try {
      const result = await translateText(text, targetLang, sourceLang);
      const refreshed = await prisma.user.findUnique({ where: { id: user.id }, select: { usageChars: true } });
      const used = refreshed?.usageChars ?? usageChars + charCount;
      return NextResponse.json({ ok: true, translated: result.text, provider: result.provider, detectedSource: result.detectedSource, used, limit });
    } catch (error) {
      await prisma.user.updateMany({
        where: { id: user.id, usageChars: { gte: charCount } },
        data: { usageChars: { decrement: charCount } },
      }).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof TranslationInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    const message = error instanceof Error ? error.message : 'Translation failed. Please try again.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
