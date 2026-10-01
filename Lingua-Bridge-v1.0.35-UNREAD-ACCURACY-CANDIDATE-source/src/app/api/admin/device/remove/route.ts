import { NextResponse } from 'next/server';
import { getOwnerAdmin } from '@/lib/auth';
import { revokeUserDevice } from '@/lib/devices';
import { isCrossSiteRequest } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const admin = await getOwnerAdmin();
  if (!admin) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
  if (!userId || !deviceId) return NextResponse.json({ error: 'User and device are required.' }, { status: 400 });

  const removed = await revokeUserDevice(userId, deviceId);
  if (!removed) return NextResponse.json({ error: 'Device was not found or already removed.' }, { status: 404 });
  return NextResponse.json({ ok: true, userId, deviceId });
}
