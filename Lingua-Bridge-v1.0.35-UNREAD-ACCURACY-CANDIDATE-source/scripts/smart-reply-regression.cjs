// Source-contract regression checks. No user sessions, network calls, or API secrets are used.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const read = (name) => fs.readFileSync(name, 'utf8');
const server = read('src/app/api/smart-reply/route.ts');
const chat = read('src/app/dashboard/chat/page.tsx');
const settings = read('src/lib/settings.ts');
const accountSecurity = read('src/lib/security.ts');
const translator = read('src/lib/translator.ts');
const translateRoute = read('src/app/api/translate/route.ts');

const checks = [
  ['auth before AI call', server.indexOf('getCurrentUser()') >= 0 && server.indexOf('getCurrentUser()') < server.indexOf("fetch('https://api.openai.com/v1/responses'")],
  ['account suspension respected', server.includes('user.suspended') && server.includes('usage.suspended')],
  ['rate limits and usage reservation', server.includes("smart-reply-hourly") && server.includes("smart-reply-daily") && server.includes('usageChars: { increment: charCount }')],
  ['failed completions refund reservation', server.includes('usageChars: { decrement: charCount }')],
  ['bounded conversation context', server.includes('MAX_CONTEXT_MESSAGES = 8') && server.includes('MAX_CONTEXT_CHARS = 2400')],
  ['server-only model credentials', server.includes('process.env.OPENAI_API_KEY') && !chat.includes('OPENAI_API_KEY')],
  ['provider persistence disabled', server.includes('store: false')],
  ['structured three-reply output', server.includes('json_schema') && server.includes('parsed.replies.length !== 3')],
  ['tone and warmth inputs validated', server.includes("hasOwnProperty.call(REPLY_TONES") && server.includes("hasOwnProperty.call(WARMTH_LEVELS")],
  ['romance bounded by context', server.includes('when the existing conversation supports mutual romantic interest')],
  ['prior questions are not repeated', server.includes('Never repeat a question already asked')],
  ['user must review drafts', chat.includes('Use &amp; edit') && chat.includes('Nothing is sent automatically.')],
  ['tone is passed to server', chat.includes('tone: settings.smartReplyTone') && chat.includes('warmth: settings.smartReplyWarmth')],
  ['reply language choices', chat.includes('replyLanguageMode === "theirs" ? settings.theirLang : settings.myLang')],
  ['language state reset for incoming messages', chat.includes('side === "them" && draftInTheirLanguage')],
  ['translation still honors chosen engine', translateRoute.includes('translateText(text, targetLang, sourceLang, engine)')],
  ['site preferences include warm style', settings.includes('smartReplyTone: "warm"') && settings.includes('smartReplyWarmth: "natural"')],
  ['AI message context requires opt-in', settings.includes('includeSmartReplyContext: false') && chat.includes('settings.includeSmartReplyContext') && chat.includes('sent to AI provider')],
  ['all chat preferences are account-scoped', settings.includes('settingsKey(accountEmail)') && chat.includes('loadSettings(data.email)') && chat.includes('saveSettings(next, accountEmail)')],
  ['settings page requires auth for preferences', read('src/app/dashboard/settings/page.tsx').includes('loadSettings(data.email)')],
  ['clipboard and share use account preferences', ['clipboard', 'share'].every((page) => read('src/app/dashboard/' + page + '/page.tsx').includes('loadSettings(data.email)'))],
  ['preview recovery emails use validated hostname', accountSecurity.includes("process.env.VERCEL_ENV === 'preview'") && accountSecurity.includes('Invalid Vercel Preview hostname')],
  ['selected GPT provider implemented', translator.includes('translateOpenAI') && translator.includes("provider === 'openai'")],
];

let failures = 0;
for (const [label, passes] of checks) {
  console.log((passes ? 'PASS' : 'FAIL') + ' ' + label);
  if (!passes) failures++;
}
assert.equal(failures, 0, failures + ' Smart Reply regression check(s) failed');
const { spawnSync } = require('node:child_process');
const previewPreflight = 'scripts/assert-preview-database.cjs';
const testEnv = (extra) => ({
  ...process.env,
  VERCEL_ENV: 'preview',
  DATABASE_URL: 'postgresql://tester:placeholder@staging-db.neon.tech:5432/neondb',
  LINGUA_PREVIEW_NEON_HOST: 'staging-db.neon.tech',
  ...extra,
});
const testGuard = (env) => spawnSync(process.execPath, [previewPreflight], { encoding: 'utf8', env }).status;
assert.equal(testGuard(testEnv({})), 0, 'Isolated preview DB should pass build preflight');
assert.notEqual(testGuard(testEnv({ LINGUA_PREVIEW_NEON_HOST: 'production-db.neon.tech' })), 0,
  'Preview must reject production database endpoint');
assert.notEqual(testGuard(testEnv({ LINGUA_PREVIEW_NEON_HOST: '' })), 0,
  'Preview must fail closed when expected DB host is missing');
console.log('PASS preview database guard behavioral tests');

