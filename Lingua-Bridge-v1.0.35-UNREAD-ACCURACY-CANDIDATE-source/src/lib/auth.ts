import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const COOKIE = 'lingua_session';
const DEV_SECRET = 'dev-only-lingua-session-secret-change-before-production';
const ISSUER = 'lingua-translate';
const AUDIENCE = 'lingua-web';

function getSecret() {
  const configured = process.env.AUTH_SECRET?.trim();
  const invalid = !configured || configured.startsWith('replace-') || configured.length < 32;
  if (invalid && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured with at least 32 random characters in production.');
  }
  return new TextEncoder().encode(invalid ? DEV_SECRET : configured);
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { sessionVersion: true } });
  if (!user) throw new Error('Cannot create a session for a missing user.');
  await prisma.user.updateMany({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => {});

  const token = await new SignJWT({ uid: userId, sv: user.sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

async function getSessionPayload(): Promise<{ uid: string; sv: number } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER, audience: AUDIENCE });
    if (typeof payload.uid !== 'string' || typeof payload.sv !== 'number') return null;
    return { uid: payload.uid, sv: payload.sv };
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  const session = await getSessionPayload();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.uid }, select: { sessionVersion: true } });
  return user?.sessionVersion === session.sv ? session.uid : null;
}

export async function getCurrentUser() {
  const session = await getSessionPayload();
  if (!session) return null;
  let user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || user.sessionVersion !== session.sv) return null;

  // Bootstrap the one owner account from the backend-only ADMIN_EMAIL value.
  // Even if an older production row was created with role=user, the exact owner
  // email is promoted once after authentication. A stale admin role alone is not
  // sufficient for owner access; isOwnerAdminUser also requires ADMIN_EMAIL.
  const ownerEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (ownerEmail && user.email.trim().toLowerCase() === ownerEmail && user.role !== 'admin') {
    user = await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });
  }

  const cutoff = new Date(Date.now() - 5 * 60_000);
  if (user.lastActiveAt < cutoff) {
    await prisma.user.updateMany({
      where: { id: user.id, lastActiveAt: { lt: cutoff } },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});
  }
  return user;
}

export function isOwnerAdminUser(user: { email: string; role: string } | null | undefined): boolean {
  if (!user || user.role !== 'admin') return false;
  const ownerEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return Boolean(ownerEmail && user.email.trim().toLowerCase() === ownerEmail);
}

export async function getOwnerAdmin() {
  const user = await getCurrentUser();
  return isOwnerAdminUser(user) ? user : null;
}
