import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { deviceLimitFor, ensureDeviceAccess, listUserDevices, revokeUserDevice } from '@/lib/devices';
import { ensureCurrentUsage } from '@/lib/usage';
import { isCrossSiteRequest } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const state = await ensureCurrentUsage(user.id);
  if (!state) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const decision = await ensureDeviceAccess(req, user.id, state, { requireDesktopFingerprint: true });
  if (!decision.allowed) {
    return NextResponse.json(
      { error: decision.error, code: decision.code, deviceLimit: decision.limit, deviceCount: decision.activeCount },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const devices = await listUserDevices(user.id, decision.currentDeviceId);
  const limit = deviceLimitFor(state.plan, state.grantType);
  return NextResponse.json({
    ok: true,
    plan: state.plan,
    grantType: state.grantType,
    limited: limit !== null,
    limit,
    count: devices.length,
    currentDeviceId: decision.currentDeviceId,
    canSelfRemove: state.grantType === 'purchase' && state.plan !== 'free',
    ownerRemovalRequired: state.grantType === 'gift_code' && state.plan !== 'free',
    devices,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const state = await ensureCurrentUsage(user.id);
  if (!state) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  if (state.grantType === 'gift_code' && state.plan !== 'free') {
    return NextResponse.json({ error: 'Gift-code devices can only be removed by the Lingua owner.' }, { status: 403 });
  }
  if (state.grantType !== 'purchase' || state.plan === 'free') {
    return NextResponse.json({ error: 'There is no paid-device slot to remove on this account.' }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
  if (!deviceId) return NextResponse.json({ error: 'Choose a device to remove.' }, { status: 400 });

  const removed = await revokeUserDevice(user.id, deviceId);
  if (!removed) return NextResponse.json({ error: 'Device was not found or was already removed.' }, { status: 404 });
  return NextResponse.json({ ok: true, removedDeviceId: deviceId }, { headers: { 'Cache-Control': 'no-store' } });
}
