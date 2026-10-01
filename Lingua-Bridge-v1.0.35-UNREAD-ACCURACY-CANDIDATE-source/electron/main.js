const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');
const fs = require('fs');

function loadServerUrl() {
  const envUrl = (process.env.SERVER_URL || '').trim();
  if (/^https:\/\//i.test(envUrl) && !envUrl.includes('your-domain.com')) return envUrl;
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'runtime-config.json'), 'utf8'));
    if (/^https:\/\//i.test(config.serverUrl) && !config.serverUrl.includes('your-domain.com')) return config.serverUrl;
  } catch {}
  return '';
}

function safeExternal(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:') shell.openExternal(url);
  } catch {}
}

const SERVER_URL = loadServerUrl();
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 480,
    minHeight: 600,
    title: 'Lingua Translate',
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  if (!SERVER_URL) {
    mainWindow.loadFile(path.join(__dirname, 'missing-server.html'));
    return;
  }

  const allowedOrigin = new URL(SERVER_URL).origin;
  mainWindow.loadURL(SERVER_URL);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    safeExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      if (new URL(url).origin !== allowedOrigin) {
        event.preventDefault();
        safeExternal(url);
      }
    } catch {
      event.preventDefault();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

const template = [
  { label: 'Lingua', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] },
  { role: 'editMenu' },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    let sameOrigin = false;
    try { sameOrigin = Boolean(SERVER_URL) && new URL(webContents.getURL()).origin === new URL(SERVER_URL).origin; } catch {}
    callback(sameOrigin && permission === 'clipboard-read');
  });
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
