import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { hashToken, isCrossSiteRequest } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!/^[a-f0-9]{64}$/i.test(token)) return NextResponse.json({ error: 'Invalid verification link.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { verificationTokenHash: hashToken(token) } });
  if (!user || !user.verificationExpiresAt || user.verificationExpiresAt <= new Date()) {
    return NextResponse.json({ error: 'This verification link is invalid or expired.' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), verificationTokenHash: null, verificationExpiresAt: null },
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
