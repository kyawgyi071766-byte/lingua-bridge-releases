import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { hashToken, isCrossSiteRequest, strongPasswordError } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[a-f0-9]{64}$/i.test(token)) return NextResponse.json({ error: 'Invalid reset link.' }, { status: 400 });
  const passwordError = strongPasswordError(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { resetTokenHash: hashToken(token) } });
  if (!user || !user.resetExpiresAt || user.resetExpiresAt <= new Date()) {
    return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetTokenHash: null,
      resetExpiresAt: null,
      sessionVersion: { increment: 1 },
      emailVerifiedAt: user.emailVerifiedAt || new Date(),
    },
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
