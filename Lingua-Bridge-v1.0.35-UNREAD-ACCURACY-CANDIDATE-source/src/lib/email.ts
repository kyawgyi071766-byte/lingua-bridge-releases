import { getSiteUrl } from './security';

function configured(value?: string): boolean {
  return Boolean(value && !value.startsWith('replace-') && !value.includes('example.com'));
}

export function emailConfigured(): boolean {
  return configured(process.env.RESEND_API_KEY) && configured(process.env.EMAIL_FROM);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char] || char));
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!emailConfigured() || !key || !from) throw new Error('Transactional email is not configured.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    console.error('Transactional email provider returned HTTP', response.status);
    throw new Error('Could not send email right now.');
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${getSiteUrl()}/verify-email#token=${encodeURIComponent(token)}`;
  const safeUrl = escapeHtml(url);
  await sendEmail(
    email,
    'Verify your Lingua email',
    `Verify your email by opening this link: ${url}\n\nThis link expires in 24 hours.`,
    `<p>Verify your email to activate your Lingua account.</p><p><a href="${safeUrl}">Verify email</a></p><p>This link expires in 24 hours.</p>`
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${getSiteUrl()}/reset-password#token=${encodeURIComponent(token)}`;
  const safeUrl = escapeHtml(url);
  await sendEmail(
    email,
    'Reset your Lingua password',
    `Reset your password by opening this link: ${url}\n\nThis link expires in 1 hour. If you did not request it, ignore this email.`,
    `<p>Use the link below to reset your Lingua password.</p><p><a href="${safeUrl}">Reset password</a></p><p>This link expires in 1 hour. If you did not request it, ignore this email.</p>`
  );
}
