import { createHash, randomBytes } from 'crypto';

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function strongPasswordError(password: string): string | null {
  if (password.length < 10 || password.length > 128) return 'Password must be 10 to 128 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain at least one letter and one number.';
  return null;
}

export function randomToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getClientAddress(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function requestFingerprint(scope: string, value: string): string {
  return createHash('sha256').update(`${scope}:${value}`).digest('hex');
}

export function isCrossSiteRequest(req: Request): boolean {
  return req.headers.get('sec-fetch-site') === 'cross-site';
}

/**
 * Strong CSRF guard for authenticated browser mutations.
 * Fetch Metadata is useful, but Origin is the authoritative browser signal
 * when present. In production, mutations are accepted only from the configured
 * site origin (or with an explicit same-origin Fetch Metadata signal).
 */
export function isUnsafeCrossOriginRequest(req: Request): boolean {
  if (isCrossSiteRequest(req)) return true;

  const origin = req.headers.get('origin')?.trim();
  if (!origin) return process.env.NODE_ENV === 'production' && req.headers.get('sec-fetch-site') !== 'same-origin';

  try {
    const expected = getSiteUrl();
    return new URL(origin).origin !== expected;
  } catch {
    return true;
  }
}

export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim();
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be a valid absolute URL.');
  }
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_SITE_URL must use https:// in production.');
  }
  return parsed.origin;
}

export function emailVerificationRequired(): boolean {
  const configured = process.env.EMAIL_VERIFICATION_REQUIRED?.trim().toLowerCase();
  if (configured === 'true') return true;
  if (configured === 'false') return false;
  return process.env.NODE_ENV === 'production';
}
