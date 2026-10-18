'use strict';
// Execute actual transpiled TypeScript auth handlers with an isolated in-memory
// Prisma/Resend test double. No real accounts/emails are created.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
process.env.AUTH_SECRET = 'regression-only-server-secret-12345678901234567890';
process.env.NODE_ENV = 'test';

function loadTS(relative, modules = {}) {
  const input = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  const output = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  const customRequire = name => {
    if (Object.prototype.hasOwnProperty.call(modules, name)) return modules[name];
    if (name === 'crypto') return crypto;
    throw new Error('Unexpected import ' + name + ' from ' + relative);
  };
  const context = vm.createContext({ module: mod, exports: mod.exports, require: customRequire, process, Buffer, URL, Date, console });
  vm.runInContext(output, context, { filename: relative });
  return mod.exports;
}
const security = {
  normalizeEmail: value => typeof value === 'string' ? value.trim().toLowerCase() : '',
  hashToken: value => crypto.createHash('sha256').update(value).digest('hex'),
  isCrossSiteRequest: request => request.headers.get('sec-fetch-site') === 'cross-site',
  emailVerificationRequired: () => true,
  getClientAddress: () => '203.0.113.30',
  strongPasswordError: pw => !/^(?=.{10,128}$)(?=.*[A-Za-z])(?=.*\d)/.test(pw) ? 'Invalid password' : null,
};
const codes = loadTS('src/lib/emailCodes.ts', { './security': security });
assert.equal(codes.isAcceptableRegistrationEmail('user@gmail.com'), true);
assert.equal(codes.isAcceptableRegistrationEmail('user+alias@gmail.com'), true);
assert.equal(codes.isAcceptableRegistrationEmail('temporary@mailinator.com'), false);
assert.equal(codes.isAcceptableRegistrationEmail('test@example.com'), false);
assert.notEqual(codes.hashEmailCode('verify-email', 'user@gmail.com', '012345'), codes.hashEmailCode('reset-password', 'user@gmail.com', '012345'));
assert.notEqual(codes.hashEmailCode('verify-email', 'user@gmail.com', '012345'), codes.hashEmailCode('verify-email', 'other@gmail.com', '012345'));
assert.match(codes.generateEmailCode(), /^\d{6}$/);

const serverSecurity = loadTS('src/lib/security.ts');
const serverEmail = loadTS('src/lib/email.ts', { './security': { getSiteUrl: () => 'https://lingua.example.org' } });
process.env.NODE_ENV = 'production';
process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
process.env.RESEND_API_KEY = 're_mock-test-only';
process.env.EMAIL_FROM = 'Lingua <onboarding@resend.dev>';
assert.equal(serverSecurity.emailVerificationRequired(), true, 'production verification cannot be switched off');
assert.equal(serverEmail.emailConfigured(), false, 'Resend shared testing sender must fail closed in production');
process.env.EMAIL_FROM = 'Lingua <accounts@owner-verified-domain.org>';
assert.equal(serverEmail.emailConfigured(), true, 'a configured production sender is allowed');
process.env.NODE_ENV = 'test';
delete process.env.RESEND_API_KEY;
delete process.env.EMAIL_FROM;
delete process.env.EMAIL_VERIFICATION_REQUIRED;
assert.match(fs.readFileSync(path.join(ROOT, 'src/lib/auth.ts'), 'utf8'),
  /emailVerificationRequired\(\) && !user\.emailVerifiedAt/, 'existing sessions must also require verified mailboxes');


const users = [];
const sends = [];
const sessions = [];
const rateCounts = new Map();
const prisma = { user: {
  findUnique: async ({where}) => users.find(user => Object.entries(where).every(([key,value]) => user[key] === value)) || null,
  create: async ({data}) => { const user = { id: 'usr_' + (users.length+1), sessionVersion: 0, ...data }; users.push(user); return user; },
  update: async ({where,data}) => {
    const user = users.find(u => u.id === where.id);
    assert(user, 'test account exists for update');
    Object.assign(user, data);
    return user;
  },
  updateMany: async ({where,data}) => {
    const user = users.find(u => Object.entries(where).every(([key,value]) =>
      value && typeof value === 'object' && 'gt' in value
        ? u[key] && new Date(u[key]).getTime() > new Date(value.gt).getTime()
        : u[key] === value
    ));
    if (!user) return { count: 0 };
    for (const [key,value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'increment' in value) user[key] += value.increment;
      else user[key] = value;
    }
    return { count: 1 };
  },
}};
const rateLimit = { consumeRateLimit: async (scope, identifier, max) => {
  const key = scope + ':' + identifier;
  const value = 1 + (rateCounts.get(key)||0);
  rateCounts.set(key,value);
  return { allowed: value <= max, retryAfterSeconds: 900 };
} };
const email = {
  emailConfigured: () => true,
  sendVerificationEmail: async (to,code) => { sends.push({kind:'verify',to,code}); },
  sendPasswordResetEmail: async (to,code) => { sends.push({kind:'reset',to,code}); },
};
const auth = {
  hashPassword: async pw => 'bcrypt-test:' + pw,
  createSession: async id => { sessions.push(id); },
};
const next = { NextResponse: { json: (body, options = {}) => ({ body, status:options.status || 200 }) } };
const modules = {
  'next/server':next, '@/lib/prisma': {prisma}, '@/lib/auth':auth,
  '@/lib/email':email, '@/lib/emailCodes':codes, '@/lib/rateLimit':rateLimit,
  '@/lib/security':security
};
const handlers = Object.fromEntries(
  ['signup','verify-email','resend-verification','forgot-password','reset-password']
    .map(name => [name,loadTS('src/app/api/auth/' + name + '/route.ts', modules).POST])
);
function request(body, headers = {}) {
  return { headers:{ get: key => headers[key.toLowerCase()] || null }, json: async () => body };
}
async function expectStatus(name,body,status) {
  const response = await handlers[name](request(body));
  assert.equal(response.status,status, name + ': ' + JSON.stringify(response.body));
  return response;
}
async function run() {
  await expectStatus('signup',{email:'temp@guerrillamail.com',password:'Password12345'},400);
  assert.equal(users.length,0,'disposable signup must not create a database row');
  const username = 'real.user+test@gmail.com';
  const signup = await expectStatus('signup',{email:username,password:'Password12345'},200);
  assert.equal(signup.body.needsVerification,true);
  assert.equal(users.length,1);
  assert.equal(users[0].emailVerifiedAt,null,'new account must not be verified');
  assert.equal(sessions.length,0,'new unverified user cannot receive login session');
  const code1 = sends.at(-1).code;
  assert.match(code1, /^\d{6}$/);
  assert.equal(users[0].verificationTokenHash,codes.hashEmailCode('verify-email',username,code1));
  assert(users[0].verificationExpiresAt.getTime() <= Date.now() + codes.EMAIL_CODE_TTL_MS);
  await expectStatus('verify-email',{email:username,token:'999999'},400);
  await expectStatus('resend-verification',{email:username},200);
  const code2 = sends.at(-1).code;
  await expectStatus('verify-email',{email:username,token:code1},code1 === code2 ? 200 : 400);
  if (code1 !== code2) await expectStatus('verify-email',{email:username,token:code2},200);
  assert(users[0].emailVerifiedAt,'email confirmed after valid code');
  assert.equal(sessions.length,1,'verification creates exactly one session');
  await expectStatus('verify-email',{email:username,token:code2},400);
  const forgot = await expectStatus('forgot-password',{email:username},200);
  assert.equal(forgot.body.ok,true);
  const resetCode = sends.at(-1).code;
  assert.match(resetCode,/^\d{6}$/);
  assert.equal(users[0].resetTokenHash,codes.hashEmailCode('reset-password',username,resetCode));
  await expectStatus('reset-password',{email:username,token:'999999',password:'NewPassword123'},400);
  const priorSessionVersion = users[0].sessionVersion;
  await expectStatus('reset-password',{email:username,token:resetCode,password:'NewPassword123'},200);
  assert.equal(users[0].passwordHash,'bcrypt-test:NewPassword123');
  assert.equal(users[0].sessionVersion,priorSessionVersion+1,'password reset invalidates earlier sessions');
  await expectStatus('reset-password',{email:username,token:resetCode,password:'NewPassword123'},400);
  assert.equal(sessions.length,2,'password reset creates new session only on success');
  // Historical secure 64-hex links stay supported until their original expiry.
  const oldToken = 'a'.repeat(64);
  users[0].resetTokenHash = security.hashToken(oldToken);
  users[0].resetExpiresAt = new Date(Date.now()+3600000);
  await expectStatus('reset-password',{token:oldToken,password:'LegacyPassword234'},200);
  assert.equal(users[0].passwordHash,'bcrypt-test:LegacyPassword234');
  console.log('PASS disposable domain check, OTP signup/resend/verify, expiry, one-time use, password recovery, session rotation and legacy reset link');
}
run().catch(error => { console.error(error); process.exitCode=1; });
