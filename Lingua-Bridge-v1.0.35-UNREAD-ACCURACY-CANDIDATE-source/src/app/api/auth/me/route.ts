import { NextResponse } from 'next/server';
import { getCurrentUser, isOwnerAdminUser } from '@/lib/auth';
import { ensureCurrentUsage } from '@/lib/usage';
import { planLimit, voicePlanLimit } from '@/lib/plans';
import { deviceLimitFor, ensureDeviceAccess, listUserDevices } from '@/lib/devices';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const state = await ensureCurrentUsage(user.id);
  if (!state) return NextResponse.json({ error: 'Account not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const device = await ensureDeviceAccess(req, user.id, state, { requireDesktopFingerprint: true });
  if (!device.allowed) {
    return NextResponse.json(
      { error: device.error, code: device.code, deviceLimit: device.limit, deviceCount: device.activeCount },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const devices = await listUserDevices(user.id, device.currentDeviceId);
  const deviceLimit = deviceLimitFor(state.plan, state.grantType);
  return NextResponse.json(
    {
      email: user.email,
      name: user.name,
      role: user.role,
      ownerAdmin: isOwnerAdminUser(user),
      plan: state.plan,
      grantType: state.grantType,
      paidUntil: state.paidUntil,
      usage: { used: state.usageChars, limit: planLimit(state.plan) },
      voice: { used: state.voiceUses, limit: voicePlanLimit(state.plan) },
      devices: {
        limited: deviceLimit !== null,
        count: devices.length,
        limit: deviceLimit,
        currentDeviceId: device.currentDeviceId,
        canSelfRemove: state.grantType === 'purchase' && state.plan !== 'free',
        ownerRemovalRequired: state.grantType === 'gift_code' && state.plan !== 'free',
        items: devices,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
