import { prisma } from './prisma';
import { requestFingerprint } from './security';

type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export async function consumeRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const key = requestFingerprint(scope, identifier || 'unknown');

  const active = await prisma.rateLimitBucket.updateMany({
    where: { key, resetAt: { gt: now }, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });
  if (active.count === 1) return { allowed: true, retryAfterSeconds: 0 };

  const restarted = await prisma.rateLimitBucket.updateMany({
    where: { key, resetAt: { lte: now } },
    data: { count: 1, resetAt },
  });
  if (restarted.count === 1) return { allowed: true, retryAfterSeconds: 0 };

  try {
    await prisma.rateLimitBucket.create({ data: { key, count: 1, resetAt } });
    return { allowed: true, retryAfterSeconds: 0 };
  } catch {
    // Another request may have created the bucket between the update and create.
  }

  const retry = await prisma.rateLimitBucket.findUnique({ where: { key } });
  if (retry && retry.resetAt <= now) {
    const recovered = await prisma.rateLimitBucket.updateMany({
      where: { key, resetAt: { lte: now } },
      data: { count: 1, resetAt },
    });
    if (recovered.count === 1) return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil(((retry?.resetAt.getTime() ?? resetAt.getTime()) - now.getTime()) / 1000)),
  };
}
