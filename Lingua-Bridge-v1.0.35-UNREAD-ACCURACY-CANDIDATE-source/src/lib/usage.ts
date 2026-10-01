import { prisma } from './prisma';
import { expireGiftGrantForUser } from './accessCodes';

function currentMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function ensureCurrentUsage(userId: string) {
  const now = new Date();
  const monthStart = currentMonthStart();

  // Gift-code grants remain valid only while their server-side code record is
  // active and unexpired. This check also handles permanent codes (expiresAt null).
  await expireGiftGrantForUser(userId);

  // Purchased access is independent of gift-code access. Only purchase grants
  // are downgraded by paidUntil here, so a revoked gift code cannot disturb a
  // separate paid subscription and a paid customer is not accidentally changed.
  await prisma.user.updateMany({
    where: {
      id: userId,
      grantType: 'purchase',
      plan: { not: 'free' },
      paidUntil: { not: null, lt: now },
    },
    data: { plan: 'free', paidUntil: null, grantType: 'free', accessCodeId: null },
  });

  await prisma.user.updateMany({
    where: { id: userId, usageResetAt: { lt: monthStart } },
    data: { usageChars: 0, usageResetAt: now },
  });

  await prisma.user.updateMany({
    where: { id: userId, voiceUsageResetAt: { lt: monthStart } },
    data: { voiceUses: 0, voiceUsageResetAt: now },
  });

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      usageChars: true,
      usageResetAt: true,
      voiceUses: true,
      voiceUsageResetAt: true,
      plan: true,
      paidUntil: true,
      grantType: true,
      accessCodeId: true,
      suspended: true,
      lastActiveAt: true,
    },
  });
}
