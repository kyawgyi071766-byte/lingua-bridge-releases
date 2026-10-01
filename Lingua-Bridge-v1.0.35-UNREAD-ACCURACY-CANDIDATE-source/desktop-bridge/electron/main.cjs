const { app, BrowserWindow, ipcMain, shell, session, safeStorage, Notification, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { once } = require('events');

const DEFAULT_SERVER_URL = 'https://lingua-github-import.vercel.app';
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';
const TRUSTED_MESSENGER_HOSTS = [
  'web.whatsapp.com', 'web.telegram.org', 'messenger.com', 'www.messenger.com',
  'facebook.com', 'www.facebook.com', 'instagram.com', 'www.instagram.com',
  'discord.com', 'x.com', 'twitter.com', 'chat.google.com', 'vk.com', 'www.tiktok.com',
  'slack.com', 'messages.google.com', 'linkedin.com', 'www.linkedin.com', 'signal.org', 'www.signal.org'
];


let cachedDeviceIdentity = null;
function asciiHeader(value, max = 80) {
  return String(value || '').replace(/[^\x20-\x7E]/g, ' ').trim().slice(0, max);
}
function machineGuidSeed() {
  if (process.platform === 'win32') {
    try {
      const output = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], {
        encoding: 'utf8', windowsHide: true, timeout: 3000
      });
      const match = output.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);
      if (match?.[1]) return match[1].trim();
    } catch (_) {}
  }
  return [os.hostname(), os.platform(), os.arch(), os.release()].join('|');
}
function deviceIdentity() {
  if (cachedDeviceIdentity) return cachedDeviceIdentity;
  const seed = `lingua-device-v1|${machineGuidSeed()}|${os.arch()}`;
  // The stable identifier is derived in memory only. It is never persisted by
  // Lingua Bridge. The server HMAC-hashes it again before database storage.
  const fingerprint = crypto.createHash('sha256').update(seed).digest('hex');
  cachedDeviceIdentity = {
    fingerprint,
    name: asciiHeader(os.hostname() || 'Windows PC'),
    type: 'desktop',
    platform: asciiHeader(`${process.platform} ${os.release()} ${os.arch()}`),
    appVersion: asciiHeader(app.getVersion ? app.getVersion() : '1.0.6', 40)
  };
  return cachedDeviceIdentity;
}

let mainWindow;
let authCookie = '';
let signedInEmail = '';
const translationCache = new Map();
let maxTranslationCache = 600;
const guestDirectSendState = new Map();
const verifiedUpdateFiles = new Set();

function updateGuestDirectSendState(senderId, payload = {}) {
  guestDirectSendState.set(senderId, {
    composerFocused: Boolean(payload.composerFocused),
    enabled: Boolean(payload.enabled)
  });
}

function shouldInterceptGuestEnter(contents, input) {
  const state = guestDirectSendState.get(contents.id);
  if (!state?.enabled || !state?.composerFocused) return false;
  if (input.type !== 'keyDown' || input.key !== 'Enter') return false;
  if (input.shift || input.control || input.alt || input.meta) return false;
  return true;
}

function shouldUseEscapeForEmbeddedBack(contents, input) {
  if (!contents || input?.type !== 'keyDown' || input?.key !== 'Escape') return false;
  try {
    if (!contents.canGoBack()) return false;
    const currentUrl = String(contents.getURL?.() || '');
    // While the user is still on Telegram/WhatsApp/etc, Escape remains available
    // to the messenger itself for dialogs and overlays. If an external link has
    // replaced the messenger page in the same persistent webview, Escape becomes
    // a one-key Back action without recreating or reloading the messenger session.
    return Boolean(currentUrl && !isTrustedMessengerUrl(currentUrl));
  } catch (_) {
    return false;
  }
}

function getServerUrl() {
  return String(process.env.LINGUA_SERVER_URL || DEFAULT_SERVER_URL).replace(/\/$/, '');
}

function authStatePath() {
  return path.join(app.getPath('userData'), 'lingua-auth.bin');
}

function saveAuthState() {
  try {
    const file = authStatePath();
    if (!authCookie) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
      return;
    }
    const payload = JSON.stringify({ authCookie, signedInEmail });
    if (safeStorage.isEncryptionAvailable()) {
      fs.writeFileSync(file, safeStorage.encryptString(payload));
    }
  } catch (error) {
    console.warn('Could not persist Lingua auth session:', error?.message || error);
  }
}

function loadAuthState() {
  try {
    const file = authStatePath();
    if (!fs.existsSync(file) || !safeStorage.isEncryptionAvailable()) return;
    const parsed = JSON.parse(safeStorage.decryptString(fs.readFileSync(file)));
    authCookie = typeof parsed.authCookie === 'string' ? parsed.authCookie : '';
    signedInEmail = typeof parsed.signedInEmail === 'string' ? parsed.signedInEmail : '';
  } catch (_) {
    authCookie = '';
    signedInEmail = '';
  }
}

function createWindow() {
  // Keep the native Windows chrome consistent with Lingua's dark UI.
  nativeTheme.themeSource = 'dark';
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0f1115',
    title: 'Lingua Bridge — Thank you to all our users • 感谢所有用户的支持',
    icon: path.join(__dirname, '..', 'assets', 'lingua-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'host-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Host UI microphone permission is used only by the Voice Translator control.
  // Messenger webviews use their own isolated session permission handlers below.
  try {
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      const isHost = webContents.id === mainWindow.webContents.id;
      callback(Boolean(isHost && permission === 'media'));
    });
  } catch (_) {}

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) mainWindow.loadURL(devUrl);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

function isTrustedMessengerUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && TRUSTED_MESSENGER_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch (_) {
    return false;
  }
}

function configureGuestWebContents(contents) {
  try { contents.setUserAgent(CHROME_UA); } catch (_) {}
  try {
    contents.on('before-input-event', (event, input) => {
      if (shouldUseEscapeForEmbeddedBack(contents, input)) {
        event.preventDefault();
        try { contents.goBack(); } catch (_) {}
        return;
      }
      if (!shouldInterceptGuestEnter(contents, input)) return;
      // Chromium-level interception happens before Telegram/WhatsApp page handlers,
      // so the original source text cannot be sent by the messenger itself.
      event.preventDefault();
      try { contents.send('lingua-native-enter', { trigger: 'before-input-event' }); } catch (_) {}
    });
    contents.once('destroyed', () => guestDirectSendState.delete(contents.id));
  } catch (_) {}
  try {
    contents.setWindowOpenHandler(({ url }) => {
      if (/^https:\/\//i.test(url)) {
        contents.loadURL(url).catch(() => shell.openExternal(url));
      }
      return { action: 'deny' };
    });
  } catch (_) {}
  try {
    contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      const origin = webContents.getURL();
      const trusted = isTrustedMessengerUrl(origin);
      const allowed = trusted && ['notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write'].includes(permission);
      callback(Boolean(allowed));
    });
  } catch (_) {}
}

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    const src = String(params.src || '');
    if (!/^https:\/\//i.test(src)) {
      event.preventDefault();
      return;
    }
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = false;
    webPreferences.preload = path.join(__dirname, 'service-preload.cjs');
    params.userAgent = CHROME_UA;
  });
  contents.on('did-attach-webview', (_event, guest) => configureGuestWebContents(guest));
});

function parseSetCookie(headers) {
  if (typeof headers.getSetCookie === 'function') {
    const values = headers.getSetCookie();
    return values.map(v => v.split(';')[0]).join('; ');
  }
  const raw = headers.get('set-cookie') || '';
  return raw.split(/,(?=[^;,]+=)/).map(v => v.split(';')[0]).filter(Boolean).join('; ');
}

async function apiFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (authCookie) headers.set('Cookie', authCookie);
  const device = deviceIdentity();
  headers.set('X-Lingua-Client', 'desktop');
  headers.set('X-Lingua-Device-Fingerprint', device.fingerprint);
  headers.set('X-Lingua-Device-Name', device.name);
  headers.set('X-Lingua-Device-Type', device.type);
  headers.set('X-Lingua-Platform', device.platform);
  headers.set('X-Lingua-App-Version', device.appVersion);
  return fetch(`${getServerUrl()}${endpoint}`, { ...options, headers, redirect: 'manual' });
}

ipcMain.on('lingua:guest-direct-send-state', (event, payload) => {
  updateGuestDirectSendState(event.sender.id, payload || {});
});

ipcMain.handle('lingua:server-info', async () => ({ serverUrl: getServerUrl(), signedInEmail }));

ipcMain.handle('lingua:login', async (_event, { email, password }) => {
  try {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, status: response.status, error: data.error || 'Login failed.' };
    const cookie = parseSetCookie(response.headers);
    if (cookie) authCookie = cookie;
    signedInEmail = email;
    saveAuthState();
    return { ok: true, email };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
});


ipcMain.handle('lingua:account-status', async () => {
  if (!authCookie) return { ok: false, status: 401, error: 'Log in to your Lingua account first.' };
  try {
    const response = await apiFetch('/api/auth/me', { method: 'GET' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        authCookie = '';
        signedInEmail = '';
        saveAuthState();
      }
      return { ok: false, status: response.status, error: data.error || data.message || `Could not load account status (HTTP ${response.status}).` };
    }
    return {
      ok: true,
      email: data.email || signedInEmail,
      name: data.name || '',
      role: data.role || 'user',
      plan: data.plan || 'free',
      grantType: data.grantType || 'free',
      paidUntil: data.paidUntil || null,
      devices: data.devices || { limited:false, count:0, limit:null, currentDeviceId:null, canSelfRemove:false, ownerRemovalRequired:false, items:[] }
    };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
});

ipcMain.handle('lingua:remove-device', async (_event, { deviceId }) => {
  if (!authCookie) return { ok:false, status:401, error:'Log in to your Lingua account first.' };
  const id = String(deviceId || '').trim();
  if (!id) return { ok:false, error:'Choose a device to remove.' };
  try {
    const response = await apiFetch('/api/devices', {
      method:'DELETE',
      body:JSON.stringify({ deviceId:id })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok:false, status:response.status, error:data.error || `Could not remove device (HTTP ${response.status}).` };
    return { ok:true, ...data };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

ipcMain.handle('lingua:logout', async () => {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch (_) {}
  authCookie = '';
  signedInEmail = '';
  saveAuthState();
  return { ok: true };
});

ipcMain.handle('lingua:open-billing', async () => {
  shell.openExternal(`${getServerUrl()}/billing`);
  return { ok: true };
});

ipcMain.handle('lingua:open-external', async (_event, url) => {
  if (/^https:\/\//i.test(String(url || ''))) await shell.openExternal(String(url));
  return { ok: true };
});

function signalProtocolRegistered() {
  if (process.platform !== 'win32') return false;
  for (const key of [
    'HKCR\\sgnl\\shell\\open\\command',
    'HKCU\\Software\\Classes\\sgnl\\shell\\open\\command'
  ]) {
    try {
      execFileSync('reg', ['query', key, '/ve'], { encoding:'utf8', windowsHide:true, timeout:2500 });
      return true;
    } catch (_) {}
  }
  return false;
}

function findSignalExecutable() {
  if (process.platform !== 'win32') return '';
  const candidates = [
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'signal-desktop', 'Signal.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Signal', 'Signal.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'signal-desktop', 'Signal.exe'),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Signal', 'Signal.exe'),
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Signal', 'Signal.exe')
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate; } catch (_) {}
  }
  try {
    const output = execFileSync('where.exe', ['Signal.exe'], { encoding:'utf8', windowsHide:true, timeout:2500 });
    const found = String(output || '').split(/\r?\n/).map(x => x.trim()).find(Boolean);
    if (found && fs.existsSync(found)) return found;
  } catch (_) {}
  return '';
}


ipcMain.handle('lingua:notify-unread', async (_event, payload = {}) => {
  try {
    if (mainWindow?.isFocused?.()) return { ok:true, shown:false, reason:'focused' };
    if (!Notification.isSupported()) return { ok:true, shown:false, reason:'unsupported' };
    const label = asciiHeader(payload.label || 'Messaging account', 80) || 'Messaging account';
    const count = Math.max(1, Math.min(999, Number(payload.count || 1)));
    const notification = new Notification({
      title: 'Lingua Bridge',
      body: `${label}: ${count} new message${count === 1 ? '' : 's'}`,
      silent: false
    });
    notification.on('click', () => {
      try {
        if (mainWindow?.isMinimized?.()) mainWindow.restore();
        mainWindow?.show?.();
        mainWindow?.focus?.();
      } catch (_) {}
    });
    notification.show();
    return { ok:true, shown:true };
  } catch (error) {
    return { ok:false, error:error?.message || 'Could not show notification.' };
  }
});

ipcMain.handle('lingua:signal-status', async () => {
  try {
    const exe = findSignalExecutable();
    const protocolRegistered = signalProtocolRegistered();
    return {
      ok: true,
      installed: Boolean(exe || protocolRegistered),
      executableFound: Boolean(exe),
      protocolRegistered,
      platform: process.platform
    };
  } catch (error) {
    return {
      ok: false,
      installed: false,
      executableFound: false,
      protocolRegistered: false,
      error: error?.message || 'Could not check Signal Desktop.'
    };
  }
});

ipcMain.handle('lingua:launch-signal', async () => {
  // Signal has no official browser chat. The official signal.org site is
  // displayed inside Lingua; this action only launches Signal Desktop when
  // it is actually installed. It never falls back to the system browser.
  try {
    const exe = findSignalExecutable();
    if (exe) {
      const errorText = await shell.openPath(exe);
      if (!errorText) return { ok:true, launched:true, method:'executable' };
    }

    if (signalProtocolRegistered()) {
      await shell.openExternal('sgnl://');
      return { ok:true, launched:true, method:'registered-protocol' };
    }

    return { ok:true, launched:false, installed:false };
  } catch (error) {
    return {
      ok:false,
      launched:false,
      installed:false,
      error:error?.message || 'Could not open Signal Desktop.'
    };
  }
});

ipcMain.handle('lingua:warm-service', async (_event, payload = {}) => {
  const rawUrl = String(payload.url || '');
  const partition = String(payload.partition || '');
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return { ok:false, error:'HTTPS is required.' };
    if (!partition.startsWith('persist:lingua-')) return { ok:false, error:'Invalid service partition.' };
    const ses = session.fromPartition(partition, { cache:true });
    if (typeof ses.preconnect === 'function') {
      await ses.preconnect({ url: parsed.origin, numSockets: 1 });
    }
    return { ok:true };
  } catch (error) {
    return { ok:false, error:error?.message || 'Warmup failed.' };
  }
});

function rememberTranslation(key, value) {
  translationCache.delete(key);
  translationCache.set(key, value);
  while (translationCache.size > maxTranslationCache) {
    translationCache.delete(translationCache.keys().next().value);
  }
}

function mockTranslate(text, sourceLang, targetLang) {
  const clean = String(text || '').trim();
  const normalized = clean.toLowerCase().replace(/[.!?]+$/g, '').trim();
  const target = String(targetLang || 'en').toLowerCase();
  const examples = {
    en: {
      'hola': 'Hello',
      'gracias': 'Thank you',
      '¿hablas inglés': 'Do you speak English?',
      'como 30 anos trabajo en construction': 'I have worked in construction for about 30 years.',
      'muy poco ya se me olvido pues nunca lo practique solo con gente habla castellano': 'Very little. I have mostly forgotten it because I never practiced it except with Spanish speakers.'
    },
    es: {
      'hello': 'Hola',
      'thank you': 'Gracias',
      'do you speak english': '¿Hablas inglés?',
      'how are you': '¿Cómo estás?'
    }
  };
  const exact = examples[target]?.[normalized];
  return {
    translatedText: exact || `[TEST ${target.toUpperCase()}] ${clean}`,
    provider: 'mock-test',
    detectedSource: sourceLang === 'auto' ? '' : sourceLang,
    testOnly: true
  };
}

ipcMain.handle('lingua:translate', async (_event, { text, sourceLang = 'auto', targetLang, testMode = false }) => {
  const clean = String(text || '').trim();
  if (!clean) return { ok: false, error: 'Nothing to translate.' };
  if (!targetLang) return { ok: false, error: 'Choose a target language.' };
  if (testMode) return { ok: true, ...mockTranslate(clean, sourceLang, targetLang) };
  if (!authCookie) return { ok: false, status: 401, error: 'Log in to your Lingua account first.' };

  const key = `${sourceLang || 'auto'}\u0000${targetLang}\u0000${clean}`;
  if (translationCache.has(key)) return { ok: true, ...translationCache.get(key), cached: true };

  try {
    const response = await apiFetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: clean, sourceLang: sourceLang || 'auto', targetLang })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        authCookie = '';
        signedInEmail = '';
        saveAuthState();
      }
      return { ok: false, status: response.status, error: data.error || data.message || `Translation failed (HTTP ${response.status}).` };
    }
    const translated = data.translated || data.translation || data.translatedText || data.text || data.result || data.output;
    if (!translated || typeof translated !== 'string') return { ok: false, error: 'Translation response did not contain translated text.' };
    const result = { translatedText: translated, provider: data.provider || 'auto', detectedSource: data.detectedSource || '' };
    rememberTranslation(key, result);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
});


ipcMain.handle('lingua:voice-usage', async () => {
  if (!authCookie) return { ok:false, status:401, error:'Log in to your Lingua account first.' };
  try {
    const response = await apiFetch('/api/voice/usage', { method:'GET' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok:false,
        status:response.status,
        error:data.error || (response.status === 404
          ? 'Voice quota is not deployed on the Lingua server yet.'
          : `Could not load voice allowance (HTTP ${response.status}).`)
      };
    }
    return { ok:true, ...data };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

ipcMain.handle('lingua:voice-translate', async (_event, { text, sourceLang='auto', targetLang }) => {
  const clean = String(text || '').trim();
  if (!clean) return { ok:false, error:'Nothing to translate.' };
  if (!targetLang) return { ok:false, error:'Choose a target language.' };
  if (!authCookie) return { ok:false, status:401, error:'Log in to your Lingua account first.' };

  try {
    const response = await apiFetch('/api/voice/translate', {
      method:'POST',
      body:JSON.stringify({ text:clean, sourceLang:sourceLang || 'auto', targetLang })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        authCookie = '';
        signedInEmail = '';
        saveAuthState();
      }
      return {
        ok:false,
        status:response.status,
        upgrade:Boolean(data.upgrade),
        error:data.error || data.message || (response.status === 404
          ? 'Voice Translator server support is not deployed yet.'
          : `Voice translation failed (HTTP ${response.status}).`)
      };
    }
    const translated = data.translated || data.translation || data.translatedText || data.text || data.result || data.output;
    if (!translated || typeof translated !== 'string') return { ok:false, error:'Voice translation response did not contain translated text.' };
    return {
      ok:true,
      translatedText:translated,
      provider:data.provider || 'auto',
      detectedSource:data.detectedSource || '',
      used:data.used,
      limit:data.limit,
      remaining:data.remaining,
      plan:data.plan
    };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

ipcMain.handle('lingua:provider-status', async () => {
  try {
    const response = await apiFetch('/api/translate/status', { method: 'GET' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, status: response.status, mockAvailable: true };
    return { ok: true, mockAvailable: true, ...data };
  } catch (_) {
    return { ok: false, mockAvailable: true };
  }
});

ipcMain.handle('lingua:preload-path', async () => {
  const p = path.join(__dirname, 'service-preload.cjs');
  return `file://${p.replace(/\\/g, '/')}`;
});

ipcMain.handle('lingua:clear-instance-session', async (_event, partition) => {
  if (!partition || !String(partition).startsWith('persist:lingua-')) return { ok: false, error: 'Invalid partition.' };
  const ses = session.fromPartition(partition);
  await ses.clearStorageData();
  await ses.clearCache();
  return { ok: true };
});


function safePartitions(raw) {
  const values = Array.isArray(raw) ? raw : [];
  return [...new Set(values.map(v => String(v || '')).filter(v => v.startsWith('persist:lingua-')))];
}

function normalizeProxyConfig(payload = {}) {
  const enabled = Boolean(payload.enabled);
  if (!enabled) return { enabled:false, electron:{ mode:'direct' } };
  const scheme = ['http','https','socks5'].includes(String(payload.scheme || '').toLowerCase())
    ? String(payload.scheme).toLowerCase() : 'http';
  const host = String(payload.host || '').trim();
  const port = Number(payload.port);
  if (!/^[a-z0-9.-]+$/i.test(host) || host.startsWith('.') || host.endsWith('.')) {
    throw new Error('Enter a valid proxy host or IP address.');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Enter a valid proxy port (1-65535).');
  return {
    enabled:true,
    scheme,
    host,
    port,
    electron:{ mode:'fixed_servers', proxyRules:`${scheme}://${host}:${port}` }
  };
}

async function selectedSessions(partitions = []) {
  const list = [session.defaultSession];
  for (const partition of safePartitions(partitions)) list.push(session.fromPartition(partition));
  return [...new Set(list)];
}

ipcMain.handle('lingua:set-performance-profile', async (_event, { profile } = {}) => {
  const value = ['low','normal','high'].includes(String(profile || '')) ? String(profile) : 'normal';
  maxTranslationCache = value === 'low' ? 150 : value === 'high' ? 1200 : 600;
  while (translationCache.size > maxTranslationCache) translationCache.delete(translationCache.keys().next().value);
  return { ok:true, profile:value, translationCacheEntries:maxTranslationCache };
});

ipcMain.handle('lingua:app-info', async () => ({
  ok:true,
  version:app.getVersion(),
  platform:process.platform,
  arch:process.arch,
  serverUrl:getServerUrl()
}));

ipcMain.handle('lingua:cache-stats', async (_event, { partitions } = {}) => {
  try {
    const sessions = await selectedSessions(partitions);
    let bytes = 0;
    for (const ses of sessions) bytes += Number(await ses.getCacheSize().catch(() => 0)) || 0;
    return { ok:true, bytes };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

ipcMain.handle('lingua:clear-app-cache', async (_event, { partitions } = {}) => {
  try {
    const sessions = await selectedSessions(partitions);
    for (const ses of sessions) await ses.clearCache();
    return { ok:true };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

ipcMain.handle('lingua:clear-instance-cache', async (_event, { partition } = {}) => {
  if (!partition || !String(partition).startsWith('persist:lingua-')) return { ok:false, error:'Invalid service partition.' };
  try {
    await session.fromPartition(partition).clearCache();
    return { ok:true };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

ipcMain.handle('lingua:apply-proxy', async (_event, { proxy, partitions } = {}) => {
  try {
    const normalized = normalizeProxyConfig(proxy || {});
    const sessions = await selectedSessions(partitions);
    for (const ses of sessions) {
      await ses.setProxy(normalized.electron);
      try { ses.closeAllConnections(); } catch (_) {}
    }
    return { ok:true, enabled:normalized.enabled, proxy:normalized.enabled ? `${normalized.scheme}://${normalized.host}:${normalized.port}` : 'DIRECT' };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

ipcMain.handle('lingua:test-proxy', async (_event, { partition } = {}) => {
  try {
    const ses = partition && String(partition).startsWith('persist:lingua-') ? session.fromPartition(partition) : session.defaultSession;
    const resolved = await ses.resolveProxy('https://example.com');
    return { ok:true, resolved:String(resolved || 'DIRECT') };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

function numericVersion(value) {
  return String(value || '').replace(/^v/i,'').split('.').map(x => Number.parseInt(x,10) || 0).slice(0,4);
}
function compareVersions(a,b) {
  const aa=numericVersion(a), bb=numericVersion(b);
  for (let i=0;i<Math.max(aa.length,bb.length);i++) {
    const d=(aa[i]||0)-(bb[i]||0); if (d) return d;
  }
  return 0;
}

ipcMain.handle('lingua:check-update', async (_event, { channel='stable' } = {}) => {
  const current = app.getVersion();
  const safeChannel = channel === 'beta' ? 'beta' : 'stable';
  const downloadsUrl = `${getServerUrl()}/downloads`;
  try {
    const response = await apiFetch(`/api/desktop/update?platform=${encodeURIComponent(process.platform)}&arch=${encodeURIComponent(process.arch)}&current=${encodeURIComponent(current)}&channel=${safeChannel}`, { method:'GET' });
    if (response.status === 404) return { ok:true, configured:false, current, updateAvailable:false, downloadsUrl };
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok:false, status:response.status, current, error:data.error || `Update check failed (HTTP ${response.status}).`, downloadsUrl };
    const latest = String(data.version || data.latestVersion || current);
    const downloadUrl = /^https:\/\//i.test(String(data.downloadUrl || '')) ? String(data.downloadUrl) : downloadsUrl;
    const configured = data.configured !== false;
    return {
      ok:true,
      configured,
      current,
      latest,
      updateAvailable:configured && compareVersions(latest,current) > 0,
      mandatory:Boolean(data.mandatory),
      notes:String(data.releaseNotes || data.notes || ''),
      sha256:String(data.sha256 || ''),
      downloadUrl,
      downloadsUrl
    };
  } catch (error) {
    return { ok:false, current, error:error.message || String(error), downloadsUrl };
  }
});

ipcMain.handle('lingua:open-downloads', async () => {
  await shell.openExternal(`${getServerUrl()}/downloads`);
  return { ok:true };
});


function safeUpdateFileName(urlValue, versionValue) {
  let name = '';
  try { name = path.basename(new URL(String(urlValue || '')).pathname || ''); } catch (_) {}
  name = String(name || '').replace(/[^A-Za-z0-9._-]/g, '-');
  if (!/\.exe$/i.test(name)) {
    const version = String(versionValue || app.getVersion()).replace(/[^0-9A-Za-z._-]/g, '-');
    name = `Lingua-Bridge-Update-${version}.exe`;
  }
  return name.slice(0, 160);
}

ipcMain.handle('lingua:download-update', async (_event, { url, sha256, version } = {}) => {
  const rawUrl = String(url || '').trim();
  const expected = String(sha256 || '').trim().toLowerCase();
  if (!/^https:\/\//i.test(rawUrl)) return { ok:false, error:'Update URL must use HTTPS.' };
  if (!/^[a-f0-9]{64}$/.test(expected)) return { ok:false, error:'A valid SHA-256 checksum is required before downloading an update.' };

  const updateDir = path.join(app.getPath('downloads'), 'Lingua Bridge Updates');
  fs.mkdirSync(updateDir, { recursive:true });
  const fileName = safeUpdateFileName(rawUrl, version);
  const finalPath = path.join(updateDir, fileName);
  const tempPath = `${finalPath}.download`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5 * 60_000);
  let output = null;
  try {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    const response = await fetch(rawUrl, {
      method:'GET',
      redirect:'follow',
      signal:controller.signal,
      headers:{ 'User-Agent':`Lingua-Bridge/${app.getVersion()}` }
    });
    if (!response.ok || !response.body) return { ok:false, status:response.status, error:`Update download failed (HTTP ${response.status}).` };

    const declaredSize = Number(response.headers.get('content-length') || 0);
    const maxBytes = 500 * 1024 * 1024;
    if (declaredSize > maxBytes) return { ok:false, error:'Update file is larger than the 500 MB safety limit.' };

    const hash = crypto.createHash('sha256');
    let total = 0;
    output = fs.createWriteStream(tempPath, { flags:'w' });
    for await (const chunk of response.body) {
      const buffer = Buffer.from(chunk);
      total += buffer.length;
      if (total > maxBytes) throw new Error('Update file exceeded the 500 MB safety limit.');
      hash.update(buffer);
      if (!output.write(buffer)) await once(output, 'drain');
    }
    output.end();
    await once(output, 'finish');
    output = null;

    const actual = hash.digest('hex').toLowerCase();
    if (actual !== expected) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
      return { ok:false, error:'Update checksum did not match the owner-published SHA-256. The file was deleted.', expected, actual };
    }
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    fs.renameSync(tempPath, finalPath);
    const resolved = path.resolve(finalPath);
    verifiedUpdateFiles.add(resolved);
    return { ok:true, path:resolved, fileName, bytes:total, sha256:actual };
  } catch (error) {
    try { if (output) output.destroy(); } catch (_) {}
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
    return { ok:false, error:error?.name === 'AbortError' ? 'Update download timed out.' : (error?.message || String(error)) };
  } finally {
    clearTimeout(timeout);
  }
});

ipcMain.handle('lingua:launch-verified-update', async (_event, { filePath } = {}) => {
  const resolved = path.resolve(String(filePath || ''));
  if (!verifiedUpdateFiles.has(resolved) || !/\.exe$/i.test(resolved) || !fs.existsSync(resolved)) {
    return { ok:false, error:'Only an update downloaded and SHA-256 verified by Lingua can be launched.' };
  }
  const error = await shell.openPath(resolved);
  if (error) return { ok:false, error };
  verifiedUpdateFiles.delete(resolved);
  setTimeout(() => app.quit(), 1000);
  return { ok:true };
});

ipcMain.handle('lingua:open-admin', async () => {
  if (!authCookie) return { ok:false, status:401, error:'Log in to your Lingua owner account first.' };
  await shell.openExternal(`${getServerUrl()}/admin`);
  return { ok:true };
});

ipcMain.handle('lingua:redeem-code', async (_event, { code }) => {
  const clean = String(code || '').trim();
  if (!clean) return { ok:false, error:'Enter a gift code.' };
  if (!authCookie) return { ok:false, status:401, error:'Log in to your Lingua account first.' };
  try {
    const response = await apiFetch('/api/access-code/redeem', {
      method:'POST',
      body:JSON.stringify({ code:clean })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        authCookie = '';
        signedInEmail = '';
        saveAuthState();
      }
      return { ok:false, status:response.status, error:data.error || `Could not redeem code (HTTP ${response.status}).` };
    }
    return { ok:true, ...data };
  } catch (error) {
    return { ok:false, error:error.message || String(error) };
  }
});

app.whenReady().then(() => {
  loadAuthState();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
