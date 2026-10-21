// Source-contract regression checks. No user sessions, network calls, or API secrets are used.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const read = (name) => fs.readFileSync(name, 'utf8');
const server = read('src/app/api/smart-reply/route.ts');
const chat = read('src/app/dashboard/chat/page.tsx');
const settings = read('src/lib/settings.ts');
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
  ['selected GPT provider implemented', translator.includes('translateOpenAI') && translator.includes("provider === 'openai'")],
];

let failures = 0;
for (const [label, passes] of checks) {
  console.log((passes ? 'PASS' : 'FAIL') + ' ' + label);
  if (!passes) failures++;
}
assert.equal(failures, 0, failures + ' Smart Reply regression check(s) failed');
