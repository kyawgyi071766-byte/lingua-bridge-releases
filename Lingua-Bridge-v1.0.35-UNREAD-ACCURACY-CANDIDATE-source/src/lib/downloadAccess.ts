import { createHmac, timingSafeEqual } from 'crypto';

export const DOWNLOAD_COOKIE = 'lingua_download_access';
const COOKIE_PURPOSE = 'lingua-download-access-v1';
const DOWNLOAD_COOKIE_TTL_MS = 24 * 60 * 60 * 1000;

function secret(): string {
  return (process.env.DOWNLOAD_ACCESS_TOKEN || '').trim();
}

export function downloadsArePublic(): boolean {
  return String(process.env.DOWNLOAD_ACCESS_MODE || '').trim().toLowerCase() === 'public';
}

export function downloadGateConfigured(): boolean {
  return downloadsArePublic() || secret().length >= 16;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyDownloadToken(token: unknown): boolean {
  if (downloadsArePublic()) return true;
  if (typeof token !== 'string' || !downloadGateConfigured()) return false;
  return safeEqual(token.trim(), secret());
}

export function downloadCookieValue(nowMs = Date.now()): string {
  const key = secret();
  if (!key) return '';
  const expiresAt = nowMs + DOWNLOAD_COOKIE_TTL_MS;
  const signature = createHmac('sha256', key).update(`${COOKIE_PURPOSE}:${expiresAt}`).digest('hex');
  return `${expiresAt}.${signature}`;
}

export function verifyDownloadCookie(value: string | undefined, nowMs = Date.now()): boolean {
  if (downloadsArePublic()) return true;
  if (!value || !downloadGateConfigured()) return false;
  const separator = value.indexOf('.');
  if (separator < 1) return false;
  const expiresRaw = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!/^\d+$/.test(expiresRaw) || !signature) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowMs) return false;
  const expected = createHmac('sha256', secret()).update(`${COOKIE_PURPOSE}:${expiresAt}`).digest('hex');
  return safeEqual(signature, expected);
}

export type DownloadPlatform = 'android' | 'windows' | 'mac' | 'linux' | 'ios';

const DOWNLOADS: Record<DownloadPlatform, { label: string; env: string; note: string }> = {
  android: { label: 'Android APK', env: 'DOWNLOAD_ANDROID_URL', note: 'Direct APK or trusted release page.' },
  windows: { label: 'Windows PC', env: 'DOWNLOAD_WINDOWS_URL', note: 'Windows installer (.exe).' },
  mac: { label: 'macOS', env: 'DOWNLOAD_MAC_URL', note: 'macOS installer (.dmg).' },
  linux: { label: 'Linux', env: 'DOWNLOAD_LINUX_URL', note: 'AppImage or .deb package.' },
  ios: { label: 'iPhone / iPad', env: 'DOWNLOAD_IOS_URL', note: 'Use a TestFlight or App Store link for real iPhones.' },
};

export function downloadCatalog() {
  return (Object.entries(DOWNLOADS) as Array<[DownloadPlatform, (typeof DOWNLOADS)[DownloadPlatform]]>).map(([id, item]) => ({
    id,
    label: item.label,
    note: item.note,
    available: Boolean((process.env[item.env] || '').trim()),
  }));
}

export function downloadUrl(platform: string | null): string | null {
  if (!platform || !(platform in DOWNLOADS)) return null;
  const item = DOWNLOADS[platform as DownloadPlatform];
  const value = (process.env[item.env] || '').trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}
