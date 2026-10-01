import { createHmac } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type DevicePolicyState = {
  plan: string;
  grantType: string;
};

export type DeviceDecision = {
  allowed: boolean;
  limited: boolean;
  limit: number | null;
  activeCount: number;
  currentDeviceId: string | null;
  code?: 'DEVICE_ID_REQUIRED' | 'DEVICE_LIMIT_REACHED';
  error?: string;
};

const PURCHASE_LIMIT = 2;
const GIFT_LIMIT = 1;
const DEV_SECRET = 'dev-only-lingua-session-secret-change-before-production';

function securitySecret(): string {
  const configured = process.env.AUTH_SECRET?.trim();
  const invalid = !configured || configured.startsWith('replace-') || configured.length < 32;
  if (invalid && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured before device limits can be used.');
  }
  return invalid ? DEV_SECRET : configured!;
}

export function deviceLimitFor(plan: string, grantType: string): number | null {
  if (plan !== 'pro' && plan !== 'business') return null;
  if (grantType === 'gift_code') return GIFT_LIMIT;
  if (grantType === 'purchase') return PURCHASE_LIMIT;
  return null;
}

function cleanHeader(value: string | null, fallback: string, max = 80): string {
  const text = String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  return (text || fallback).slice(0, max);
}

function requestFingerprint(req: Request): string | null {
  const raw = req.headers.get('x-lingua-device-fingerprint')?.trim().toLowerCase() || '';
  return /^[a-f0-9]{64}$/.test(raw) ? raw : null;
}

function serverFingerprintHash(clientFingerprint: string): string {
  return createHmac('sha256', securitySecret())
    .update(`lingua-device-v1:${clientFingerprint}`)
    .digest('hex');
}

function requestDeviceMetadata(req: Request) {
  return {
    deviceName: cleanHeader(req.headers.get('x-lingua-device-name'), 'Lingua device', 80),
    deviceType: cleanHeader(req.headers.get('x-lingua-device-type'), 'desktop', 40),
    platform: cleanHeader(req.headers.get('x-lingua-platform'), 'unknown', 80),
    appVersion: cleanHeader(req.headers.get('x-lingua-app-version'), '', 40) || null,
  };
}

export function isLinguaDesktopRequest(req: Request): boolean {
  return req.headers.get('x-lingua-client')?.trim().toLowerCase() === 'desktop';
}

function limitMessage(grantType: string) {
  if (grantType === 'gift_code') {
    return 'ဤကုဒ်ကို အခြားစက်ပစ္စည်းတွင် အသုံးပြုပြီးပါပြီ။ ကုဒ်တစ်ခုလျှင် စက်တစ်ခုသာခွင့်ပြုသည်။ စက်ပြောင်းလိုပါက ပိုင်ရှင်ထံဆက်သွယ်ပါ။';
  }
  return 'အကြောင်းကြားချက်- ဤအစီအစဉ်တွင် စက်ပစ္စည်း ၂ လုံးအထိသာ ခွင့်ပြုထားပါသည်။ ဆက်လက်သုံးလိုပါက ယခင်စက်တစ်ခုကို ဖယ်ရှားပေးပါ။';
}

async function ensureDeviceOnce(
  req: Request,
  userId: string,
  state: DevicePolicyState,
  requireDesktopFingerprint: boolean,
): Promise<DeviceDecision> {
  const limit = deviceLimitFor(state.plan, state.grantType);
  if (!limit) {
    return { allowed: true, limited: false, limit: null, activeCount: 0, currentDeviceId: null };
  }

  const fingerprint = requestFingerprint(req);
  const desktop = isLinguaDesktopRequest(req);
  if (!fingerprint) {
    if (desktop && requireDesktopFingerprint) {
      return {
        allowed: false,
        limited: true,
        limit,
        activeCount: 0,
        currentDeviceId: null,
        code: 'DEVICE_ID_REQUIRED',
        error: 'Lingua could not identify this device securely. Restart the app and try again.',
      };
    }
    // Keep the existing web portal working. Device limits are enforced on
    // Lingua Bridge desktop requests, whose hardware fingerprint is generated
    // in memory and sent on each request without being persisted locally.
    const activeCount = await prisma.userDevice.count({ where: { userId, revokedAt: null } });
    return { allowed: true, limited: true, limit, activeCount, currentDeviceId: null };
  }

  const fingerprintHash = serverFingerprintHash(fingerprint);
  const meta = requestDeviceMetadata(req);
  const now = new Date();

  return prisma.$transaction(async (db) => {
    const existing = await db.userDevice.findUnique({
      where: { userId_fingerprintHash: { userId, fingerprintHash } },
    });

    if (existing && !existing.revokedAt) {
      // Translation traffic can be bursty. Avoid writing lastSeenAt on every
      // request; concurrent Serializable updates were causing avoidable P2034
      // write conflicts while messages were being translated.
      const stale = now.getTime() - existing.lastSeenAt.getTime() >= 60_000;
      const current = stale
        ? await db.userDevice.update({
            where: { id: existing.id },
            data: { ...meta, lastSeenAt: now },
          })
        : existing;
      const activeCount = await db.userDevice.count({ where: { userId, revokedAt: null } });
      return { allowed: true, limited: true, limit, activeCount, currentDeviceId: current.id };
    }

    const activeCount = await db.userDevice.count({ where: { userId, revokedAt: null } });
    if (activeCount >= limit) {
      return {
        allowed: false,
        limited: true,
        limit,
        activeCount,
        currentDeviceId: null,
        code: 'DEVICE_LIMIT_REACHED' as const,
        error: limitMessage(state.grantType),
      };
    }

    const current = existing
      ? await db.userDevice.update({
          where: { id: existing.id },
          data: { ...meta, revokedAt: null, lastSeenAt: now },
        })
      : await db.userDevice.create({
          data: { userId, fingerprintHash, ...meta, lastSeenAt: now },
        });

    return {
      allowed: true,
      limited: true,
      limit,
      activeCount: activeCount + 1,
      currentDeviceId: current.id,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function ensureDeviceAccess(
  req: Request,
  userId: string,
  state: DevicePolicyState,
  options: { requireDesktopFingerprint?: boolean } = {},
): Promise<DeviceDecision> {
  try {
    return await ensureDeviceOnce(req, userId, state, options.requireDesktopFingerprint !== false);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return ensureDeviceOnce(req, userId, state, options.requireDesktopFingerprint !== false);
    }
    throw error;
  }
}

export async function listUserDevices(userId: string, currentDeviceId: string | null = null) {
  const devices = await prisma.userDevice.findMany({
    where: { userId, revokedAt: null },
    orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'asc' }],
  });
  return devices.map((device) => ({
    id: device.id,
    name: device.deviceName,
    type: device.deviceType,
    platform: device.platform,
    appVersion: device.appVersion,
    lastSeenAt: device.lastSeenAt.toISOString(),
    createdAt: device.createdAt.toISOString(),
    current: device.id === currentDeviceId,
  }));
}

export async function revokeUserDevice(userId: string, deviceId: string) {
  const result = await prisma.userDevice.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count === 1;
}

export async function revokeAllActiveDevices(userId: string) {
  const result = await prisma.userDevice.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}
