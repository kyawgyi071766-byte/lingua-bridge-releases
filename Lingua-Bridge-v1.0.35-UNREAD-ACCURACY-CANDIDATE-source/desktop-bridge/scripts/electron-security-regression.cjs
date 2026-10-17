const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const hostPreload = fs.readFileSync(path.join(root, 'electron/host-preload.cjs'), 'utf8');
const servicePreload = fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8');

assert.match(main, /contextIsolation:\s*true/);
assert.match(main, /nodeIntegration:\s*false/);
assert.match(main, /sandbox:\s*true/, 'host and webview sandboxing must be enabled');
assert.match(main, /webSecurity:\s*true/);
assert.match(main, /allowRunningInsecureContent:\s*false/);
assert.match(main, /nodeIntegrationInSubFrames\s*=\s*false/);
assert.match(main, /function isSafeHttpsUrl\(raw\)/);
assert.match(main, /url\.protocol === 'https:'/);
assert.match(main, /!url\.username && !url\.password/, 'HTTPS URLs with embedded credentials must be rejected');
assert.match(main, /if \(!isSafeHttpsUrl\(src\)\)\s*\{\s*event\.preventDefault\(\)/);
assert.match(main, /contents\.on\('will-navigate'/);
assert.match(main, /contents\.on\('will-redirect'/);
assert.match(main, /const packagedUrl = pathToFileURL/);
assert.match(main, /return \{ action: 'deny' \}/, 'window creation must be denied');
assert.match(main, /clipboard-sanitized-write/);
assert.doesNotMatch(main, /\['notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write'\]/, 'embedded clipboard reads must not be granted');
assert.match(main, /contents\.setWindowOpenHandler/);
assert.match(main, /if \(isSafeHttpsUrl\(url\)\) void shell\.openExternal\(url\)/);
assert.match(hostPreload, /contextBridge\.exposeInMainWorld/);
assert.doesNotMatch(hostPreload, /exposeInMainWorld\([^,]+,\s*ipcRenderer\s*\)/, 'raw ipcRenderer must never be exposed to page JavaScript');
assert.match(servicePreload, /require\('electron'\)/);

console.log('PASS Electron WebView hardening static regression checks.');
console.log('NOTE This is a source-level regression only; it is not a penetration test or live Electron runtime test.');
