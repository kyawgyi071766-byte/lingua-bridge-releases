import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, isOwnerAdminUser } from '@/lib/auth';
import { expireAllStaleGiftGrants } from '@/lib/accessCodes';
import { prisma } from '@/lib/prisma';
import { PLANS, planLimit, voicePlanLimit } from '@/lib/plans';
import AdminApps from '@/components/AdminApps';
import AdminUserTable, { AdminUserRow } from '@/components/AdminUserTable';
import AdminPayments, { AdminPaymentRow } from '@/components/AdminPayments';
import AdminAccessCodes, { AccessCodeRow } from '@/components/AdminAccessCodes';
import { decryptAccessCode } from '@/lib/accessCodes';
import { deviceLimitFor } from '@/lib/devices';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

function money(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
}

export default async function AdminPage() {
  const admin = await getCurrentUser();
  if (!admin) redirect('/login?next=/admin');
  if (!isOwnerAdminUser(admin)) redirect('/dashboard');

  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const activeCutoff = new Date(now.getTime() - 15 * 60_000);

  await expireAllStaleGiftGrants();
  await prisma.user.updateMany({
    where: { grantType: 'purchase', plan: { not: 'free' }, paidUntil: { not: null, lt: now } },
    data: { plan: 'free', paidUntil: null, grantType: 'free', accessCodeId: null },
  });

  const [users, payments, accessCodes, dailyRevenue, monthlyRevenue, totalRevenue] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { devices: { where: { revokedAt: null }, orderBy: { lastSeenAt: 'desc' } } },
    }),
    prisma.payment.findMany({
      orderBy: { claimedAt: 'desc' },
      take: 100,
      include: { user: { select: { email: true } } },
    }),
    prisma.accessCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 250,
      include: { _count: { select: { redemptions: true, activeUsers: true } } },
    }),
    prisma.payment.aggregate({ where: { status: 'confirmed', confirmedAt: { gte: dayStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'confirmed', confirmedAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'confirmed' }, _sum: { amount: true } }),
  ]);

  const totalUsers = users.length;
  const freeUsers = users.filter((user) => user.plan === 'free').length;
  const proUsers = users.filter((user) => user.plan === 'pro').length;
  const businessUsers = users.filter((user) => user.plan === 'business').length;
  const codeActivatedUsers = users.filter((user) => user.grantType === 'gift_code' && user.plan !== 'free').length;
  const activeUsers = users.filter((user) => user.lastActiveAt >= activeCutoff).length;
  const totalVoiceUses = users.reduce((sum, user) => sum + user.voiceUses, 0);
  const totalVoiceAllowance = users.reduce((sum, user) => sum + voicePlanLimit(user.plan), 0);
  const totalChars = users.reduce((sum, user) => sum + user.usageChars, 0);
  const mrr = users.reduce((sum, user) => sum + (user.grantType === 'purchase' && user.plan !== 'free' ? (PLANS[user.plan as keyof typeof PLANS]?.price ?? 0) : 0), 0);

  const userRows: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    plan: user.plan,
    grantType: user.grantType,
    role: user.role,
    usageChars: user.usageChars,
    usageLimit: planLimit(user.plan),
    voiceUses: user.voiceUses,
    voiceLimit: voicePlanLimit(user.plan),
    joined: user.createdAt.toISOString().slice(0, 10),
    paidUntil: user.paidUntil?.toISOString() ?? null,
    lastActiveAt: user.lastActiveAt.toISOString(),
    suspended: user.suspended,
    deviceLimit: deviceLimitFor(user.plan, user.grantType),
    devices: user.devices.map((device) => ({
      id: device.id,
      name: device.deviceName,
      type: device.deviceType,
      platform: device.platform,
      appVersion: device.appVersion,
      lastSeenAt: device.lastSeenAt.toISOString(),
      createdAt: device.createdAt.toISOString(),
    })),
  }));

  const paymentRows: AdminPaymentRow[] = payments.map((payment) => ({
    id: payment.id,
    email: payment.user.email,
    plan: payment.plan,
    amount: Number(payment.amount).toFixed(2),
    chain: payment.chain,
    status: payment.status,
    txHash: payment.txHash,
    claimedAt: payment.claimedAt.toISOString(),
    confirmedAt: payment.confirmedAt?.toISOString() ?? null,
    receiptStatus: payment.receiptStatus ?? null,
  }));

  const codeRows: AccessCodeRow[] = accessCodes.map((row) => ({
    id: row.id,
    code: (() => { try { return decryptAccessCode(row.encryptedCode); } catch { return 'UNAVAILABLE'; } })(),
    level: row.level,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    redemptions: row._count.redemptions,
    activeUsers: row._count.activeUsers,
  }));

  const stats = [
    { label: 'Total users', value: totalUsers },
    { label: 'Free / Pro / Business', value: `${freeUsers} / ${proUsers} / ${businessUsers}` },
    { label: 'Code-activated', value: codeActivatedUsers },
    { label: 'Active now · 15m', value: activeUsers },
    { label: 'Revenue today · UTC', value: money(dailyRevenue._sum.amount) },
    { label: 'Revenue this month · UTC', value: money(monthlyRevenue._sum.amount) },
    { label: 'Total confirmed revenue', value: money(totalRevenue._sum.amount) },
    { label: 'Purchased-plan MRR', value: `$${mrr}` },
    { label: 'Voice uses this month', value: `${totalVoiceUses.toLocaleString()} / ${totalVoiceAllowance.toLocaleString()}` },
    { label: 'Chars translated this month', value: totalChars.toLocaleString() },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold">Lingua Owner Dashboard</h1>
      <p className="text-slate-500 text-sm mt-1">Private owner-only controls. Access is enforced server-side by ADMIN_EMAIL and the admin role.</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-[11px] text-slate-500 uppercase tracking-wide">{stat.label}</div>
            <div className="text-xl font-extrabold mt-2 break-words">{stat.value}</div>
          </div>
        ))}
      </div>

      <AdminAccessCodes initialCodes={codeRows} />
      <AdminUserTable initialUsers={userRows} />
      <AdminPayments initialPayments={paymentRows} />
      <AdminApps />
    </div>
  );
}
