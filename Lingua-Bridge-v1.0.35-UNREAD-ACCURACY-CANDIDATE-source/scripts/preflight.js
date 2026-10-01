const required = [
  'AUTH_SECRET',
  'DATABASE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'ADMIN_EMAIL',
  'CRYPTO_WALLET_ADDRESS',
  'CRYPTO_CHAIN',
];

const errors = [];
const warnings = [];
const value = (name) => (process.env[name] || '').trim();
const missing = (name) => !value(name) || value(name).startsWith('replace-') || value(name).includes('your-domain.com');

for (const name of required) if (missing(name)) errors.push(`${name} is missing or still a placeholder.`);
if (value('AUTH_SECRET').length < 32) errors.push('AUTH_SECRET must contain at least 32 characters.');
if ((!value('DATABASE_URL').startsWith('postgresql://') && !value('DATABASE_URL').startsWith('postgres://')) || value('DATABASE_URL').includes('user:password@host')) errors.push('DATABASE_URL must be a real PostgreSQL connection string.');
if (!/^https:\/\//i.test(value('NEXT_PUBLIC_SITE_URL'))) errors.push('NEXT_PUBLIC_SITE_URL must use https:// for production.');
if (value('CRYPTO_CHAIN').toLowerCase() !== 'tron') errors.push('Lingua Bridge v1.0.9 Official requires CRYPTO_CHAIN=tron.');
if (value('CRYPTO_CHAIN').toLowerCase() === 'tron' && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value('CRYPTO_WALLET_ADDRESS'))) errors.push('CRYPTO_WALLET_ADDRESS must be a valid TRON address when CRYPTO_CHAIN=tron.');
if (value('CRYPTO_WALLET_ADDRESS') !== 'TC4gLVT6RnjdnMB6qCgq2mAb5KNnM9ovzM') errors.push('CRYPTO_WALLET_ADDRESS does not match the owner-approved v1.0.9 Official wallet.');
if (value('TRON_USDT_CONTRACT') && value('TRON_USDT_CONTRACT') !== 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t') errors.push('TRON_USDT_CONTRACT must be the official TRON mainnet USDT contract.');
if (value('CRYPTO_CHAIN').toLowerCase() === 'tron' && !value('TRONSCAN_API_KEY')) warnings.push('TRONSCAN_API_KEY is not configured; verification can still work but production rate limits may be lower.');
if (missing('DEEPL_API_KEY') && missing('GEMINI_API_KEY') && missing('MICROSOFT_TRANSLATOR_KEY') && missing('GOOGLE_TRANSLATE_API_KEY')) errors.push('At least one translation provider must be configured: DEEPL_API_KEY, GEMINI_API_KEY, MICROSOFT_TRANSLATOR_KEY, or GOOGLE_TRANSLATE_API_KEY.');
if (missing('GEMINI_API_KEY') && missing('MICROSOFT_TRANSLATOR_KEY') && missing('GOOGLE_TRANSLATE_API_KEY')) warnings.push('No broad-language fallback is configured; Arabic/Hindi/Myanmar/Thai/Vietnamese and other non-DeepL languages will stay unavailable while the DeepL-supported core continues to work.');
if ((process.env.EMAIL_VERIFICATION_REQUIRED || 'true').toLowerCase() !== 'false') {
  if (missing('RESEND_API_KEY')) errors.push('RESEND_API_KEY is required when email verification is enabled.');
  if (missing('EMAIL_FROM')) errors.push('EMAIL_FROM is required when email verification is enabled.');
}
if (missing('NEXT_PUBLIC_SUPPORT_EMAIL')) warnings.push('NEXT_PUBLIC_SUPPORT_EMAIL is not configured; the support widget will fall back to ADMIN_EMAIL or a generic label.');
if (missing('SERVER_URL')) warnings.push('SERVER_URL is not configured; native desktop/mobile wrappers cannot be built for production yet.');
if (value('TRANSLATE_PROVIDER') && !['auto', 'deepl', 'gemini', 'microsoft', 'google'].includes(value('TRANSLATE_PROVIDER').toLowerCase())) errors.push('TRANSLATE_PROVIDER must be auto, deepl, gemini, microsoft, or google.');
if (value('TRANSLATE_PRIMARY') && !['google', 'deepl', 'gemini', 'microsoft'].includes(value('TRANSLATE_PRIMARY').toLowerCase())) errors.push('TRANSLATE_PRIMARY must be google, deepl, gemini, or microsoft.');
if (value('TRANSLATE_CHAIN')) {
  const allowedProviders = new Set(['deepl', 'gemini', 'microsoft', 'google']);
  const chain = value('TRANSLATE_CHAIN').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!chain.length || chain.some((item) => !allowedProviders.has(item))) errors.push('TRANSLATE_CHAIN may contain only deepl,gemini,microsoft,google.');
}
if (value('OPENAI_API_KEY') && !value('OPENAI_MODEL')) errors.push('OPENAI_MODEL must be configured when OPENAI_API_KEY is set.');

if (warnings.length) {
  console.warn('Warnings:');
  for (const item of warnings) console.warn(`- ${item}`);
}
if (errors.length) {
  console.error('Production preflight failed:');
  for (const item of errors) console.error(`- ${item}`);
  process.exit(1);
}
console.log('Production preflight passed.');
