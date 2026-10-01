const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const checks = [
  ['renderer source', 'src/app.js'],
  ['renderer styles', 'src/styles.css'],
  ['electron main', 'electron/main.cjs'],
  ['host preload', 'electron/host-preload.cjs'],
  ['service preload', 'electron/service-preload.cjs'],
  ['package', 'package.json']
];
let failed = false;
for (const [label, rel] of checks) {
  const file = path.join(root, rel);
  const ok = fs.existsSync(file) && fs.statSync(file).size > 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${rel}`);
  if (!ok) failed = true;
}
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
for (const [label, condition] of [
  ['test-mode UI present', app.includes('TEST MODE') && app.includes('engineTest')],
  ['historical translation toggle present', app.includes('historicalMessages')],
  ['multi-service add flow present', app.includes('serviceQuantity') && app.includes('data-service')],
  ['drag-and-drop account ordering present', app.includes('bindInstanceDragDrop') && app.includes('reorderInstanceInState') && app.includes('pointerdown') && app.includes('setPointerCapture')],
  ['custom Lingua logo is wired', app.includes('brand-logo') && fs.existsSync(path.join(root, 'src', 'lingua-logo.png'))],
  ['Broad provider languages are Gemini/Microsoft/Google-gated', app.includes('setLanguageSafely') && app.includes('broadProviderConfigured') && app.includes('geminiConfigured') && app.includes('microsoftConfigured') && app.includes('googleConfigured')],
  ['Signal stays in-app and Desktop launch avoids browser fallback', app.includes("id:'signal'") && !app.includes("external:'signal'") && main.includes("lingua:launch-signal") && main.includes('signalProtocolRegistered()') && !main.includes("shell.openExternal('https://signal.org/')")],
  ['Chrome/Web in-app browser service present', app.includes("id:'chrome'") && app.includes("browser:true") && app.includes('Chrome / Web')],
  ['Chrome/Web navigation controls present', app.includes('browserBack') && app.includes('browserForward') && app.includes('browserAddress') && app.includes('browserGo')],
  ['Chrome/Web avoids translation preload', app.includes("if (!svc.browser && state.preloadPath) view.setAttribute('preload', state.preloadPath)") && app.includes('serviceFor(instance).browser')],
  ['Chrome/Web URL input is limited to http/https', app.includes("['https:', 'http:'].includes(parsed.protocol)") && app.includes('normalizeBrowserInput')],
  ['Slack candidate service present', app.includes("id:'slack'") && fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("id: 'slack'")],
  ['Google Messages candidate service present', app.includes("id:'googlemessages'") && fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("id: 'googlemessages'")],
  ['LinkedIn candidate service present', app.includes("id:'linkedin'") && fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("id: 'linkedin'")],
  ['owner/admin custom app manager present', app.includes('Owner / Admin Custom App Manager') && app.includes('createCustomService') && app.includes('editCustomService') && app.includes('deleteCustomService')],
  ['custom app manager is owner/admin gated', app.includes('isOwnerAdmin() ? [...builtins, ...state.customServices] : builtins') && app.includes("Owner/Admin permission is required to manage custom apps." )],
  ['custom app URLs are HTTPS-only', app.includes("parsed.protocol !== 'https:'") && app.includes('parsed.username || parsed.password')],
  ['custom app templates persist separately', app.includes("lingua.customServices") && app.includes('JSON.stringify(state.customServices)')],
  ['custom template deletion preserves existing instances', app.includes('Existing instances already added to Lingua will remain') && app.includes('state.customServices = state.customServices.filter')],
  ['mock provider is explicit', main.includes("provider: 'mock-test'")],
  ['real backend still required for live mode', main.includes("/api/translate") && main.includes('Log in to your Lingua account first.')],
  ['Gemini/Google/Microsoft/DeepL provider status shown', app.includes('Gemini API') && app.includes('Google Cloud Translation') && app.includes('Microsoft Translator') && app.includes('DeepL')],
  ['voice translator UI present', app.includes('Voice translator') && app.includes('voiceTranslate')],
  ['unfinished voice UI is owner-only', app.includes('Voice translator · owner beta') && app.includes("${owner ? `")],
  ['server-side voice endpoints wired', main.includes('/api/voice/usage') && main.includes('/api/voice/translate')],
  ['current version marker present', app.includes("lingua.desktopVersion', '1.0.35")],
  ['Current profiles are conversation-scoped', app.includes("perConversation") && app.includes("conversationScopeKey") && app.includes("lingua-conversation")],
  ['Global editor is decoupled from active-chat settings', app.includes("function editorSettings()") && app.includes("function currentSettings()") && app.includes("Switching the editor tab must never change/reload the chat")],
  ['Current profile snapshots Global to prevent later overwrite', app.includes("state.perConversation[key] = { ...currentSettings() }")],
  ['Current/Global tabs avoid full renderer rebuild', app.includes("setScopeMode('current')") && app.includes("setScopeMode('global')") && app.includes("refreshScopeEditor();")],
  ['legacy per-instance Current profile migration exists', app.includes("migrateLegacyCurrentToConversation") && app.includes("legacyCurrentMigrated")],
  ['Broad languages are exposed through provider-backed extras', app.includes('PROVIDER_EXTRA_LANGS') && app.includes('["ar"') && app.includes('["hi"') && app.includes('["my"') && app.includes('["th"') && app.includes('["vi"') && app.includes('langOptions(settings.sourceLang,true,PROVIDER_EXTRA_LANGS)') && app.includes('langOptions(settings.outgoingTarget,false,PROVIDER_EXTRA_LANGS)')],
  ['legacy unsupported language settings migrate safely', app.includes('ALL_LANGUAGE_CODES.has') && app.includes("incomingTarget = 'en'") && app.includes("sourceLang = 'auto'")],
  ['commercial default is Live mode', app.includes("translationMode: localStorage.getItem('lingua.translationMode') || 'live'")],
  ['successful live smoke test clears stale error banner', app.includes("state.noticeError = false;\n    render();")],
  ['pre-send native composer hotfix present', fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("function onNativeBeforeInput") && fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("setComposerText(composer, '');")],
  ['Chromium-level Enter interception wired', main.includes("before-input-event") && main.includes("lingua-native-enter")],
  ['send-button shield wired', fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("lingua-send-shield")],
  ['composer target-language hint wired', fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("lingua-composer-target-hint")],
  ['active conversation identity is reported to host', fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("lingua-conversation") && fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes("detectConversationInfo")],
  ['customer accounts are forced to Live mode', app.includes('function enforceCustomerMode()') && app.includes("!isOwnerAdmin() && state.translationMode !== 'live'")],
  ['provider diagnostics are owner-only', app.includes('Translation providers · owner only') && app.includes('Messenger diagnostics · owner only')],
  ['customer toolbar hides provider diagnostics', app.includes("if (!isOwnerAdmin()) return ''")],
  ['audio placeholders are not fake-translated', fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes('function isAudioLikeMessage') && fs.readFileSync(path.join(root, 'electron/service-preload.cjs'), 'utf8').includes('^audio from')],
  ['typed voice transcript has text-translation fallback', app.includes('result.transcriptFallback = true')],
  ['settings center is no-reload overlay', app.includes('function openSettingsCenter()') && app.includes('Settings & Updates')],
  ['cache controls are wired', main.includes("lingua:clear-app-cache") && main.includes("lingua:clear-instance-cache")],
  ['proxy controls are server-side Electron session settings', main.includes("lingua:apply-proxy") && main.includes('setProxy(normalized.electron)')],
  ['safe update check is wired', main.includes("lingua:check-update") && app.includes('function checkForUpdates')],
  ['gift-code redemption is wired', main.includes("/api/access-code/redeem") && app.includes('Redeem Gift Code')],
  ['owner admin link is owner-only in UI', app.includes("id=\"openAdmin\"") && main.includes("lingua:open-admin")],
  ['device fingerprint is derived in memory only', main.includes('machineGuidSeed') && main.includes("createHash('sha256')") && !main.includes('device-id.bin')],
  ['desktop sends device headers on server requests', main.includes('X-Lingua-Device-Fingerprint') && main.includes('X-Lingua-Client')],
  ['account UI shows connected device slots', app.includes('Connected devices') && app.includes('Remove this device')],
  ['gift-code device removal is not exposed client-side', app.includes('ownerRemovalRequired')],
  ['device removal IPC is wired', main.includes("lingua:remove-device") && fs.readFileSync(path.join(root, 'electron/host-preload.cjs'), 'utf8').includes('removeDevice')]
]) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failed = true;
}
if (failed) process.exit(1);
