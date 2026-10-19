import { getSiteUrl } from './security';

const DNSEXIT_HOST = 'relay.dnsexit.com';
const DNSEXIT_DOMAIN = 'lingua-bridge-sshk.publicvm.com';

function configured(value?: string): boolean {
  return Boolean(value && !value.startsWith('replace-') && !value.includes('example.com'));
}

function senderAddress(value: string): string {
  const match = value.match(/<([^<>]+)>$/);
  return (match ? match[1] : value).trim().toLowerCase();
}

function usingDnsExit(): boolean {
  return process.env.EMAIL_TRANSPORT?.trim().toLowerCase() === 'dnsexit-smtp';
}

export function emailConfigured(): boolean {
  const sender = process.env.EMAIL_FROM?.trim() || '';
  if (!configured(sender)) return false;

  if (usingDnsExit()) {
    // Use only DNSExit SMTP with this explicitly delegated free subdomain.
    if (!configured(process.env.SMTP_USER) || !configured(process.env.SMTP_PASSWORD)) return false;
    const addr = senderAddress(sender);
    const parts = addr.split('@');
    if (parts.length !== 2 || !parts[0] || parts[1] !== DNSEXIT_DOMAIN || /\s/.test(addr)) return false;
    // Operator rollout gate. Set this only after DNSExit SPF/DKIM verification
    // AND controlled Gmail delivery; avoids orphaned unverified accounts.
    if (process.env.NODE_ENV === 'production' && process.env.DNSEXIT_SENDER_VERIFIED !== 'true') return false;
    return true;
  }

  if (process.env.EMAIL_TRANSPORT && process.env.EMAIL_TRANSPORT.trim().toLowerCase() !== 'resend') {
    return false;
  }
  if (!configured(process.env.RESEND_API_KEY)) return false;
  if (process.env.NODE_ENV === 'production' && /@resend\.dev(?:\s*>|\s*$)/i.test(sender)) return false;
  return true;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char] || char));
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const from = process.env.EMAIL_FROM?.trim();
  if (!emailConfigured() || !from) throw new Error('Transactional email is not configured.');

  if (usingDnsExit()) {
    try {
      // Port 587 with authenticated STARTTLS; never allow a client-supplied
      // SMTP hostname, disabled certificate checks, or insecure auth.
      const { createTransport } = await import('nodemailer');
      const transport = createTransport({
        host: DNSEXIT_HOST,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! },
        tls: { servername: DNSEXIT_HOST, minVersion: 'TLSv1.2' },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
      try {
        await transport.sendMail({
          from, to, subject, text, html,
          disableFileAccess: true, disableUrlAccess: true,
        });
      } finally {
        transport.close();
      }
      return;
    } catch {
      console.error('DNSExit SMTP delivery failed.');
      throw new Error('Could not send email right now.');
    }
  }

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error('Transactional email is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
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
