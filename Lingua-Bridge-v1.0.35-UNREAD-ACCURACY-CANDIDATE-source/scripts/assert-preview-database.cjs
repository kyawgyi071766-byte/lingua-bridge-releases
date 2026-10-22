// Fail closed before Prisma migrations during Preview builds.
// Preview must never migrate or write to the production Postgres endpoint.
const { URL } = require('node:url');
if (process.env.VERCEL_ENV === 'preview') {
  const expectedHost = process.env.LINGUA_PREVIEW_NEON_HOST;
  const databaseUrl = process.env.DATABASE_URL;
  if (!expectedHost || !databaseUrl) {
    console.error('Preview requires an isolated DATABASE_URL and expected Neon hostname.');
    process.exit(1);
  }
  try {
    const host = new URL(databaseUrl).hostname;
    const parsed = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.username || !parsed.pathname || parsed.pathname === '/' || !parsed.hostname.endsWith('.neon.tech')) {
      console.error('Preview database URL must be a valid Neon Postgres endpoint.');
      process.exit(1);
    }
    if (!host || host !== expectedHost) {
      console.error('Preview database isolation mismatch; migration is blocked.');
      process.exit(1);
    }
  } catch {
    console.error('Preview DATABASE_URL is malformed; migration is blocked.');
    process.exit(1);
  }
}
console.log('Database deployment safety check passed.');
