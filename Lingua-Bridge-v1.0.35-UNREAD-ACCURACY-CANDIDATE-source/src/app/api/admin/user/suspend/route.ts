import { NextResponse } from 'next/server';
import { getOwnerAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isUnsafeCrossOriginRequest } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const admin = await getOwnerAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = typeof body?.userId === 'string' ? body.userId : '';
  const suspended = typeof body?.suspended === 'boolean' ? body.suspended : null;
  if (!userId || suspended === null) return NextResponse.json({ error: 'userId and suspended are required.' }, { status: 400 });
  if (userId === admin.id && suspended) return NextResponse.json({ error: 'You cannot suspend your own admin account.' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (target.role === 'admin' && suspended) {
    return NextResponse.json({ error: 'Admin accounts cannot be suspended from this control.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { suspended },
    select: { id: true, email: true, suspended: true },
  });
  return NextResponse.json({ ok: true, user });
}
