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

export async function sendVerificationEmail(email: string, code: string) {
  const url = new URL(`${getSiteUrl()}/verify-email`);
  url.searchParams.set('email', email);
  const safeUrl = escapeHtml(url.toString());
  const safeCode = escapeHtml(code);
  await sendEmail(
    email,
    'Your Lingua verification code',
    `Your Lingua email verification code is: ${code}\n\nEnter this six-digit code at: ${url.toString()}\n\nIt expires in 15 minutes. If you did not request an account, ignore this email.`,
    `<p>Enter this one-time code to activate your Lingua account:</p><p style="font-size:28px;font-weight:bold;letter-spacing:5px">${safeCode}</p><p><a href="${safeUrl}">Verify your email</a></p><p>Expires in 15 minutes. Never share this code.</p>`
  );
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const url = new URL(`${getSiteUrl()}/reset-password`);
  url.searchParams.set('email', email);
  const safeUrl = escapeHtml(url.toString());
  const safeCode = escapeHtml(code);
  await sendEmail(
    email,
    'Your Lingua password reset code',
    `Your Lingua password reset code is: ${code}\n\nEnter this six-digit code at: ${url.toString()}\n\nIt expires in 15 minutes. If you did not request this, ignore the email. Never share this code.`,
    `<p>Use this one-time code to reset your Lingua password:</p><p style="font-size:28px;font-weight:bold;letter-spacing:5px">${safeCode}</p><p><a href="${safeUrl}">Reset password</a></p><p>Expires in 15 minutes. Never share this code.</p>`
  );
}
