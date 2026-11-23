import { prisma } from './prisma';
import { requestFingerprint } from './security';
import type { TranslationProvider } from './translator';

type NetworkProvider = Exclude<TranslationProvider, 'identity'>;

const PROVIDERS: NetworkProvider[] = ['deepl', 'gemini', 'microsoft', 'google'];

function currentPeriod(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

function nextPeriodStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

function keyFor(kind: string, provider: NetworkProvider, period?: string) {
  return requestFingerprint(`translation-provider-${kind}`, period ? `${provider}:${period}` : provider);
}

function monthlyLimit(provider: NetworkProvider): number {
  const envName = {
    deepl: 'DEEPL_MONTHLY_CHAR_LIMIT',
    gemini: 'GEMINI_MONTHLY_CHAR_LIMIT',
    microsoft: 'MICROSOFT_TRANSLATOR_MONTHLY_CHAR_LIMIT',
    google: 'GOOGLE_TRANSLATE_MONTHLY_CHAR_LIMIT',
  }[provider];
  const configured = process.env[envName]?.trim();
  if (configured) {
    const parsed = Number(configured);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
  }

  // Leave a safety margin below the 500k monthly ceiling on DeepL API Free.
  // Paid DeepL plans are not capped unless the owner configures an explicit limit.
  if (provider === 'deepl' && process.env.DEEPL_API_KEY?.trim().endsWith(':fx')) return 450_000;
  // Cloud Translation Basic (v2) has a first-500k monthly free usage credit.
  // Keep Lingua below that ceiling by default; other callers may share the project.
  if (provider === 'google') return 450_000;
  return 0;
}

async function ensureBucket(key: string, resetAt: Date) {
  try {
    await prisma.rateLimitBucket.create({ data: { key, count: 0, resetAt } });
  } catch (error) {
    // Ignore only the expected unique-key race; surface database failures.
    const existing = await prisma.rateLimitBucket.findUnique({ where: { key }, select: { key: true } });
    if (!existing) throw error;
  }
}

async function incrementBucket(key: string, amount: number, resetAt: Date) {
  await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: amount, resetAt },
    update: { count: { increment: amount }, resetAt },
  });
}

export type ProviderReservation =
  | { allowed: true; limit: number | null; used: number }
  | { allowed: false; reason: 'cooldown' | 'monthly-budget'; limit: number | null; used: number; retryAt?: string };

export async function reserveTranslationProvider(
  provider: NetworkProvider,
  characters: number
): Promise<ProviderReservation> {
  const now = new Date();
  const period = currentPeriod(now);
  const resetAt = nextPeriodStart(now);
  const cooldownKey = keyFor('cooldown', provider);
  const cooldown = await prisma.rateLimitBucket.findUnique({
    where: { key: cooldownKey },
    select: { resetAt: true },
  });
  if (cooldown && cooldown.resetAt > now) {
    const usage = await prisma.rateLimitBucket.findUnique({
      where: { key: keyFor('characters', provider, period) },
      select: { count: true },
    });
    return {
      allowed: false,
      reason: 'cooldown',
      limit: monthlyLimit(provider) || null,
      used: usage?.count ?? 0,
      retryAt: cooldown.resetAt.toISOString(),
    };
  }

  const limit = monthlyLimit(provider);
  const usageKey = keyFor('characters', provider, period);
  await ensureBucket(usageKey, resetAt);

  const where: {
    key: string;
    resetAt: { gt: Date };
    count?: { lte: number };
  } = { key: usageKey, resetAt: { gt: now } };
  if (limit > 0) where.count = { lte: limit - characters };

  const reserved = await prisma.rateLimitBucket.updateMany({
    where,
    data: { count: { increment: characters } },
  });

  if (reserved.count !== 1) {
    const usage = await prisma.rateLimitBucket.findUnique({
      where: { key: usageKey },
      select: { count: true },
    });
    return {
      allowed: false,
      reason: 'monthly-budget',
      limit: limit || null,
      used: usage?.count ?? 0,
    };
  }

  await incrementBucket(keyFor('requests', provider, period), 1, resetAt);
  return { allowed: true, limit: limit || null, used: (await prisma.rateLimitBucket.findUnique({
    where: { key: usageKey },
    select: { count: true },
  }))?.count ?? characters };
}

export async function recordTranslationProviderSuccess(provider: NetworkProvider) {
  const now = new Date();
  const streakKey = keyFor('failure-streak', provider, currentPeriod(now));
  await prisma.rateLimitBucket.updateMany({
    where: { key: streakKey },
    data: { count: 0, resetAt: nextPeriodStart(now) },
  });
  await prisma.rateLimitBucket.deleteMany({ where: { key: keyFor('cooldown', provider) } });
}

export async function recordTranslationProviderFailure(
  provider: NetworkProvider,
  details: { status?: number; retryAfterMs?: number; timedOut?: boolean }
) {
  const now = new Date();
  const period = currentPeriod(now);
  const resetAt = nextPeriodStart(now);
  await incrementBucket(keyFor('failures', provider, period), 1, resetAt);

  const status = details.status;
  const timeoutOrServerFailure = details.timedOut || status === 408 || status === 425 || (typeof status === 'number' && status >= 500);
  const quotaFailure = status === 429 || status === 456;
  const credentialFailure = status === 401 || status === 403;
  if (!timeoutOrServerFailure && !quotaFailure && !credentialFailure) return;

  const streakKey = keyFor('failure-streak', provider, period);
  await incrementBucket(streakKey, 1, resetAt);
  const streak = await prisma.rateLimitBucket.findUnique({
    where: { key: streakKey },
    select: { count: true },
  });
  const consecutiveFailures = streak?.count ?? 1;

  let cooldownUntil: Date | null = null;
  if (status === 456) {
    // DeepL quota exhaustion is not helped by retrying on every serverless instance.
    cooldownUntil = resetAt;
  } else if (quotaFailure) {
    const requested = Math.max(1_000, Math.min(details.retryAfterMs || 60_000, 5 * 60_000));
    cooldownUntil = new Date(now.getTime() + requested);
  } else if (credentialFailure) {
    cooldownUntil = new Date(now.getTime() + 5 * 60_000);
  } else if (consecutiveFailures >= 2) {
    cooldownUntil = new Date(now.getTime() + 60_000);
  }

  if (cooldownUntil) {
    const cooldownKey = keyFor('cooldown', provider);
    await prisma.rateLimitBucket.upsert({
      where: { key: cooldownKey },
      create: { key: cooldownKey, count: consecutiveFailures, resetAt: cooldownUntil },
      update: { count: consecutiveFailures, resetAt: cooldownUntil },
    });
  }
}

export async function getTranslationProviderUsageStatus() {
  const now = new Date();
  const period = currentPeriod(now);
  const providers = await Promise.all(PROVIDERS.map(async (provider) => {
    const [characters, requests, failures, cooldown] = await Promise.all([
      prisma.rateLimitBucket.findUnique({ where: { key: keyFor('characters', provider, period) }, select: { count: true } }),
      prisma.rateLimitBucket.findUnique({ where: { key: keyFor('requests', provider, period) }, select: { count: true } }),
      prisma.rateLimitBucket.findUnique({ where: { key: keyFor('failures', provider, period) }, select: { count: true } }),
      prisma.rateLimitBucket.findUnique({ where: { key: keyFor('cooldown', provider) }, select: { resetAt: true } }),
    ]);
    const limit = monthlyLimit(provider);
    const used = characters?.count ?? 0;
    return {
      provider,
      charactersUsed: used,
      monthlyLimit: limit || null,
      charactersRemaining: limit > 0 ? Math.max(0, limit - used) : null,
      requests: requests?.count ?? 0,
      failures: failures?.count ?? 0,
      cooldownUntil: cooldown && cooldown.resetAt > now ? cooldown.resetAt.toISOString() : null,
    };
  }));

  return { period, providers };
}
