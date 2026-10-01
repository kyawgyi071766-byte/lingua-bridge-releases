const fs = require('fs');
const translator = fs.readFileSync('src/lib/translator.ts','utf8');
const devices = fs.readFileSync('src/lib/devices.ts','utf8');
const ignore = fs.readFileSync('.vercelignore','utf8');
const checks = [
  ['Provider errors carry HTTP status', translator.includes('readonly status?: number')],
  ['Retry-After parsing wired', translator.includes('function retryAfterMs') && translator.includes("res.headers.get('retry-after')")],
  ['Bounded exponential backoff wired', translator.includes('2 ** attempt') && translator.includes('maxAttempts = 3')],
  ['Gemini 429 can try next configured model', translator.includes("providerError?.status === 429")],
  ['Original text safety remains', translator.includes('Your original text was not replaced')],
  ['Device lastSeen write throttled', devices.includes('>= 60_000') && devices.includes('const stale =')],
  ['Vercel ignores desktop build artifacts', ignore.includes('desktop-bridge/') && ignore.includes('*.exe') && ignore.includes('*.zip')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
if (failed) process.exit(1);
