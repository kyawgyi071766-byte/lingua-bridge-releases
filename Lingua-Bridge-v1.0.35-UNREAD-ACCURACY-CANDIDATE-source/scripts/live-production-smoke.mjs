'use strict';
/**
 * Probe the real deployed Lingua backend with no account credentials.
 * All translation attempts here MUST be rejected before provider inference:
 * this validates server health, auth boundary, and request routing but does
 * NOT claim any provider's authenticated translation output was verified.
 */
const base = process.env.LINGUA_BASE_URL || 'https://lingua-github-import.vercel.app';
const results = [];
async function probe(label, method, pathname, opts = {}) {
  const url = new URL(pathname, base);
  const headers = { accept: 'application/json', ...(opts.headers || {}) };
  if (opts.body) headers['content-type'] = 'application/json';
  const result = { name: label, url: url.pathname, method, status: 0, json: null };
  try {
    const res = await fetch(url, {
      method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(20000)
    });
    result.status = res.status;
    const raw = await res.text();
    try { result.json = JSON.parse(raw); } catch { result.body = raw.slice(0, 120); }
  } catch (err) {
    result.error = String(err?.message || err).slice(0, 200);
  }
  results.push(result);
  console.log(label, JSON.stringify(result));
  return result;
}
function check(result, ok, reason) {
  if (!ok) {
    console.error('FAIL ' + reason + ': ' + JSON.stringify(result));
    process.exitCode = 1;
  } else console.log('PASS ' + reason);
}
const health = await probe('database health', 'GET', '/api/health');
check(health, health.status === 200 && health.json?.status === 'ok', 'database is healthy');
const status = await probe('unauthenticated provider status', 'GET', '/api/translate/status');
check(status, status.status === 401, 'provider status requires login');
const unauth = await probe('unauthenticated real translate', 'POST', '/api/translate', {
  body: { text: 'Good morning', sourceLang: 'en', targetLang: 'my' }
});
check(unauth, unauth.status === 401, 'real inference requires login (not called here)');

const sameOrigin = await probe('branded alias same-origin translate', 'POST', '/api/translate', {
  headers: { Origin: new URL(base).origin, 'sec-fetch-site': 'same-origin' },
  body: { text: 'Good morning', sourceLang: 'en', targetLang: 'my' },
});
check(sameOrigin, sameOrigin.status === 401, 'a browser on the branded alias reaches login boundary without CSRF failure');

// Origin-only requests without browser Fetch Metadata are still rejected by
// authentication. Real cross-site browser fetches send sec-fetch-site: cross-site.
const foreignOrigin = await probe('foreign-origin unauthenticated translate', 'POST', '/api/translate', {
  headers: { Origin: 'https://untrusted.example' },
  body: { text: 'Hello', sourceLang: 'en', targetLang: 'es' }
});
check(foreignOrigin, foreignOrigin.status === 401 || foreignOrigin.status === 403,
  'foreign-origin requests without a session cannot translate');
const csrf = await probe('browser cross-site translate', 'POST', '/api/translate', {
  headers: { Origin: 'https://untrusted.example', 'sec-fetch-site': 'cross-site' },
  body: { text: 'Hello', sourceLang: 'en', targetLang: 'es' }
});
check(csrf, csrf.status === 403, 'browser cross-site translation is rejected before login');
const downloads = await probe('public download metadata', 'GET', '/api/download/list');
const windows = downloads.json?.downloads?.find?.(item => item.id === 'windows');
check(downloads, downloads.status === 200 && downloads.json?.authorized && windows?.available && String(windows.href).endsWith('/Lingua-Bridge-Setup-1.0.36.exe'), 'published Windows EXE is available publicly');
const updates = await probe('desktop update metadata', 'GET', '/api/desktop/update?platform=win32&arch=x64&current=1.0.35&channel=stable');
const expectedSha = 'c7e83faf01c3a016351baa1cde50b8650378a569ef3c14873763789c9333ec8c';
check(updates, updates.status === 200 && updates.json?.configured && updates.json?.version === '1.0.36'
  && updates.json?.sha256 === expectedSha
  && updates.json?.downloadUrl === windows?.href,
  'stable update feed points to the SHA-256 of the newly published Windows EXE');
console.log('NOTE: authenticated Gemini/DeepL output and live Telegram UI are NOT verified by this smoke test.');
