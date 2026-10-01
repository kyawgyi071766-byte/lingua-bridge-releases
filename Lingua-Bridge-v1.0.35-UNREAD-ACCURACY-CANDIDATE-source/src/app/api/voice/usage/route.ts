import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ensureCurrentUsage } from '@/lib/usage';
import { ensureDeviceAccess, isLinguaDesktopRequest } from '@/lib/devices';
import { voicePlanLimit } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const state = await ensureCurrentUsage(user.id);
  if (!state) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
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

  const limit = voicePlanLimit(state.plan);
  const used = state.voiceUses;
  return NextResponse.json({
    plan: state.plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: state.voiceUsageResetAt,
    paidUntil: state.paidUntil,
    grantType: state.grantType,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
