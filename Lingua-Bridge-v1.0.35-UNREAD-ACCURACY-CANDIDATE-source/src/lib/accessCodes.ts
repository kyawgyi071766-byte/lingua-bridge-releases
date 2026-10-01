import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
} from 'crypto';
import { prisma } from './prisma';

export type AccessLevel = 'pro' | 'business';
export type AccessDuration = '30d' | '90d' | 'forever';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEV_SECRET = 'dev-only-lingua-session-secret-change-before-production';

function baseSecret(): string {
  const configured = process.env.AUTH_SECRET?.trim();
  const invalid = !configured || configured.startsWith('replace-') || configured.length < 32;
  if (invalid && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured before Access Codes can be used.');
  }
  return invalid ? DEV_SECRET : configured;
}

function encryptionKey(): Buffer {
  return createHash('sha256').update(`lingua-access-code-v1:${baseSecret()}`).digest();
}

export function normalizeAccessCode(value: string): string {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashAccessCode(value: string): string {
  return createHash('sha256').update(normalizeAccessCode(value)).digest('hex');
}

export function generateAccessCode(level: AccessLevel): string {
  let random = '';
  for (let i = 0; i < 24; i += 1) random += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  const groups = random.match(/.{1,4}/g)?.join('-') || random;
  return `LINGUA-${level.toUpperCase()}-${groups}`;
}

export function encryptAccessCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptAccessCode(payload: string): string {
  const [version, ivPart, tagPart, dataPart] = String(payload || '').split('.');
  if (version !== 'v1' || !ivPart || !tagPart || !dataPart) throw new Error('Invalid stored access code.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function accessCodeExpiry(duration: AccessDuration, from = new Date()): Date | null {
  if (duration === 'forever') return null;
  const days = duration === '90d' ? 90 : 30;
  return new Date(from.getTime() + days * 24 * 60 * 60_000);
}

export function isAccessLevel(value: unknown): value is AccessLevel {
  return value === 'pro' || value === 'business';
}

export function isAccessDuration(value: unknown): value is AccessDuration {
  return value === '30d' || value === '90d' || value === 'forever';
}

export async function expireGiftGrantForUser(userId: string) {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      grantType: true,
      paidUntil: true,
      accessCodeId: true,
      accessCode: { select: { isActive: true, expiresAt: true } },
    },
  });
  if (!user || user.grantType !== 'gift_code') return false;

  const invalid =
    !user.accessCodeId ||
    !user.accessCode ||
    !user.accessCode.isActive ||
    (user.accessCode.expiresAt ? user.accessCode.expiresAt <= now : false) ||
    (user.paidUntil ? user.paidUntil <= now : false);

  if (!invalid) return false;

  await prisma.user.updateMany({
    where: { id: user.id, grantType: 'gift_code' },
    data: { plan: 'free', paidUntil: null, grantType: 'free', accessCodeId: null },
  });
  return true;
}

export async function expireAllStaleGiftGrants() {
  const now = new Date();
  const gifts = await prisma.user.findMany({
    where: { grantType: 'gift_code' },
    select: {
      id: true,
      paidUntil: true,
      accessCodeId: true,
      accessCode: { select: { isActive: true, expiresAt: true } },
    },
  });
  const staleIds = gifts
    .filter((user) =>
      !user.accessCodeId ||
      !user.accessCode ||
      !user.accessCode.isActive ||
      (user.accessCode.expiresAt ? user.accessCode.expiresAt <= now : false) ||
      (user.paidUntil ? user.paidUntil <= now : false)
    )
    .map((user) => user.id);
  if (!staleIds.length) return 0;
  const result = await prisma.user.updateMany({
    where: { id: { in: staleIds }, grantType: 'gift_code' },
    data: { plan: 'free', paidUntil: null, grantType: 'free', accessCodeId: null },
  });
  return result.count;
}
