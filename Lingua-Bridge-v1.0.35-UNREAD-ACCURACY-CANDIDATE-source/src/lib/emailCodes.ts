import { createHmac, randomInt } from 'crypto';
import { normalizeEmail } from './security';

export type EmailCodePurpose = 'verify-email' | 'reset-password';
export const EMAIL_CODE_TTL_MS = 15 * 60_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SIX_DIGIT_CODE_RE = /^\d{6}$/;

// This is a defense-in-depth list, NOT a way to determine whether a real
// Gmail/Outlook mailbox exists. Only inbox ownership verification can do that.
// Never block free providers, aliases, plus-addressing, or unfamiliar domains.
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', 'guerrillamail.com',
  'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  'sharklasers.com', 'grr.la', 'mailinator.com', 'mailinator.net',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'throwawaymail.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'trashmail.com',
  'getnada.com', 'emailondeck.com', 'dispostable.com', 'maildrop.cc',
  'mintemail.com', 'mohmal.com', 'fakeinbox.com',
]);

export function isAcceptableRegistrationEmail(value: string): boolean {
  const email = normalizeEmail(value);
  if (email.length < 3 || email.length > 254 || !EMAIL_RE.test(email)) return false;
  const at = email.lastIndexOf('@');
  const domain = email.slice(at + 1);
  if (email.slice(0, at).length > 64 || domain.length > 253) return false;
  if (domain === 'example.com' || domain.endsWith('.example') ||
      domain.endsWith('.invalid') || domain.endsWith('.test') ||
      domain.endsWith('.localhost') || domain.endsWith('.local')) return false;
  return !DISPOSABLE_DOMAINS.has(domain);
}

export function isEmailCode(value: string): boolean {
  return SIX_DIGIT_CODE_RE.test(value);
}

export function generateEmailCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function otpSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 32 && !secret.startsWith('replace-')) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured before email code verification.');
  }
  return 'dev-only-lingua-email-otp-secret-not-for-production';
}

export function hashEmailCode(purpose: EmailCodePurpose, email: string, code: string): string {
  if (!isEmailCode(code) || !isAcceptableRegistrationEmail(email)) {
    throw new Error('Invalid email verification code input.');
  }
  // Purpose, recipient and an HMAC secret isolate short OTPs from each other.
  // A leaked DB hash cannot be brute-forced offline without the server secret.
  return createHmac('sha256', otpSecret())
    .update('lingua-email-code-v1\0' + purpose + '\0' + normalizeEmail(email) + '\0' + code)
    .digest('hex');
}
