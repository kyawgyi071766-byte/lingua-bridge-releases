const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
function handler(channel) {
  const start = main.indexOf(`ipcMain.handle('${channel}'`);
  const end = main.indexOf('\n});', start) + 4;
  assert(start >= 0 && end > start);
  return main.slice(start, end);
}

(async () => {
  let mode = 'ok';
  let requests = 0;
  const server = http.createServer(async (req, res) => {
    requests++;
    let body = '';
    for await (const chunk of req) body += chunk;
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/auth/login') {
      if (mode !== 'missing-cookie') res.setHeader('Set-Cookie', 'lingua_session=test-session; HttpOnly; Path=/');
      res.end(JSON.stringify({ ok: true, email: 'test@example.invalid' }));
    } else if (mode === 'expired') {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Please log in to translate.' }));
    } else if (mode === 'provider-error') {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'Test provider unavailable.' }));
    } else {
      assert.match(req.headers.cookie || '', /test-session/);
      assert.equal(JSON.parse(body).targetLang, 'zh');
      res.end(JSON.stringify({ translated: '你好', provider: 'fixture' }));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const handlers = {};
  const c = vm.createContext({
    ipcMain: { handle: (name, fn) => handlers[name] = fn },
    fetch, Headers,
    getServerUrl: () => `http://127.0.0.1:${server.address().port}`,
    deviceIdentity: () => ({fingerprint:'isolated-test', name:'Test', type:'desktop', platform:'test', appVersion:'1.0.36'}),
    saveAuthState() {},
    mockTranslate: () => ({translatedText:'mock'}),
  });
  const start = main.indexOf('function parseSetCookie(');
  const end = main.indexOf('\nipcMain.on(', start);
  vm.runInContext(`let authCookie = ''; let signedInEmail = ''; const translationCache = new Map(); function rememberTranslation(k,v) {translationCache.set(k,v);}\n` + main.slice(start, end) + handler('lingua:login') + handler('lingua:translate'), c);
  const translate = () => handlers['lingua:translate'](null, {text:'Hello', sourceLang:'en', targetLang:'zh'});
  try {
    assert.equal((await translate()).status, 401);
    assert.equal(requests, 0, 'logged-out translation never reaches provider');
    mode = 'missing-cookie';
    assert.equal((await handlers['lingua:login'](null, {email:'test@example.invalid',password:'fixture'})).ok, false);
    mode = 'ok';
    assert.equal((await handlers['lingua:login'](null, {email:'test@example.invalid',password:'fixture'})).ok, true);
    assert.equal((await translate()).translatedText, '你好');
    vm.runInContext('translationCache.clear()', c);
    mode = 'provider-error';
    assert.equal((await translate()).error, 'Test provider unavailable.');
    mode = 'expired';
    assert.equal((await translate()).status, 401);
    assert.equal(vm.runInContext('authCookie', c), '');
    const renderer = vm.createContext({
      state:{translationMode:'live',signedInEmail:'test@example.invalid',accountStatus:{ok:true},voiceUsage:{}},
      window:{linguaDesktop:{translate:async()=>({ok:false,status:401,error:'Please log in to translate.'})}},
      currentSettings:()=>({sourceLang:'auto'}), render(){},
    });
    const a = app.indexOf('async function translateText(');
    const b = app.indexOf('\nasync function translateCompose(', a);
    vm.runInContext(app.slice(a,b), renderer);
    await assert.rejects(vm.runInContext("translateText('Hello','zh','en')", renderer), /Please log in/);
    assert.equal(renderer.state.signedInEmail, '');
    assert.equal(renderer.state.accountStatus, null);
    assert(app.includes("setNotice(error.message || 'Translation failed.', true)"));
    assert(app.includes("setNotice(result.error || (result.kind === 'send'"));
    console.log('PASS isolated HTTP server: login, missing cookie, authenticated translation, provider failure, session expiry, renderer recovery');
    console.log('Fixture provider only: this does not verify live GPU/translation providers or Windows Telegram interaction.');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
