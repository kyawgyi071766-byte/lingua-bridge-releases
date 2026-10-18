'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/security.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
vm.runInNewContext(output, {
  module: mod, exports: mod.exports, require: name => {
    if (name === 'crypto') return crypto;
    throw new Error('Unexpected dependency: ' + name);
  }, process, URL, TextEncoder, Buffer,
});
const { isUnsafeCrossOriginRequest } = mod.exports;
function check(origin, fetchSite = 'same-origin') {
  const headers = new Map();
  if (origin !== null) headers.set('origin', origin);
  if (fetchSite !== null) headers.set('sec-fetch-site', fetchSite);
  return isUnsafeCrossOriginRequest({headers: {get: name => headers.get(name) || null}});
}
const original = {
  node: process.env.NODE_ENV,
  site: process.env.NEXT_PUBLIC_SITE_URL,
  extras: process.env.ADDITIONAL_SITE_ORIGINS,
};
try {
  process.env.NODE_ENV = 'production';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://lingua-github-import.vercel.app';
  process.env.ADDITIONAL_SITE_ORIGINS = 'https://lingua-bridge-sshk.vercel.app';
  assert.equal(check('https://lingua-github-import.vercel.app'), false, 'original site works');
  assert.equal(check('https://lingua-bridge-sshk.vercel.app'), false, 'free branded alias works');
  assert.equal(check('https://lingua-bridge-sshk.vercel.app', 'cross-site'), true, 'cross-site metadata always blocked');
  assert.equal(check('https://lingua-bridge-sshk.vercel.app.attacker.invalid'), true, 'suffix confusion blocked');
  assert.equal(check('https://other-project.vercel.app'), true, 'other Vercel projects blocked');
  assert.equal(check('https://lingua-bridge-sshk.vercel.app:444'), true, 'unknown port blocked');
  assert.equal(check('http://lingua-bridge-sshk.vercel.app'), true, 'insecure origin blocked');
  assert.equal(check('https://lingua-bridge-sshk.vercel.app/hidden'), true, 'non-origin URL blocked');
  assert.equal(check('https://lingua-bridge-sshk.vercel.app@bad.example'), true, 'embedded credentials blocked');
  assert.equal(check(null, 'same-origin'), false, 'existing same-origin fetch metadata support remains');
  assert.equal(check(null, 'cross-site'), true, 'missing origin cross-site blocked');
  delete process.env.ADDITIONAL_SITE_ORIGINS;
  assert.equal(check('https://lingua-bridge-sshk.vercel.app'), true, 'alias fails closed without allowlist');
  console.log('PASS exact HTTPS origin allowlist for branded free domain; unsafe origins rejected.');
} finally {
  for (const [field, key] of [['node','NODE_ENV'],['site','NEXT_PUBLIC_SITE_URL'],['extras','ADDITIONAL_SITE_ORIGINS']]) {
    if (original[field] === undefined) delete process.env[key];
    else process.env[key] = original[field];
  }
}
