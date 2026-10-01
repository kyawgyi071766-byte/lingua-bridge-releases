const SERVICES = [
  { id:'whatsapp', name:'WhatsApp', url:'https://web.whatsapp.com/', color:'#25D366', letter:'W', duplicate:true },
  { id:'telegram', name:'Telegram', url:'https://web.telegram.org/k/', color:'#229ED9', letter:'T', duplicate:true },
  { id:'messenger', name:'Messenger', url:'https://www.messenger.com/', color:'#0084FF', letter:'M', duplicate:true },
  { id:'instagram', name:'Instagram', url:'https://www.instagram.com/direct/inbox/', color:'#E1306C', letter:'I', duplicate:true },
  { id:'facebook', name:'Facebook', url:'https://www.facebook.com/messages/', color:'#1877F2', letter:'F', duplicate:true },
  { id:'discord', name:'Discord', url:'https://discord.com/app', color:'#5865F2', letter:'D', duplicate:true },
  { id:'x', name:'X / Twitter', url:'https://x.com/messages', color:'#111111', letter:'X', duplicate:true },
  { id:'googlechat', name:'Google Chat', url:'https://chat.google.com/', color:'#1A73E8', letter:'G', duplicate:true },
  { id:'tiktok', name:'TikTok', url:'https://www.tiktok.com/messages', color:'#111111', letter:'T', duplicate:true },
  { id:'vk', name:'VK', url:'https://vk.com/im', color:'#0077FF', letter:'V', duplicate:true },
  { id:'line', name:'LINE', url:'https://line.me/', color:'#06C755', letter:'L', duplicate:true, experimental:true },
  { id:'teams', name:'Microsoft Teams', url:'https://teams.microsoft.com/', color:'#6264A7', letter:'M', duplicate:true, experimental:true },
  { id:'snapchat', name:'Snapchat', url:'https://web.snapchat.com/', color:'#F7F400', letter:'S', duplicate:true, experimental:true },
  { id:'zalo', name:'Zalo', url:'https://chat.zalo.me/', color:'#0068FF', letter:'Z', duplicate:true, experimental:true },
  { id:'slack', name:'Slack', url:'https://slack.com/signin', color:'#611F69', letter:'S', duplicate:true, experimental:true },
  { id:'googlemessages', name:'Google Messages', url:'https://messages.google.com/web/', color:'#1A73E8', letter:'G', duplicate:true, experimental:true },
  { id:'linkedin', name:'LinkedIn', url:'https://www.linkedin.com/messaging/', color:'#0A66C2', letter:'L', duplicate:true, experimental:true },
  { id:'signal', name:'Signal', url:'https://signal.org/download/', color:'#3A76F0', letter:'S', duplicate:false, badge:'Desktop companion', nativeCompanion:true },
  { id:'chrome', name:'Chrome / Web', url:'https://www.google.com/', color:'#4285F4', letter:'C', duplicate:true, badge:'In-app browser', browser:true },
  { id:'custom', name:'Custom Web Chat', url:'https://', color:'#6B7280', letter:'+', duplicate:true, experimental:true }
];

const LANGS = [["auto", "Auto detect"], ["bg", "Bulgarian (Български)"], ["cs", "Czech (Čeština)"], ["da", "Danish (Dansk)"], ["de", "German (Deutsch)"], ["el", "Greek (Ελληνικά)"], ["en", "English"], ["es", "Spanish (Español)"], ["et", "Estonian (Eesti)"], ["fi", "Finnish (Suomi)"], ["fr", "French (Français)"], ["hu", "Hungarian (Magyar)"], ["id", "Indonesian (Bahasa)"], ["it", "Italian (Italiano)"], ["ja", "Japanese (日本語)"], ["ko", "Korean (한국어)"], ["lt", "Lithuanian (Lietuvių)"], ["lv", "Latvian (Latviešu)"], ["no", "Norwegian (Norsk)"], ["nl", "Dutch (Nederlands)"], ["pl", "Polish (Polski)"], ["pt", "Portuguese (Português)"], ["ro", "Romanian (Română)"], ["ru", "Russian (Русский)"], ["sk", "Slovak (Slovenčina)"], ["sl", "Slovenian (Slovenščina)"], ["sv", "Swedish (Svenska)"], ["tr", "Turkish (Türkçe)"], ["uk", "Ukrainian (Українська)"], ["zh", "Chinese (中文)"]];

// v1.0.19 broad-language provider set. These languages use server-side
// Gemini, Microsoft Translator, or Google Translate and are only selectable when the
// authenticated provider-status endpoint confirms at least one broad provider.
const PROVIDER_EXTRA_LANGS = [
  ["af", "Afrikaans · Gemini/Microsoft/Google"],
  ["sq", "Albanian (Shqip) · Gemini/Microsoft/Google"],
  ["am", "Amharic (አማርኛ) · Gemini/Microsoft/Google"],
  ["ar", "Arabic (العربية) · Gemini/Microsoft/Google"],
  ["hy", "Armenian (Հայերեն) · Gemini/Microsoft/Google"],
  ["az", "Azerbaijani (Azərbaycanca) · Gemini/Microsoft/Google"],
  ["bn", "Bangla (বাংলা) · Gemini/Microsoft/Google"],
  ["eu", "Basque (Euskara) · Gemini/Microsoft/Google"],
  ["fil", "Filipino · Gemini/Microsoft/Google"],
  ["gl", "Galician (Galego) · Gemini/Microsoft/Google"],
  ["ka", "Georgian (ქართული) · Gemini/Microsoft/Google"],
  ["gu", "Gujarati (ગુજરાતી) · Gemini/Microsoft/Google"],
  ["he", "Hebrew (עברית) · Gemini/Microsoft/Google"],
  ["hi", "Hindi (हिन्दी) · Gemini/Microsoft/Google"],
  ["is", "Icelandic (Íslenska) · Gemini/Microsoft/Google"],
  ["ga", "Irish (Gaeilge) · Gemini/Microsoft/Google"],
  ["kn", "Kannada (ಕನ್ನಡ) · Gemini/Microsoft/Google"],
  ["kk", "Kazakh (Қазақша) · Gemini/Microsoft/Google"],
  ["km", "Khmer (ខ្មែរ) · Gemini/Microsoft/Google"],
  ["lo", "Lao (ລາວ) · Gemini/Microsoft/Google"],
  ["ms", "Malay (Bahasa Melayu) · Gemini/Microsoft/Google"],
  ["ml", "Malayalam (മലയാളം) · Gemini/Microsoft/Google"],
  ["mt", "Maltese (Malti) · Gemini/Microsoft/Google"],
  ["mr", "Marathi (मराठी) · Gemini/Microsoft/Google"],
  ["my", "Myanmar / Burmese (မြန်မာ) · Gemini/Microsoft/Google"],
  ["ne", "Nepali (नेपाली) · Gemini/Microsoft/Google"],
  ["fa", "Persian (فارسی) · Gemini/Microsoft/Google"],
  ["pa", "Punjabi (ਪੰਜਾਬੀ) · Gemini/Microsoft/Google"],
  ["sr-Latn", "Serbian Latin (Srpski) · Gemini/Microsoft/Google"],
  ["sr-Cyrl", "Serbian Cyrillic (Српски) · Gemini/Microsoft/Google"],
  ["sw", "Swahili (Kiswahili) · Gemini/Microsoft/Google"],
  ["ta", "Tamil (தமிழ்) · Gemini/Microsoft/Google"],
  ["te", "Telugu (తెలుగు) · Gemini/Microsoft/Google"],
  ["th", "Thai (ไทย) · Gemini/Microsoft/Google"],
  ["ur", "Urdu (اردو) · Gemini/Microsoft/Google"],
  ["vi", "Vietnamese (Tiếng Việt) · Gemini/Microsoft/Google"],
  ["cy", "Welsh (Cymraeg) · Gemini/Microsoft/Google"],
  ["zu", "Zulu (isiZulu) · Gemini/Microsoft/Google"]
];

const DEEPL_LANGUAGE_CODES = new Set(LANGS.map(([id]) => id));
const PROVIDER_EXTRA_CODES = new Set(PROVIDER_EXTRA_LANGS.map(([id]) => id));
const ALL_LANGUAGE_CODES = new Set([...DEEPL_LANGUAGE_CODES, ...PROVIDER_EXTRA_CODES]);
const INCOMING_LANGUAGE_CODES = ALL_LANGUAGE_CODES;
const DISPLAY_LANGS = [...LANGS, ...PROVIDER_EXTRA_LANGS];

const COMMON_LANG_CODES = ['en', 'zh', 'es', 'de', 'fr', 'ja', 'ko', 'it'];

const state = {
  instances: JSON.parse(localStorage.getItem('lingua.instances') || '[]'),
  activeId: localStorage.getItem('lingua.activeId') || '',
  mode: localStorage.getItem('lingua.mode') || 'current',
  translationMode: localStorage.getItem('lingua.translationMode') || 'live',
  settingsCollapsed: localStorage.getItem('lingua.settingsCollapsed') === '1',
  instancesCollapsed: localStorage.getItem('lingua.instancesCollapsed') === '1',
  unreadByInstance: {},
  unreadRawByInstance: {},
  accountDetails: JSON.parse(localStorage.getItem('lingua.accountDetails') || '{}'),
  globalSettings: JSON.parse(localStorage.getItem('lingua.globalSettings') || 'null') || {
    sourceLang:'auto',
    incomingTarget:'en',
    outgoingTarget:'en',
    autoTranslateIncoming:true,
    autoTranslateHistorical:false,
    translateBeforeSending:true,
    confirmBeforeSend:false,
    interceptNativeComposer:true,
    showInlineTranslations:true,
    translateOwnMessages:false
  },
  perInstance: JSON.parse(localStorage.getItem('lingua.perInstance') || '{}'),
  perConversation: JSON.parse(localStorage.getItem('lingua.perConversation') || '{}'),
  activeConversations: JSON.parse(localStorage.getItem('lingua.activeConversations') || '{}'),
  legacyCurrentMigrated: JSON.parse(localStorage.getItem('lingua.legacyCurrentMigrated') || '{}'),
  preloadPath: '',
  signedInEmail: '',
  providerStatus: null,
  signalStatus: null,
  serverUrl: '',
  accountStatus: null,
  notice: '',
  noticeError: false,
  modal: false,
  showFallbackComposer: localStorage.getItem('lingua.showFallbackComposer') === '1',
  incomingQueue: [],
  incomingActive: 0,
  adapterDiagnostics: null,
  liveTestResult: '',
  voiceUsage: null,
  voiceTranscript: '',
  voiceResult: '',
  voiceStatus: '',
  voiceListening: false,
  appPrefs: JSON.parse(localStorage.getItem('lingua.appPrefs') || 'null') || {
    displayMode:'portrait',
    performanceProfile:'normal',
    autoCheckUpdates:true,
    updateChannel:'stable',
    proxy:{ enabled:false, scheme:'http', host:'', port:'' }
  },
  customServices: (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lingua.customServices') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (_) {
      return [];
    }
  })(),
  appInfo: null,
  updateStatus: null,
  cacheBytes: 0
};

let lastInstanceDragAt = 0;
const incomingQueuedKeys = new Set();
let incomingNextStartAt = 0;
let broadRealtimeGapMs = 900;
let broadPenaltyUntil = 0;
let providerPenaltyUntil = 0;
let providerRealtimeGapMs = 90;

const persistentViews = new Map();
let persistentWebviewHost = null;
let persistentWebviewObserver = null;
let persistentLayoutRaf = 0;

function ensurePersistentWebviewHost() {
  if (persistentWebviewHost?.isConnected) return persistentWebviewHost;
  persistentWebviewHost = document.createElement('div');
  persistentWebviewHost.id = 'linguaPersistentWebviews';
  persistentWebviewHost.setAttribute('aria-label', 'Persistent messenger workspace');
  Object.assign(persistentWebviewHost.style, {
    position: 'fixed',
    display: 'none',
    overflow: 'hidden',
    background: '#0a0c10',
    zIndex: '2',
    pointerEvents: 'none'
  });
  const loading = document.createElement('div');
  loading.id = 'linguaPersistentLoading';
  loading.textContent = 'Loading messaging service…';
  Object.assign(loading.style, {
    position: 'absolute',
    inset: '0',
    display: 'grid',
    placeItems: 'center',
    color: '#8190a6',
    background: '#0a0c10',
    font: '600 12px system-ui, sans-serif',
    zIndex: '0',
    pointerEvents: 'none'
  });
  persistentWebviewHost.appendChild(loading);
  document.body.appendChild(persistentWebviewHost);
  window.addEventListener('resize', schedulePersistentWebviewLayout);
  return persistentWebviewHost;
}

function schedulePersistentWebviewLayout() {
  cancelAnimationFrame(persistentLayoutRaf);
  persistentLayoutRaf = requestAnimationFrame(layoutPersistentWebviews);
}

function layoutPersistentWebviews() {
  const host = ensurePersistentWebviewHost();
  const anchor = document.querySelector('#webviewWrap');
  const active = activeInstance();
  if (!active || serviceFor(active).nativeCompanion) {
    host.style.display = 'none';
    return;
  }

  // During a renderer-only UI refresh the #webviewWrap anchor can disappear
  // for a single frame. Keep the last valid geometry instead of hiding the
  // persistent messenger surface; hiding it was the source of white/blank
  // flashes even though the underlying Telegram/WhatsApp webview never reloaded.
  if (!anchor) {
    if (activePersistentView()) {
      host.style.display = 'block';
      requestAnimationFrame(schedulePersistentWebviewLayout);
    }
    return;
  }

  const rect = anchor.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    if (activePersistentView()) {
      host.style.display = 'block';
      requestAnimationFrame(schedulePersistentWebviewLayout);
    }
    return;
  }
  Object.assign(host.style, {
    display: 'block',
    left: `${Math.round(rect.left)}px`,
    top: `${Math.round(rect.top)}px`,
    width: `${Math.round(rect.width)}px`,
    height: `${Math.round(rect.height)}px`
  });
}

function settingsForInstance(instance) {
  if (!instance) return { ...state.globalSettings };
  const info = state.activeConversations?.[instance.id];
  const key = info?.key ? `${instance.id}::${info.key}` : '';
  const profile = key ? state.perConversation?.[key] : null;
  return profile ? { ...state.globalSettings, ...profile } : { ...state.globalSettings };
}

function activePersistentView() {
  const active = activeInstance();
  return active ? persistentViews.get(active.id) || null : null;
}

function canEscapeBackActiveView() {
  const view = activePersistentView();
  if (!view) return false;
  try {
    if (!view.canGoBack()) return false;
    const current = String(view.getURL?.() || '');
    if (!current) return false;
    const trustedMessengerHosts = [
      'web.whatsapp.com', 'web.telegram.org', 'messenger.com', 'www.messenger.com',
      'facebook.com', 'www.facebook.com', 'instagram.com', 'www.instagram.com',
      'discord.com', 'x.com', 'twitter.com', 'chat.google.com', 'vk.com',
      'www.tiktok.com', 'slack.com', 'messages.google.com', 'linkedin.com',
      'www.linkedin.com'
    ];
    const url = new URL(current);
    return !trustedMessengerHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch (_) {
    return false;
  }
}

function escapeBackActiveView() {
  const view = activePersistentView();
  if (!view || !canEscapeBackActiveView()) return false;
  try {
    view.goBack();
    setNotice('Back to the previous messenger page.');
    return true;
  } catch (_) {
    return false;
  }
}

async function refreshSignalDesktopStatus({ rerender=false } = {}) {
  try {
    state.signalStatus = await window.linguaDesktop?.signalStatus?.() || { ok:false, installed:false };
  } catch (_) {
    state.signalStatus = { ok:false, installed:false };
  }
  if (rerender) render();
  return state.signalStatus;
}

function sendSettingsToPersistentView(view, instance, isActive) {
  if (!view || !instance || serviceFor(instance).browser) return;
  const settings = settingsForInstance(instance);
  const payload = {
    ...settings,
    isActive: Boolean(isActive),
    incomingTargetLabel: languageName(settings.incomingTarget),
    sourceLangLabel: settings.sourceLang === 'auto' ? 'Auto detect' : languageName(settings.sourceLang),
    outgoingTargetLabel: languageName(settings.outgoingTarget)
  };
  const signature = JSON.stringify(payload);
  if (view.dataset.linguaSettingsSignature === signature) return;
  view.dataset.linguaSettingsSignature = signature;
  try {
    view.send('lingua-settings', payload);
  } catch (_) {}
}

function rememberBrowserUrlFor(instance, url) {
  if (!instance || serviceFor(instance).id !== 'chrome') return;
  const safe = normalizeBrowserInput(url);
  if (!safe) return;
  instance.url = safe;
  persist();
  if (instance.id === state.activeId) setBrowserAddress(safe);
}


function formatUnreadCount(count) {
  const value = Math.max(0, Number(count || 0));
  if (value > 999) return '999+';
  if (value > 99) return '99+';
  return String(value);
}

function updateUnreadBadgeDom(instanceId) {
  const badge = document.querySelector(`[data-unread-for="${CSS.escape(String(instanceId || ''))}"]`);
  if (!badge) return;
  const count = Math.max(0, Number(state.unreadByInstance?.[instanceId] || 0));
  badge.textContent = count > 0 ? formatUnreadCount(count) : '';
  badge.hidden = count <= 0;
  badge.setAttribute('aria-label', count > 0 ? `${count} unread message${count === 1 ? '' : 's'}` : 'No unread messages');
}

function handleUnreadState(instance, payload = {}) {
  if (!instance?.id) return;
  const id = instance.id;
  const raw = Math.max(0, Math.min(99999, Number(payload.count || 0)));
  const previousRaw = state.unreadRawByInstance[id];
  const delta = previousRaw === undefined ? 0 : Math.max(0, raw - previousRaw);

  // The account rail mirrors the messenger's actual unread state, even for
  // the currently selected account. Opening an account must not erase the
  // badge while another conversation inside that account is still unread.
  state.unreadRawByInstance[id] = raw;
  state.unreadByInstance[id] = raw;
  updateUnreadBadgeDom(id);

  if (delta > 0) {
    const details = state.accountDetails?.[id] || {};
    const label = details.name || instance.label || serviceFor(instance).name || 'Messaging account';
    window.linguaDesktop?.notifyUnread?.({ label, count:delta }).catch(() => {});
  }
}

function accountDetailFor(instance) {
  if (!instance?.id) return { name:'', phone:'' };
  const saved = state.accountDetails?.[instance.id] || {};
  return {
    name: String(saved.name || instance.label || serviceFor(instance).name || '').trim(),
    phone: String(saved.phone || '').trim()
  };
}

function editAccountDetails(instanceOverride = null) {
  const active = instanceOverride || activeInstance();
  if (!active) return;
  const current = accountDetailFor(active);
  const name = prompt('Account name shown on hover', current.name || active.label || '');
  if (name === null) return;
  const phone = prompt('Account phone number shown on hover (optional)', current.phone || '');
  if (phone === null) return;
  const cleanName = String(name || '').trim().slice(0, 80);
  const cleanPhone = String(phone || '').trim().slice(0, 40);
  state.accountDetails[active.id] = {
    name: cleanName || active.label || serviceFor(active).name || 'Account',
    phone: cleanPhone
  };
  persist();
  render();
  setNotice(`Saved name/phone for ${cleanName || active.label || 'account'} on this PC.`);
}

function hideAccountHoverTooltip() {
  const tooltip = document.querySelector('#accountHoverTooltip');
  if (!tooltip) return;
  tooltip.hidden = true;
}

function showAccountHoverTooltip(button) {
  const tooltip = document.querySelector('#accountHoverTooltip');
  if (!tooltip || !button) return;
  const id = String(button.dataset.instance || '');
  const instance = state.instances.find(item => item.id === id);
  if (!instance) return;
  const details = accountDetailFor(instance);
  const svc = serviceFor(instance);
  tooltip.innerHTML = `
    <div class="account-hover-service">${esc(svc.name || 'Messaging account')}</div>
    <div><span>Name</span><strong>${esc(details.name || instance.label || 'Not saved')}</strong></div>
    <div><span>Phone</span><strong>${esc(details.phone || 'Not saved')}</strong></div>
    <div class="account-hover-help">Right-click this account to save/edit name and phone.</div>
  `;
  const rect = button.getBoundingClientRect();
  const width = 240;
  const left = Math.min(window.innerWidth - width - 10, rect.right + 8);
  const top = Math.max(8, Math.min(window.innerHeight - 120, rect.top));
  tooltip.style.left = `${Math.max(8, left)}px`;
  tooltip.style.top = `${top}px`;
  tooltip.hidden = false;
}

function bindAccountHoverTooltips() {
  document.querySelectorAll('.instance-item[data-instance]').forEach(button => {
    button.addEventListener('pointerenter', () => showAccountHoverTooltip(button));
    button.addEventListener('pointerleave', hideAccountHoverTooltip);
    button.addEventListener('focus', () => showAccountHoverTooltip(button));
    button.addEventListener('blur', hideAccountHoverTooltip);
    const editThisAccount = event => {
      event.preventDefault();
      event.stopPropagation();
      const instance = state.instances.find(item => item.id === String(button.dataset.instance || ''));
      if (instance) editAccountDetails(instance);
    };
    button.addEventListener('contextmenu', editThisAccount);
    button.addEventListener('dblclick', editThisAccount);
  });
}

function bindPersistentWebview(view, instance) {
  if (!view || !instance || view.dataset.linguaBound === '1') return;
  view.dataset.linguaBound = '1';
  const svc = serviceFor(instance);
  const browserMode = Boolean(svc.browser);

  view.addEventListener('dom-ready', () => {
    view.dataset.ready = '1';
    if (instance.id === state.activeId) {
      view.style.opacity = '1';
      const loading = document.querySelector('#linguaPersistentLoading');
      if (loading) loading.style.display = 'none';
      if (!browserMode) sendSettingsToPersistentView(view, instance, true);
      setNotice('');
    } else if (!browserMode) {
      sendSettingsToPersistentView(view, instance, false);
    }
    if (browserMode) {
      try { rememberBrowserUrlFor(instance, view.getURL()); } catch (_) {}
    }
  });

  if (browserMode) {
    const syncBrowserLocation = event => {
      const url = String(event?.url || '');
      if (/^https?:\/\//i.test(url)) rememberBrowserUrlFor(instance, url);
    };
    view.addEventListener('did-navigate', syncBrowserLocation);
    view.addEventListener('did-navigate-in-page', syncBrowserLocation);
  }

  view.addEventListener('did-start-loading', () => {
    if (instance.id === state.activeId && view.dataset.ready !== '1') {
      const loading = document.querySelector('#linguaPersistentLoading');
      if (loading) loading.style.display = 'grid';
    }
  });

  view.addEventListener('did-fail-load', event => {
    if (event.errorCode === -3 || instance.id !== state.activeId) return;
    setNotice(`${browserMode ? 'Web page' : 'Messaging page'} failed to load: ${event.errorDescription || event.errorCode}`, true);
  });

  view.addEventListener('ipc-message', async (event) => {
    const isActive = instance.id === state.activeId;

    if (event.channel === 'lingua-unread-state') {
      handleUnreadState(instance, event.args[0] || {});
      return;
    }

    if (event.channel === 'lingua-translate-request') {
      if (!isActive) return;
      const payload = event.args[0] || {};
      if (payload.kind === 'incoming') {
        enqueueIncoming(view, payload);
        return;
      }
      try {
        const result = await translateText(payload.text, payload.targetLang, payload.sourceLang);
        view.send('lingua-translation-result', {
          id:payload.id,
          ok:true,
          translatedText:result.translatedText,
          provider:result.provider,
          detectedSource:result.detectedSource
        });
        setNotice('Translation ready; checking send…');
      } catch (error) {
        view.send('lingua-translation-result', {
          id:payload.id,
          ok:false,
          error:error.message || String(error)
        });
        setNotice('ဘာသာပြန်ခြင်းမအောင်မြင်ပါ');
      }
      return;
    }

    if (event.channel === 'lingua-composer-result') {
      if (!isActive) return;
      const result = event.args[0] || {};
      if (!result.ok) setNotice(result.error || 'Could not find the message box.', true);
      return;
    }

    if (event.channel === 'lingua-conversation') {
      const info = event.args[0] || {};
      const previousKey = state.activeConversations?.[instance.id]?.key || '';
      state.activeConversations[instance.id] = {
        key: String(info.key || ''),
        title: String(info.title || ''),
        service: String(info.service || instance.service || ''),
        route: String(info.route || '')
      };
      const migrated = migrateLegacyCurrentToConversation(instance.id, state.activeConversations[instance.id]);
      persist();
      if (isActive && (previousKey !== state.activeConversations[instance.id].key || migrated)) {
        sendSettingsToPersistentView(view, instance, true);
        refreshScopeEditor();
        if (migrated) setNotice(`Previous Current settings preserved for ${conversationLabel(state.activeConversations[instance.id])}.`);
      }
      return;
    }

    if (event.channel === 'lingua-adapter-status') {
      if (!isActive) return;
      state.adapterDiagnostics = event.args[0] || null;
      const countEl = document.querySelector('#adapterCount');
      const composerEl = document.querySelector('#adapterComposer');
      const serviceEl = document.querySelector('#adapterService');
      if (countEl && state.adapterDiagnostics) {
        countEl.textContent = String(state.adapterDiagnostics.messageCount || 0);
        countEl.className = `health ${Number(state.adapterDiagnostics.messageCount || 0) > 0 ? 'ok' : 'off'}`;
      }
      if (composerEl && state.adapterDiagnostics) {
        composerEl.textContent = state.adapterDiagnostics.composerFound ? 'Yes' : 'No';
        composerEl.className = `health ${state.adapterDiagnostics.composerFound ? 'ok' : 'off'}`;
      }
      if (serviceEl && state.adapterDiagnostics?.service) serviceEl.textContent = state.adapterDiagnostics.service;
      return;
    }

    if (event.channel === 'lingua-translation-error' && isActive) {
      const result = event.args[0] || {};
      setNotice(result.kind === 'send' ? 'စာပို့ခြင်း မအောင်မြင်ပါ' : 'ဘာသာပြန်ခြင်းမအောင်မြင်ပါ');
    }
  });
}

function createPersistentWebview(instance) {
  const host = ensurePersistentWebviewHost();
  const svc = serviceFor(instance);
  const view = document.createElement('webview');
  view.dataset.instanceId = instance.id;
  view.dataset.ready = '0';
  view.setAttribute('src', instance.url);
  view.setAttribute('partition', instance.partition);
  view.setAttribute('allowpopups', '');
  view.setAttribute('webpreferences', 'backgroundThrottling=no');
  if (!svc.browser && state.preloadPath) view.setAttribute('preload', state.preloadPath);
  Object.assign(view.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    visibility: 'hidden',
    opacity: '0',
    pointerEvents: 'none',
    background: '#0a0c10',
    zIndex: '1',
    transition: 'none'
  });
  host.appendChild(view);
  persistentViews.set(instance.id, view);
  bindPersistentWebview(view, instance);
  return view;
}

function syncPersistentWebviews() {
  const host = ensurePersistentWebviewHost();
  const validIds = new Set(state.instances.map(item => item.id));

  for (const [id, view] of persistentViews) {
    if (!validIds.has(id)) {
      try { view.remove(); } catch (_) {}
      persistentViews.delete(id);
    }
  }

  for (const instance of state.instances) {
    if (serviceFor(instance).nativeCompanion) {
      const existing = persistentViews.get(instance.id);
      if (existing) {
        try { existing.remove(); } catch (_) {}
        persistentViews.delete(instance.id);
      }
      continue;
    }
    if (!persistentViews.has(instance.id)) createPersistentWebview(instance);
  }

  const loading = host.querySelector('#linguaPersistentLoading');
  for (const instance of state.instances) {
    const view = persistentViews.get(instance.id);
    if (!view) continue;
    const active = instance.id === state.activeId;
    view.style.visibility = active ? 'visible' : 'hidden';
    view.style.pointerEvents = active ? 'auto' : 'none';
    view.style.zIndex = active ? '2' : '1';
    view.style.opacity = active && view.dataset.ready === '1' ? '1' : '0';
    sendSettingsToPersistentView(view, instance, active);
  }

  const activeView = activePersistentView();
  if (loading) loading.style.display = activeView && activeView.dataset.ready === '1' ? 'none' : 'grid';

  if (persistentWebviewObserver) persistentWebviewObserver.disconnect();
  const anchor = document.querySelector('#webviewWrap');
  if (anchor && 'ResizeObserver' in window) {
    persistentWebviewObserver = new ResizeObserver(schedulePersistentWebviewLayout);
    persistentWebviewObserver.observe(anchor);
  }
  schedulePersistentWebviewLayout();
}


// v1.0.18 migration: preserve translated-only direct send and introduce
// conversation-scoped Current profiles. Global remains a default profile;
// an individual Current profile is stored by messenger account + conversation.
// Legacy v1.0.3 per-instance Current settings are migrated lazily to the first
// detected conversation in that instance so an existing Korean/Chinese/etc.
// chat keeps its previous target instead of suddenly inheriting Global.
if (localStorage.getItem('lingua.desktopVersion') !== '1.0.35') {
  if (!ALL_LANGUAGE_CODES.has(state.globalSettings.sourceLang)) state.globalSettings.sourceLang = 'auto';
  if (!INCOMING_LANGUAGE_CODES.has(state.globalSettings.incomingTarget) || state.globalSettings.incomingTarget === 'auto') state.globalSettings.incomingTarget = 'en';
  if (!ALL_LANGUAGE_CODES.has(state.globalSettings.outgoingTarget) || state.globalSettings.outgoingTarget === 'auto') state.globalSettings.outgoingTarget = 'en';

  for (const key of Object.keys(state.perConversation || {})) {
    state.perConversation[key] = { ...state.perConversation[key] };
    if (!ALL_LANGUAGE_CODES.has(state.perConversation[key].sourceLang)) state.perConversation[key].sourceLang = 'auto';
    if (!INCOMING_LANGUAGE_CODES.has(state.perConversation[key].incomingTarget) || state.perConversation[key].incomingTarget === 'auto') state.perConversation[key].incomingTarget = 'en';
    if (!ALL_LANGUAGE_CODES.has(state.perConversation[key].outgoingTarget) || state.perConversation[key].outgoingTarget === 'auto') state.perConversation[key].outgoingTarget = 'en';
  }

  for (const key of Object.keys(state.perInstance || {})) {
    const legacy = state.perInstance[key] || {};
    if (!ALL_LANGUAGE_CODES.has(legacy.sourceLang)) legacy.sourceLang = 'auto';
    if (!INCOMING_LANGUAGE_CODES.has(legacy.incomingTarget) || legacy.incomingTarget === 'auto') legacy.incomingTarget = 'en';
    if (!ALL_LANGUAGE_CODES.has(legacy.outgoingTarget) || legacy.outgoingTarget === 'auto') legacy.outgoingTarget = 'en';
    state.perInstance[key] = legacy;
  }

  for (const instance of state.instances) {
    if (instance?.service === 'signal') instance.url = 'https://signal.org/download/';
  }

  state.translationMode = 'live';
  persist();
  localStorage.setItem('lingua.desktopVersion', '1.0.35');
}

if (!state.instances.length) {
  const id = crypto.randomUUID();
  state.instances.push({ id, service:'whatsapp', label:'WhatsApp 1', url:'https://web.whatsapp.com/', partition:`persist:lingua-whatsapp-${id}` });
  state.activeId = id;
  persist();
}

function persist() {
  localStorage.setItem('lingua.instances', JSON.stringify(state.instances));
  localStorage.setItem('lingua.activeId', state.activeId);
  localStorage.setItem('lingua.mode', state.mode);
  localStorage.setItem('lingua.translationMode', state.translationMode);
  localStorage.setItem('lingua.settingsCollapsed', state.settingsCollapsed ? '1' : '0');
  localStorage.setItem('lingua.instancesCollapsed', state.instancesCollapsed ? '1' : '0');
  localStorage.setItem('lingua.globalSettings', JSON.stringify(state.globalSettings));
  localStorage.setItem('lingua.perInstance', JSON.stringify(state.perInstance));
  localStorage.setItem('lingua.perConversation', JSON.stringify(state.perConversation));
  localStorage.setItem('lingua.activeConversations', JSON.stringify(state.activeConversations));
  localStorage.setItem('lingua.legacyCurrentMigrated', JSON.stringify(state.legacyCurrentMigrated));
  localStorage.setItem('lingua.showFallbackComposer', state.showFallbackComposer ? '1' : '0');
  localStorage.setItem('lingua.appPrefs', JSON.stringify(state.appPrefs));
  localStorage.setItem('lingua.customServices', JSON.stringify(state.customServices));
  localStorage.setItem('lingua.accountDetails', JSON.stringify(state.accountDetails));
}


function reorderInstanceInState(draggedId, targetId, placeAfter=false) {
  if (!draggedId || !targetId || draggedId === targetId) return false;
  const fromIndex = state.instances.findIndex(item => item.id === draggedId);
  const targetIndexBeforeRemoval = state.instances.findIndex(item => item.id === targetId);
  if (fromIndex < 0 || targetIndexBeforeRemoval < 0) return false;

  // Work out the desired final index before mutating the array. This avoids
  // the classic downward-drag off-by-one where an item appears to snap back.
  let desiredIndex = targetIndexBeforeRemoval + (placeAfter ? 1 : 0);
  if (fromIndex < desiredIndex) desiredIndex -= 1;
  if (desiredIndex === fromIndex) return false;

  const [moved] = state.instances.splice(fromIndex, 1);
  desiredIndex = Math.max(0, Math.min(desiredIndex, state.instances.length));
  state.instances.splice(desiredIndex, 0, moved);
  persist();
  return true;
}

function clearInstanceDropIndicators() {
  document.querySelectorAll('.instance-item.drag-over-before,.instance-item.drag-over-after,.instance-item.dragging')
    .forEach(el => el.classList.remove('drag-over-before', 'drag-over-after', 'dragging'));
}

function syncInstanceListDomOrder() {
  const list = document.querySelector('.instance-list');
  if (!list) return;
  for (const instance of state.instances) {
    const el = list.querySelector(`[data-instance="${CSS.escape(instance.id)}"]`);
    if (el) list.appendChild(el);
  }
}

function bindInstanceDragDrop() {
  const list = document.querySelector('.instance-list');
  if (!list) return;

  // Pointer-based reorder is intentionally used instead of Chromium's native
  // HTML5 DataTransfer path. Electron can occasionally return an empty drag
  // payload, which made a dragged Telegram account visually move and then snap
  // back to its old position. Pointer capture keeps the same DOM node alive,
  // so messenger webviews are never recreated or reloaded.
  list.querySelectorAll('.instance-item').forEach(item => {
    let pointerId = null;
    let startY = 0;
    let dragging = false;
    let orderChanged = false;

    const finish = (event) => {
      if (pointerId === null || (event?.pointerId != null && event.pointerId !== pointerId)) return;
      try { item.releasePointerCapture(pointerId); } catch (_) {}
      if (dragging) {
        lastInstanceDragAt = Date.now();
        syncInstanceListDomOrder();
        if (orderChanged) setNotice('Account order saved. The new order will stay after restart.');
      }
      pointerId = null;
      dragging = false;
      orderChanged = false;
      clearInstanceDropIndicators();
    };

    item.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      pointerId = event.pointerId;
      startY = event.clientY;
      dragging = false;
      orderChanged = false;
      try { item.setPointerCapture(pointerId); } catch (_) {}
    });

    item.addEventListener('pointermove', event => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      if (!dragging && Math.abs(event.clientY - startY) < 6) return;

      dragging = true;
      event.preventDefault();
      item.classList.add('dragging');

      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const target = hit?.closest?.('.instance-item');
      if (!target || target === item || !list.contains(target)) return;

      const rect = target.getBoundingClientRect();
      const placeAfter = event.clientY > rect.top + rect.height / 2;
      clearInstanceDropIndicators();
      item.classList.add('dragging');
      target.classList.add(placeAfter ? 'drag-over-after' : 'drag-over-before');

      if (reorderInstanceInState(item.dataset.instance, target.dataset.instance, placeAfter)) {
        orderChanged = true;
        syncInstanceListDomOrder();
      }
    });

    item.addEventListener('pointerup', finish);
    item.addEventListener('pointercancel', finish);
    item.addEventListener('lostpointercapture', finish);
  });
}

function broadProviderConfigured() {
  return Boolean(state.providerStatus?.geminiConfigured || state.providerStatus?.microsoftConfigured || state.providerStatus?.googleConfigured);
}

async function setLanguageSafely(settingKey, value) {
  if (PROVIDER_EXTRA_CODES.has(value)) {
    if (!state.providerStatus?.ok) {
      state.providerStatus = await window.linguaDesktop.providerStatus().catch(() => ({ ok:false }));
    }
    if (!broadProviderConfigured()) {
      setNotice('This language needs Gemini, Microsoft Translator, or Google Translate on the Lingua server. The current server has no broad-language provider configured, so your language setting was not changed.', true);
      refreshScopeEditor();
      return;
    }
  }
  setSetting(settingKey, value);
}

function activeInstance() {
  return state.instances.find(x => x.id === state.activeId) || state.instances[0];
}

function activeConversation(instance = activeInstance()) {
  if (!instance) return null;
  const info = state.activeConversations?.[instance.id];
  return info?.key ? info : null;
}

function conversationScopeKey(instance = activeInstance(), conversation = activeConversation(instance)) {
  if (!instance?.id || !conversation?.key) return '';
  return `${instance.id}::${conversation.key}`;
}

function currentProfile() {
  const key = conversationScopeKey();
  return key ? (state.perConversation[key] || null) : null;
}

// IMPORTANT: this is always the settings actually used by the active chat.
// It intentionally does NOT depend on whether the right panel is showing
// Current or Global. Switching the editor tab must never change/reload the chat.
function currentSettings() {
  const profile = currentProfile();
  return profile ? { ...state.globalSettings, ...profile } : { ...state.globalSettings };
}

// Values shown in the right-side editor. Global edits the default profile;
// Current edits only the selected conversation's private profile.
function editorSettings() {
  return state.mode === 'global' ? state.globalSettings : currentSettings();
}

function ensureCurrentProfile() {
  const key = conversationScopeKey();
  if (!key) return null;
  if (!state.perConversation[key]) {
    // Snapshot the full effective configuration. From this point onward,
    // future Global changes cannot silently change this conversation.
    state.perConversation[key] = { ...currentSettings() };
  }
  return state.perConversation[key];
}

function setSetting(key, value) {
  if (state.mode === 'global') {
    state.globalSettings[key] = value;
  } else {
    const profile = ensureCurrentProfile();
    if (!profile) {
      setNotice('Open a conversation first. Current settings belong to one conversation only.', true);
      refreshScopeEditor();
      return;
    }
    profile[key] = value;
  }
  persist();
  sendSettings();
  refreshScopeEditor();
}

function normalizeCustomUrl(value) {
  const raw = String(value || '').trim();
  let parsed;
  try { parsed = new URL(raw); } catch (_) { return ''; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return '';
  return parsed.href;
}

function normalizeBrowserInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'https://www.google.com/';

  // A phrase is treated as a Google search. A hostname/path without a scheme
  // is upgraded to HTTPS. Only normal web protocols are accepted.
  if (/\s/.test(raw) || (!raw.includes('.') && !/^https?:\/\//i.test(raw))) {
    return `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
  }

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return '';
    return parsed.href;
  } catch (_) {
    return `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
  }
}

function setBrowserAddress(value) {
  const input = document.querySelector('#browserAddress');
  if (input && document.activeElement !== input) input.value = String(value || '');
}

function rememberBrowserUrl(url) {
  const active = activeInstance();
  if (!active || serviceFor(active).id !== 'chrome') return;
  const safe = normalizeBrowserInput(url);
  if (!safe) return;
  active.url = safe;
  persist();
  setBrowserAddress(safe);
}

function normalizeCustomService(item) {
  if (!item || typeof item !== 'object') return null;
  const url = normalizeCustomUrl(item.url);
  const name = String(item.name || '').trim().slice(0, 48);
  if (!url || !name) return null;
  const id = String(item.id || '').startsWith('owner-custom-') ? String(item.id) : `owner-custom-${crypto.randomUUID()}`;
  const color = /^#[0-9a-f]{6}$/i.test(String(item.color || '')) ? String(item.color) : '#7C3AED';
  const letter = String(item.letter || name[0] || '+').trim().slice(0, 1).toUpperCase() || '+';
  return { id, name, url, color, letter, duplicate:true, experimental:true, ownerCustom:true, badge:'Owner custom' };
}

state.customServices = state.customServices.map(normalizeCustomService).filter(Boolean);

function customServiceForId(id) {
  return state.customServices.find(s => s.id === id) || null;
}

function serviceFor(instance) {
  const builtin = SERVICES.find(s => s.id === instance?.service);
  if (builtin) return builtin;
  const custom = customServiceForId(instance?.service);
  if (custom) return custom;
  if (instance?.url) {
    const fallbackName = instance.customName || instance.label || 'Custom Web Chat';
    return {
      id: instance.service || 'custom-orphan',
      name: fallbackName,
      url: instance.url,
      color: /^#[0-9a-f]{6}$/i.test(String(instance.customColor || '')) ? instance.customColor : '#6B7280',
      letter: String(instance.customLetter || fallbackName[0] || '+').slice(0,1).toUpperCase(),
      duplicate:true,
      experimental:true,
      ownerCustom:true,
      badge:'Custom'
    };
  }
  return SERVICES[0];
}

function pickerServices() {
  const builtins = SERVICES.filter(s => s.id !== 'custom');
  return isOwnerAdmin() ? [...builtins, ...state.customServices] : builtins;
}

function languageName(code) {
  return DISPLAY_LANGS.find(([id]) => id === code)?.[1] || code || '';
}

function langOptions(value, allowAuto=false, extraLanguages=[]) {
  const list = [...LANGS, ...extraLanguages];
  const allowed = list.filter(([id]) => allowAuto || id !== 'auto');
  const byId = new Map(allowed.map(item => [item[0], item]));
  const common = COMMON_LANG_CODES.map(id => byId.get(id)).filter(Boolean);
  const commonIds = new Set(common.map(([id]) => id));
  const rest = allowed.filter(([id]) => id !== 'auto' && !commonIds.has(id));
  const option = ([id,name]) => {
    const needsBroad = PROVIDER_EXTRA_CODES.has(id);
    const unavailable = needsBroad && state.translationMode !== 'test' && !broadProviderConfigured();
    return `<option value="${esc(id)}" ${id===value?'selected':''} ${unavailable?'disabled':''}>${esc(name)}${unavailable?' · setup required':''}</option>`;
  };
  const auto = allowAuto && byId.has('auto') ? option(byId.get('auto')) : '';
  return `${auto}<optgroup label="Common languages">${common.map(option).join('')}</optgroup><optgroup label="All languages">${rest.map(option).join('')}</optgroup>`;
}

function esc(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function conversationLabel(info = activeConversation()) {
  if (!info) return 'No conversation selected';
  return info.title || 'Current conversation';
}

function scopeContextHtml() {
  const info = activeConversation();
  const profile = currentProfile();
  const effective = currentSettings();
  const globalTarget = languageName(state.globalSettings.outgoingTarget);
  const effectiveTarget = languageName(effective.outgoingTarget);

  if (state.mode === 'global') {
    const protectedText = profile && info
      ? `<div class="scope-protected">Active chat protected: <strong>${esc(conversationLabel(info))}</strong> keeps <strong>${esc(effectiveTarget)}</strong>.</div>`
      : `<div class="scope-following">Active chat has no private Current profile and follows Global.</div>`;
    return `<div class="scope-card global">
      <div class="scope-title-row"><strong>Global default</strong><span class="scope-badge global">DEFAULT</span></div>
      <div class="scope-copy">Used only by conversations that do not have their own Current profile. Editing Global will not overwrite a saved Current conversation.</div>
      <div class="scope-target">Default customer language: <strong>${esc(globalTarget)}</strong></div>
      ${protectedText}
    </div>`;
  }

  if (!info) {
    return `<div class="scope-card warning">
      <div class="scope-title-row"><strong>Current conversation</strong><span class="scope-badge">SINGLE TARGET</span></div>
      <div class="scope-copy">Open a customer conversation first. Current settings are saved to one conversation only, not the whole Telegram/WhatsApp account.</div>
    </div>`;
  }

  if (profile) {
    return `<div class="scope-card current">
      <div class="scope-title-row"><strong>${esc(conversationLabel(info))}</strong><span class="scope-badge current">PRIVATE</span></div>
      <div class="scope-copy">This conversation has its own language profile. Global changes will not overwrite it.</div>
      <div class="scope-target">This customer receives: <strong>${esc(effectiveTarget)}</strong></div>
      <button class="scope-reset-btn" id="resetCurrentProfile" type="button">Use Global defaults for this conversation</button>
    </div>`;
  }

  return `<div class="scope-card current">
    <div class="scope-title-row"><strong>${esc(conversationLabel(info))}</strong><span class="scope-badge">FOLLOWING GLOBAL</span></div>
    <div class="scope-copy">This conversation currently follows Global. Change any Current setting once to create a private single-target profile for this customer only.</div>
    <div class="scope-target">Currently receives: <strong>${esc(effectiveTarget)}</strong></div>
  </div>`;
}

function refreshScopeEditor() {
  const settings = editorSettings();
  const currentBtn = document.querySelector('#modeCurrent');
  const globalBtn = document.querySelector('#modeGlobal');
  currentBtn?.classList.toggle('active', state.mode === 'current');
  globalBtn?.classList.toggle('active', state.mode === 'global');

  const context = document.querySelector('#scopeContext');
  if (context) context.innerHTML = scopeContextHtml();

  const flowSource = document.querySelector('#flowSource');
  const flowTarget = document.querySelector('#flowTarget');
  if (flowSource) flowSource.textContent = languageName(settings.sourceLang);
  if (flowTarget) flowTarget.textContent = languageName(settings.outgoingTarget);

  const ids = [
    ['sourceLang', settings.sourceLang],
    ['incomingTarget', settings.incomingTarget],
    ['outgoingTarget', settings.outgoingTarget]
  ];
  const noConversation = state.mode === 'current' && !conversationScopeKey();
  for (const [id, value] of ids) {
    const el = document.querySelector(`#${id}`);
    if (!el) continue;
    if (el.value !== value) el.value = value;
    el.disabled = noConversation;
  }

  const toggles = [
    ['nativeComposer', settings.interceptNativeComposer],
    ['translateBefore', settings.translateBeforeSending],
    ['confirmSend', settings.confirmBeforeSend],
    ['autoIncoming', settings.autoTranslateIncoming],
    ['historicalMessages', settings.autoTranslateHistorical],
    ['inlineTranslations', settings.showInlineTranslations],
    ['translateOwnMessages', settings.translateOwnMessages]
  ];
  for (const [id, checked] of toggles) {
    const el = document.querySelector(`#${id}`);
    if (!el) continue;
    el.checked = Boolean(checked);
    el.disabled = noConversation;
  }

  document.querySelector('#resetCurrentProfile')?.addEventListener('click', resetCurrentProfile);
}

function setScopeMode(mode) {
  if (mode !== 'current' && mode !== 'global') return;
  state.mode = mode;
  persist();
  // Partial UI refresh only. Do not rebuild the <webview>; that caused the
  // white/black flash and reloaded the customer's conversation in v1.0.3.
  refreshScopeEditor();
}

function applySettingsCollapsedUi() {
  const shell = document.querySelector('.app-shell');
  const panel = document.querySelector('.settings');
  const button = document.querySelector('#toggleSettings');
  shell?.classList.toggle('settings-collapsed', state.settingsCollapsed);
  panel?.classList.toggle('collapsed', state.settingsCollapsed);
  if (button) {
    button.textContent = state.settingsCollapsed ? '‹' : '›';
    button.title = state.settingsCollapsed ? 'Expand translation settings' : 'Collapse translation settings';
  }
}

function resetCurrentProfile() {
  const key = conversationScopeKey();
  if (!key) return;
  delete state.perConversation[key];
  persist();
  sendSettings();
  refreshScopeEditor();
  setNotice(`${conversationLabel()} now follows Global defaults.`);
}

function migrateLegacyCurrentToConversation(instanceId, info) {
  if (!instanceId || !info?.key || state.legacyCurrentMigrated?.[instanceId]) return false;
  const legacy = state.perInstance?.[instanceId];
  if (!legacy || !Object.keys(legacy).length) {
    state.legacyCurrentMigrated[instanceId] = 'none';
    persist();
    return false;
  }
  const key = `${instanceId}::${info.key}`;
  if (!state.perConversation[key]) {
    state.perConversation[key] = { ...state.globalSettings, ...legacy };
  }
  state.legacyCurrentMigrated[instanceId] = key;
  persist();
  return true;
}

function isOwnerAdmin() {
  return Boolean(state.accountStatus?.ok && state.accountStatus.role === 'admin');
}

function enforceCustomerMode() {
  if (state.accountStatus?.ok && !isOwnerAdmin() && state.translationMode !== 'live') {
    state.translationMode = 'live';
    persist();
  }
}

function providerBadge() {
  if (!isOwnerAdmin()) return '';
  if (state.translationMode === 'test') {
    return `<span class="provider-badge test">TEST MODE · Mock provider</span>`;
  }
  if (!state.providerStatus?.ok) return `<span class="provider-badge muted">Live mode · provider status unknown</span>`;
  const deepl = state.providerStatus.deeplConfigured ? 'DeepL ✓' : 'DeepL –';
  const gemini = state.providerStatus.geminiConfigured ? 'Gemini ✓' : 'Gemini –';
  const microsoft = state.providerStatus.microsoftConfigured ? 'Microsoft ✓' : 'Microsoft –';
  const google = state.providerStatus.googleConfigured ? 'Google ✓' : 'Google –';
  return `<span class="provider-badge">${deepl} · ${gemini} · ${microsoft} · ${google}</span>`;
}


function voiceUsageSummary() {
  if (state.translationMode === 'test') return 'Test mode · quota is not consumed';
  if (!state.signedInEmail) return 'Sign in to use live voice translation';
  const usage = state.voiceUsage;
  if (!usage?.ok) return 'Voice quota will appear after the Lingua server is updated';
  return `${usage.remaining} of ${usage.limit} voice translations left · ${String(usage.plan || 'free').toUpperCase()}`;
}

function accountPlanSummary() {
  const a = state.accountStatus;
  if (!state.signedInEmail) return '';
  if (!a?.ok) return 'Plan status unavailable';
  const plan = String(a.plan || 'free').toUpperCase();
  const until = a.paidUntil ? String(a.paidUntil).slice(0, 10) : '';
  return until ? `${plan} · active until ${until}` : plan;
}

function accountDevicesHtml() {
  const d = state.accountStatus?.devices;
  if (!state.accountStatus?.ok || !d) return '';
  const headline = d.limited ? `${Number(d.count || 0)} / ${Number(d.limit || 0)} devices connected` : 'No device limit on this plan';
  const items = Array.isArray(d.items) ? d.items : [];
  const cards = items.length ? items.map(device => `
    <div class="device-row ${device.current ? 'current' : ''}">
      <div class="device-copy">
        <strong>${esc(device.name || 'Lingua device')}${device.current ? ' <span class="device-current">THIS DEVICE</span>' : ''}</strong>
        <span>${esc(device.type || 'desktop')} · ${esc(device.platform || 'unknown')}${device.appVersion ? ` · v${esc(device.appVersion)}` : ''}</span>
        <span>Last used ${esc(new Date(device.lastSeenAt).toLocaleString())}</span>
      </div>
      ${d.canSelfRemove ? `<button class="small-btn danger-lite device-remove" data-remove-device="${esc(device.id)}" data-current-device="${device.current ? '1' : '0'}">${device.current ? 'Remove this device' : 'Remove device'}</button>` : ''}
    </div>`).join('') : '<div class="subtle">No Lingua Bridge desktop device attached yet.</div>';
  const ownerOnly = d.ownerRemovalRequired
    ? '<div class="device-owner-note">Gift-code access allows one device. Device changes must be released by the Lingua owner.</div>'
    : '';
  return `<div class="device-box"><div class="device-head"><strong>Connected devices</strong><span>${esc(headline)}</span></div>${ownerOnly}${cards}</div>`;
}

async function removeAccountDevice(deviceId, currentDevice) {
  const label = currentDevice ? 'this device' : 'this device from your account';
  if (!confirm(`Remove ${label}?

You can attach a replacement device on a later Lingua Bridge login.`)) return;
  setNotice('Removing device…');
  const result = await window.linguaDesktop.removeDevice(deviceId);
  if (!result?.ok) return setNotice(result?.error || 'Could not remove device.', true);
  if (currentDevice) {
    await window.linguaDesktop.logout().catch(() => {});
    state.signedInEmail = '';
    state.accountStatus = null;
    state.voiceUsage = null;
    state.notice = 'This device was removed and Lingua signed out. Log in again when you want to attach it again.';
    state.noticeError = false;
    render();
    return;
  }
  await refreshAccountStatus();
  state.notice = 'Device removed. A replacement device can now be attached.';
  state.noticeError = false;
  render();
}

async function refreshAccountStatus() {
  if (!state.signedInEmail) {
    state.accountStatus = null;
    return;
  }
  try {
    state.accountStatus = await window.linguaDesktop.accountStatus();
    if (state.accountStatus?.ok && state.accountStatus.email) {
      state.signedInEmail = state.accountStatus.email;
    }
    enforceCustomerMode();
  } catch (_) {
    state.accountStatus = { ok:false };
  }
}

function speechLocale(code) {
  const map = {
    en:'en-US', es:'es-ES', de:'de-DE', fr:'fr-FR', it:'it-IT', pt:'pt-BR',
    zh:'zh-CN', 'zh-TW':'zh-TW', ja:'ja-JP', ko:'ko-KR', th:'th-TH',
    vi:'vi-VN', id:'id-ID', ms:'ms-MY', hi:'hi-IN', ar:'ar-SA',
    ru:'ru-RU', uk:'uk-UA', tr:'tr-TR', nl:'nl-NL', pl:'pl-PL'
  };
  return map[code] || (code && code !== 'auto' ? code : navigator.language || 'en-US');
}

async function refreshVoiceUsage() {
  if (!state.signedInEmail || state.translationMode === 'test') {
    state.voiceUsage = null;
    return;
  }
  try {
    state.voiceUsage = await window.linguaDesktop.voiceUsage();
  } catch (_) {
    state.voiceUsage = { ok:false };
  }
}

let voiceRecognition = null;

function startVoiceRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    state.voiceStatus = 'Speech recognition is not available in this Electron build. You can still type/paste a transcript and translate it.';
    state.voiceListening = false;
    render();
    return;
  }
  if (voiceRecognition && state.voiceListening) {
    try { voiceRecognition.stop(); } catch (_) {}
    return;
  }

  const s = currentSettings();
  voiceRecognition = new Recognition();
  voiceRecognition.lang = speechLocale(s.sourceLang);
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = true;
  voiceRecognition.maxAlternatives = 1;

  voiceRecognition.onstart = () => {
    state.voiceListening = true;
    state.voiceStatus = 'Listening… Speak now.';
    render();
  };
  voiceRecognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      transcript += event.results[i][0]?.transcript || '';
    }
    if (transcript.trim()) state.voiceTranscript = transcript.trim();
    state.voiceStatus = 'Speech captured. Review the transcript, then translate.';
    const box = document.querySelector('#voiceTranscript');
    if (box) box.value = state.voiceTranscript;
    const status = document.querySelector('#voiceStatus');
    if (status) status.textContent = state.voiceStatus;
  };
  voiceRecognition.onerror = (event) => {
    state.voiceListening = false;
    state.voiceStatus = `Microphone recognition error: ${event.error || 'unknown error'}`;
    render();
  };
  voiceRecognition.onend = () => {
    state.voiceListening = false;
    if (state.voiceStatus === 'Listening… Speak now.') state.voiceStatus = 'Listening stopped.';
    render();
  };

  try {
    voiceRecognition.start();
  } catch (error) {
    state.voiceListening = false;
    state.voiceStatus = error.message || String(error);
    render();
  }
}

async function translateVoice() {
  const transcript = (document.querySelector('#voiceTranscript')?.value || state.voiceTranscript || '').trim();
  if (!transcript) {
    state.voiceStatus = 'Speak or enter a transcript first.';
    render();
    return;
  }
  state.voiceTranscript = transcript;
  const s = currentSettings();
  try {
    state.voiceStatus = 'Translating voice…';
    render();

    let result;
    if (state.translationMode === 'test') {
      result = await window.linguaDesktop.translate({
        text: transcript,
        sourceLang: s.sourceLang || 'auto',
        targetLang: s.outgoingTarget || 'en',
        testMode: true
      });
    } else {
      if (!state.signedInEmail) throw new Error('Log in to your Lingua account first.');
      result = await window.linguaDesktop.voiceTranslate({
        text: transcript,
        sourceLang: s.sourceLang || 'auto',
        targetLang: s.outgoingTarget || 'en'
      });
      // Until the dedicated speech backend is deployed, typed/pasted transcripts
      // still use the proven text translation path instead of looking broken.
      if (!result?.ok && (result?.status === 404 || /not found|voice.*server|endpoint/i.test(String(result?.error || '')))) {
        result = await window.linguaDesktop.translate({
          text: transcript,
          sourceLang: s.sourceLang || 'auto',
          targetLang: s.outgoingTarget || 'en',
          testMode: false
        });
        if (result?.ok) result.transcriptFallback = true;
      }
    }
    if (!result?.ok) {
      if (result?.upgrade) throw new Error(result.error || 'Voice allowance reached. Upgrade your plan to continue.');
      throw new Error(result?.error || 'Voice translation failed.');
    }

    state.voiceResult = result.translatedText || '';
    state.voiceStatus = state.translationMode === 'test'
      ? `TEST voice translation · ${result.provider || 'mock'}`
      : result.transcriptFallback
        ? `Transcript translated by ${result.provider || 'provider'}. Live microphone/audio transcription is still owner-beta until the speech backend is enabled.`
        : `Translated by ${result.provider || 'provider'}.`;
    if (state.translationMode === 'live') await refreshVoiceUsage();
    render();
  } catch (error) {
    state.voiceStatus = error.message || String(error);
    render();
  }
}

function speakVoiceResult() {
  const text = (state.voiceResult || '').trim();
  if (!text) {
    state.voiceStatus = 'Translate something first.';
    render();
    return;
  }
  if (!('speechSynthesis' in window)) {
    state.voiceStatus = 'Text-to-speech is not available on this device.';
    render();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLocale(currentSettings().outgoingTarget || 'en');
  window.speechSynthesis.speak(utterance);
  state.voiceStatus = 'Speaking translated result…';
  const status = document.querySelector('#voiceStatus');
  if (status) status.textContent = state.voiceStatus;
}

function insertVoiceResult() {
  const text = (state.voiceResult || '').trim();
  if (!text) {
    state.voiceStatus = 'Translate something first.';
    render();
    return;
  }
  const view = activePersistentView();
  if (!view) {
    state.voiceStatus = 'Open a messaging service first.';
    render();
    return;
  }
  view.send('lingua-insert-text', { text, sendNow:false });
  state.voiceStatus = 'Translated voice text inserted into the active messenger. Review it before sending.';
  render();
}


function instancePartitions() {
  return state.instances.map(item => item.partition).filter(Boolean);
}

function formatBytes(bytes=0) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  const units = ['KB','MB','GB','TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return `${v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${units[i]}`;
}

function applyDisplayMode() {
  const mode = state.appPrefs?.displayMode === 'landscape' ? 'landscape' : 'portrait';
  document.documentElement.dataset.linguaDisplay = mode;
}

async function applySavedProxy({ silent=true } = {}) {
  if (!window.linguaDesktop?.applyProxy) return { ok:false, error:'Proxy controls are unavailable in this build.' };
  const result = await window.linguaDesktop.applyProxy(state.appPrefs?.proxy || { enabled:false }, instancePartitions());
  if (!silent) setSettingsCenterStatus(result?.ok ? `Proxy applied: ${result.proxy}` : (result?.error || 'Could not apply proxy.'), !result?.ok);
  return result;
}

function setSettingsCenterStatus(message='', error=false) {
  const box = document.querySelector('#settingsCenterStatus');
  if (!box) return;
  box.textContent = message;
  box.className = `settings-center-status ${error ? 'error' : ''}`;
  box.hidden = !message;
}

async function refreshSettingsCenterStats() {
  try {
    state.appInfo = await window.linguaDesktop.appInfo();
    const cache = await window.linguaDesktop.cacheStats(instancePartitions());
    state.cacheBytes = cache?.ok ? Number(cache.bytes || 0) : 0;
  } catch (_) {}
  const version = document.querySelector('#settingsVersion');
  const cacheLabel = document.querySelector('#settingsCacheSize');
  if (version) version.textContent = state.appInfo?.version || '1.0.11';
  if (cacheLabel) cacheLabel.textContent = formatBytes(state.cacheBytes);
}

function settingsCenterHtml() {
  const p = state.appPrefs || {};
  const proxy = p.proxy || {};
  const version = state.appInfo?.version || '1.0.11';
  return `<div class="settings-center-backdrop" id="settingsCenterBackdrop">
    <div class="settings-center" role="dialog" aria-modal="true" aria-label="Lingua settings">
      <div class="settings-center-header">
        <div><h2>Lingua Settings & Updates</h2><div class="subtle">Changes here never reload the active conversation unless you explicitly choose Reload or Reset.</div></div>
        <button class="small-btn" id="closeSettingsCenter">Close</button>
      </div>

      <section class="settings-center-section">
        <h3>Display</h3>
        <div class="settings-radio-row">
          <label><input type="radio" name="displayMode" value="portrait" ${p.displayMode !== 'landscape' ? 'checked' : ''}> Portrait / compact controls</label>
          <label><input type="radio" name="displayMode" value="landscape" ${p.displayMode === 'landscape' ? 'checked' : ''}> Landscape / wider controls</label>
        </div>
        <div class="settings-help">This only changes Lingua's layout width. It does not reload Telegram, WhatsApp or the current chat.</div>
      </section>

      <section class="settings-center-section">
        <h3>Performance profile</h3>
        <label class="settings-inline-label">Computer profile
          <select id="performanceProfile"><option value="low" ${p.performanceProfile==='low'?'selected':''}>Low-memory computer</option><option value="normal" ${!['low','high'].includes(p.performanceProfile)?'selected':''}>Normal computer</option><option value="high" ${p.performanceProfile==='high'?'selected':''}>High-responsiveness computer</option></select>
        </label>
        <div class="settings-help">This changes Lingua's in-memory translation cache only; it never changes Windows system settings.</div>
      </section>

      <section class="settings-center-section">
        <h3>Storage & recovery</h3>
        <div class="settings-kv"><span>Web cache size</span><strong id="settingsCacheSize">${formatBytes(state.cacheBytes)}</strong></div>
        <div class="settings-action-grid">
          <button class="secondary" id="clearCurrentCache">Clear current service cache</button>
          <button class="secondary" id="clearAllCache">Clear all Lingua web cache</button>
          <button class="secondary" id="resetTranslationPrefs">Reset translation & UI settings</button>
        </div>
        <div class="settings-help">Cache cleanup keeps messenger logins. “Reset login” is separate and remains on the main toolbar.</div>
      </section>

      <section class="settings-center-section">
        <h3>Proxy (advanced)</h3>
        <label class="settings-check"><input id="proxyEnabled" type="checkbox" ${proxy.enabled ? 'checked' : ''}> Use one proxy for Lingua messenger sessions</label>
        <div class="proxy-grid">
          <select id="proxyScheme"><option value="http" ${proxy.scheme==='http'?'selected':''}>HTTP</option><option value="https" ${proxy.scheme==='https'?'selected':''}>HTTPS</option><option value="socks5" ${proxy.scheme==='socks5'?'selected':''}>SOCKS5</option></select>
          <input id="proxyHost" value="${esc(proxy.host || '')}" placeholder="Host or IP">
          <input id="proxyPort" inputmode="numeric" value="${esc(proxy.port || '')}" placeholder="Port">
        </div>
        <div class="settings-action-grid two">
          <button class="secondary" id="applyProxy">Apply proxy</button>
          <button class="secondary" id="testProxy">Check routing</button>
        </div>
        <div class="settings-help">Proxy passwords are intentionally not stored in Lingua v1.0.11. Use only a proxy you trust.</div>
      </section>

      <section class="settings-center-section">
        <h3>Software updates</h3>
        <div class="settings-kv"><span>Current version</span><strong id="settingsVersion">${esc(version)}</strong></div>
        <label class="settings-check"><input id="autoCheckUpdates" type="checkbox" ${p.autoCheckUpdates !== false ? 'checked' : ''}> Check for updates at startup</label>
        <label class="settings-inline-label">Update channel
          <select id="updateChannel"><option value="stable" ${p.updateChannel!=='beta'?'selected':''}>Stable</option><option value="beta" ${p.updateChannel==='beta'?'selected':''}>Beta / owner testing</option></select>
        </label>
        <div class="settings-action-grid two">
          <button class="primary" id="checkUpdate">Check for updates</button>
          <button class="secondary" id="openDownloads">Open Downloads</button>
          <button class="primary" id="downloadAvailableUpdate" hidden>Download available update</button>
        </div>
        <div class="settings-help">Lingua downloads updates only from HTTPS, verifies the complete installer against the owner-published SHA-256, then asks before running it. Silent installation remains disabled until the Windows installer is code-signed.</div>
      </section>

      <div id="settingsCenterStatus" class="settings-center-status" hidden></div>
    </div>
  </div>`;
}

async function openSettingsCenter() {
  if (document.querySelector('#settingsCenterBackdrop')) return;
  document.body.insertAdjacentHTML('beforeend', settingsCenterHtml());
  await refreshSettingsCenterStats();

  const close = () => document.querySelector('#settingsCenterBackdrop')?.remove();
  document.querySelector('#closeSettingsCenter')?.addEventListener('click', close);
  document.querySelector('#settingsCenterBackdrop')?.addEventListener('click', e => { if (e.target.id === 'settingsCenterBackdrop') close(); });

  document.querySelectorAll('input[name="displayMode"]').forEach(el => el.addEventListener('change', e => {
    state.appPrefs.displayMode = e.target.value === 'landscape' ? 'landscape' : 'portrait';
    persist();
    applyDisplayMode();
    setSettingsCenterStatus('Display mode updated without reloading the conversation.');
  }));

  document.querySelector('#autoCheckUpdates')?.addEventListener('change', e => {
    state.appPrefs.autoCheckUpdates = Boolean(e.target.checked);
    persist();
  });
  document.querySelector('#updateChannel')?.addEventListener('change', e => {
    state.appPrefs.updateChannel = e.target.value === 'beta' ? 'beta' : 'stable';
    persist();
  });
  document.querySelector('#performanceProfile')?.addEventListener('change', async e => {
    state.appPrefs.performanceProfile = ['low','high'].includes(e.target.value) ? e.target.value : 'normal';
    persist();
    const result = await window.linguaDesktop.setPerformanceProfile(state.appPrefs.performanceProfile);
    setSettingsCenterStatus(result?.ok ? `Performance profile applied: ${state.appPrefs.performanceProfile}.` : (result?.error || 'Could not apply performance profile.'), !result?.ok);
  });

  document.querySelector('#clearCurrentCache')?.addEventListener('click', async () => {
    const active = activeInstance();
    if (!active?.partition) return setSettingsCenterStatus('No active messaging service.', true);
    const result = await window.linguaDesktop.clearInstanceCache(active.partition);
    setSettingsCenterStatus(result?.ok ? 'Current service cache cleared. Login data was kept.' : (result?.error || 'Could not clear cache.'), !result?.ok);
    await refreshSettingsCenterStats();
  });
  document.querySelector('#clearAllCache')?.addEventListener('click', async () => {
    const result = await window.linguaDesktop.clearAppCache(instancePartitions());
    setSettingsCenterStatus(result?.ok ? 'All Lingua web caches cleared. Messenger logins were kept.' : (result?.error || 'Could not clear cache.'), !result?.ok);
    await refreshSettingsCenterStats();
  });
  document.querySelector('#resetTranslationPrefs')?.addEventListener('click', () => {
    if (!confirm('Reset Lingua translation profiles and UI preferences? Messenger web logins and your Lingua account session will be kept.')) return;
    for (const key of ['lingua.globalSettings','lingua.perInstance','lingua.perConversation','lingua.activeConversations','lingua.legacyCurrentMigrated','lingua.mode','lingua.settingsCollapsed','lingua.showFallbackComposer','lingua.appPrefs','lingua.desktopVersion']) localStorage.removeItem(key);
    location.reload();
  });

  document.querySelector('#applyProxy')?.addEventListener('click', async () => {
    const enabled = Boolean(document.querySelector('#proxyEnabled')?.checked);
    const scheme = document.querySelector('#proxyScheme')?.value || 'http';
    const host = document.querySelector('#proxyHost')?.value.trim() || '';
    const port = document.querySelector('#proxyPort')?.value.trim() || '';
    state.appPrefs.proxy = { enabled, scheme, host, port };
    const result = await applySavedProxy({ silent:false });
    if (result?.ok) persist();
  });
  document.querySelector('#testProxy')?.addEventListener('click', async () => {
    const active = activeInstance();
    const result = await window.linguaDesktop.testProxy(active?.partition || '');
    setSettingsCenterStatus(result?.ok ? `Route: ${result.resolved}` : (result?.error || 'Could not resolve proxy route.'), !result?.ok);
  });

  document.querySelector('#checkUpdate')?.addEventListener('click', () => checkForUpdates({ interactive:true }));
  document.querySelector('#openDownloads')?.addEventListener('click', () => window.linguaDesktop.openDownloads());
  document.querySelector('#downloadAvailableUpdate')?.addEventListener('click', async () => {
    const result = state.updateStatus;
    const url = result?.downloadUrl;
    const sha256 = String(result?.sha256 || '');
    if (!/^https:\/\//i.test(String(url || ''))) return setSettingsCenterStatus('No HTTPS update URL is available.', true);
    if (!/^[a-f0-9]{64}$/i.test(sha256)) return setSettingsCenterStatus('The update feed does not contain a valid SHA-256 checksum.', true);
    if (!confirm(`Download and verify Lingua ${result.latest}?`)) return;
    const button = document.querySelector('#downloadAvailableUpdate');
    if (button) { button.disabled = true; button.textContent = 'Downloading & verifying…'; }
    setSettingsCenterStatus(`Downloading Lingua ${result.latest}…`);
    const downloaded = await window.linguaDesktop.downloadUpdate({ url, sha256, version:result.latest });
    if (button) button.disabled = false;
    if (!downloaded?.ok) {
      syncUpdateDownloadButton();
      return setSettingsCenterStatus(downloaded?.error || 'Update download failed.', true);
    }
    setSettingsCenterStatus(`Lingua ${result.latest} downloaded and SHA-256 verified.`);
    if (confirm('The update is verified. Run the installer now? Lingua will close after the installer starts.')) {
      const launched = await window.linguaDesktop.launchVerifiedUpdate(downloaded.path);
      if (!launched?.ok) setSettingsCenterStatus(launched?.error || 'Could not start the verified installer.', true);
    } else {
      setSettingsCenterStatus(`Verified update saved to: ${downloaded.path}`);
      syncUpdateDownloadButton();
    }
  });
  syncUpdateDownloadButton();
}

function syncUpdateDownloadButton() {
  const button = document.querySelector('#downloadAvailableUpdate');
  if (!button) return;
  const result = state.updateStatus;
  const ready = Boolean(result?.ok && result?.configured && result?.updateAvailable && /^https:\/\//i.test(String(result?.downloadUrl || '')));
  button.hidden = !ready;
  if (ready) button.textContent = `Download & verify Lingua ${result.latest}`;
}

async function checkForUpdates({ interactive=false } = {}) {
  try {
    const result = await window.linguaDesktop.checkUpdate(state.appPrefs?.updateChannel || 'stable');
    state.updateStatus = result;
    if (!result?.ok) {
      if (interactive) setSettingsCenterStatus(result?.error || 'Update check failed.', true);
      syncUpdateDownloadButton();
      return result;
    }
    if (!result.configured) {
      if (interactive) setSettingsCenterStatus('The public update feed is not configured yet. Use Open Downloads for manual releases.');
      syncUpdateDownloadButton();
      return result;
    }
    if (result.updateAvailable) {
      const checksum = result.sha256 ? ` SHA-256: ${result.sha256.slice(0,12)}…` : '';
      const message = `Update ${result.latest} is available${result.mandatory ? ' (required)' : ''}.${checksum}`;
      if (interactive) setSettingsCenterStatus(message);
      else setNotice(message);
    } else if (interactive) {
      setSettingsCenterStatus(`Lingua ${result.current} is up to date.`);
    }
    syncUpdateDownloadButton();
    return result;
  } catch (error) {
    if (interactive) setSettingsCenterStatus(error.message || String(error), true);
    syncUpdateDownloadButton();
    return { ok:false, error:error.message || String(error) };
  }
}

async function redeemGiftCode() {
  if (!state.signedInEmail) return setNotice('Log in to your Lingua account first.', true);
  const code = prompt('Enter your Lingua Gift Code');
  if (!code?.trim()) return;
  setNotice('Checking gift code…');
  const result = await window.linguaDesktop.redeemCode(code.trim());
  if (!result?.ok) return setNotice(result?.error || 'Could not redeem this code.', true);
  state.translationMode = 'live';
  persist();
  await refreshAccountStatus();
  await refreshVoiceUsage();
  state.notice = result.message || `${String(result.plan || '').toUpperCase()} gift access activated.`;
  state.noticeError = false;
  render();
  applyDisplayMode();
}


function signalCompanionHtml() {
  const installed = Boolean(state.signalStatus?.installed);
  const statusLabel = installed ? 'Signal Desktop detected' : 'Signal Desktop not detected';
  const statusClass = installed ? 'signal-ready' : 'signal-missing';
  return `<div class="signal-companion" role="region" aria-label="Signal Desktop companion">
    <div class="signal-companion-icon">S</div>
    <h2>Signal Desktop companion</h2>
    <div class="signal-companion-status ${statusClass}">
      <strong>${esc(statusLabel)}</strong>
      <span>${installed ? 'Open Signal below. On first setup, the genuine QR code is shown by the official Signal Desktop app.' : 'Install the official Signal Desktop app first. Lingua does not generate, copy or replace Signal linking QR codes.'}</span>
    </div>
    <p>Signal does not provide an official browser chat. Lingua therefore integrates Signal as a secure desktop companion instead of embedding an unofficial or fake web client.</p>
    <ol>
      <li>${installed ? 'Click Open Signal Desktop / QR.' : 'Click Download official Signal Desktop and complete the official Windows installation.'}</li>
      <li>On first launch, Signal Desktop itself displays the genuine linking QR code.</li>
      <li>On your phone: Signal Settings → Linked devices → Link a new device, then scan the QR code shown by Signal Desktop.</li>
    </ol>
    <div class="signal-companion-actions">
      <button class="primary" id="openSignalDesktopPanel">${installed ? 'Open Signal Desktop / QR' : 'Check / Open Signal Desktop'}</button>
      <button class="secondary" id="downloadSignalDesktop">Download official Signal Desktop</button>
      <button class="secondary" id="checkSignalDesktop">Re-check installation</button>
    </div>
    <div class="signal-companion-note">Signal messages remain inside the official Signal Desktop app. Lingua can launch and detect it, but it does not bypass Signal's security model or replace Signal's own QR linking screen.</div>
  </div>`;
}

function render() {
  const active = activeInstance();
  const svc = serviceFor(active);
  const settings = editorSettings();
  const owner = isOwnerAdmin();
  const browserMode = Boolean(svc.browser);

  document.querySelector('#app').innerHTML = `
    <div class="app-shell ${state.showFallbackComposer ? 'fallback-open' : ''} ${state.settingsCollapsed ? 'settings-collapsed' : ''} ${state.instancesCollapsed ? 'instances-collapsed' : ''}">
      <aside class="instances">
        <div class="brand"><img class="brand-logo" src="./lingua-logo.png" alt="Lingua logo"><span>Lingua</span><small class="version-badge">v1.0.35</small></div>
        <div class="instance-list" aria-label="Messaging accounts. Drag to reorder.">
          ${state.instances.map(item => {
            const s = serviceFor(item);
            const details = accountDetailFor(item);
            return `<button class="instance-item ${item.id===state.activeId?'active':''}" data-instance="${item.id}" aria-label="${esc(details.name || item.label)} · ${esc(s.name)}">
              <span class="service-icon-wrap">
                <span class="service-icon" style="background:${s.color}">${s.letter}</span>
                <span class="instance-unread-badge" data-unread-for="${item.id}" ${Number(state.unreadByInstance[item.id] || 0) > 0 ? '' : 'hidden'}>${Number(state.unreadByInstance[item.id] || 0) > 0 ? formatUnreadCount(state.unreadByInstance[item.id]) : ''}</span>
              </span>
              <span class="instance-copy"><span class="instance-label">${esc(item.label)}</span><span class="instance-phone">${esc(details.phone || '')}</span></span>
              <span class="drag-grip" aria-hidden="true">⋮⋮</span>
            </button>`;
          }).join('')}
        </div>
        <div class="instance-footer">
          <button class="instances-collapse-btn" id="toggleInstances" title="${state.instancesCollapsed ? 'Expand messaging account sidebar' : 'Collapse messaging account sidebar'}" aria-label="${state.instancesCollapsed ? 'Expand messaging account sidebar' : 'Collapse messaging account sidebar'}">${state.instancesCollapsed ? '▶' : '◀'}</button>
          <button class="add-instance" id="addInstance" title="Add messaging account">+</button>
        </div>
        <div class="account-hover-tooltip" id="accountHoverTooltip" hidden></div>
      </aside>

      <section class="workspace ${browserMode ? 'browser-active' : ''}">
        <div class="toolbar">
          <div class="service-icon" style="background:${svc.color}">${svc.letter}</div>
          <div class="toolbar-title">${esc(active?.label || 'No service selected')}</div>
          <div class="status-stack">
            <span class="status">${state.signedInEmail ? `Lingua: ${esc(state.signedInEmail)}` : 'Lingua login required'}</span>
            ${providerBadge()}
          </div>
          ${owner ? `<button class="small-btn" id="toggleFallback">${state.showFallbackComposer ? 'Hide fallback' : 'Fallback composer'}</button>` : ''}
          <button class="small-btn" id="accountDetailsBtn">Account details</button>
          <button class="small-btn" id="renameInstance">Rename</button>
          <button class="small-btn danger-lite" id="removeInstance">Remove</button>
          <button class="small-btn" id="reloadService">Reload</button>
          ${svc.id === 'signal' ? `<button class="small-btn" id="openSignalDesktop">Open Signal Desktop</button>` : ''}
          <button class="small-btn" id="clearSession">Reset login</button>
          <button class="small-btn settings-launch" id="appSettingsBtn" title="App settings, cache, proxy and updates">⚙ Settings</button>
        </div>

        ${browserMode ? `<div class="browser-toolbar" aria-label="Chrome web navigation">
          <button class="browser-nav-btn" id="browserBack" title="Back">←</button>
          <button class="browser-nav-btn" id="browserForward" title="Forward">→</button>
          <button class="browser-nav-btn" id="browserHome" title="Google home">⌂</button>
          <button class="browser-nav-btn" id="browserRefresh" title="Reload">↻</button>
          <input id="browserAddress" class="browser-address" value="${esc(active?.url || 'https://www.google.com/')}" aria-label="Web address or Google search" placeholder="Search Google or enter a web address">
          <button class="browser-go-btn" id="browserGo">Go</button>
        </div>` : ''}

        <div class="webview-wrap ${svc.nativeCompanion ? 'native-companion' : ''}" id="webviewWrap">
          ${svc.id === 'signal' ? signalCompanionHtml() : (active ? '' : `<div class="empty-state">Add a messaging service.</div>`)}
        </div>

        ${owner && state.showFallbackComposer ? `
          <div class="composer">
            <textarea id="composeText" placeholder="Fallback: type here, translate, then insert into the active chat. Normal use: type directly inside WhatsApp/Telegram and press Send."></textarea>
            <button class="secondary" id="translateInsert">Translate & Insert</button>
            <button class="primary" id="translateSend">Translate & Send</button>
          </div>
        ` : ''}
      </section>

      <aside class="settings ${state.settingsCollapsed ? 'collapsed' : ''}">
        <div class="settings-topbar">
          <h3>Translation</h3>
          <button class="settings-collapse-btn" id="toggleSettings" title="${state.settingsCollapsed ? 'Expand translation settings' : 'Collapse translation settings'}">${state.settingsCollapsed ? '‹' : '›'}</button>
        </div>
        <div class="segment scope-segment">
          <button id="modeCurrent" class="${state.mode==='current'?'active':''}">Current</button>
          <button id="modeGlobal" class="${state.mode==='global'?'active':''}">Global</button>
        </div>
        <div id="scopeContext">${scopeContextHtml()}</div>
        ${owner ? `
          <div class="section-label">Owner diagnostics</div>
          <div class="segment engine-segment">
            <button id="engineLive" class="${state.translationMode==='live'?'active':''}">Live</button>
            <button id="engineTest" class="${state.translationMode==='test'?'active':''}">Test</button>
          </div>
          ${state.translationMode==='test' ? `<div class="notice warning"><strong>OWNER TEST MODE:</strong> validates the chat workflow only. Mock output is not a real translation.</div>` : ''}

          <details class="setting-section">
            <summary>Translation providers · owner only</summary>
            <div class="setting-section-body provider-card">
            <strong>Provider status</strong>
            <div class="provider-row"><span>Mock test provider</span><span class="health ok">Ready</span></div>
            <div class="provider-row"><span>Server</span><span class="provider-server-url">${esc(state.serverUrl || 'Unknown')}</span></div>
            <div class="provider-row"><span>DeepL</span><span class="health ${state.providerStatus?.deeplConfigured?'ok':'off'}">${state.providerStatus?.deeplConfigured?'Configured':'Not configured / unknown'}</span></div>
            <div class="provider-row"><span>Gemini API</span><span class="health ${state.providerStatus?.geminiConfigured?'ok':'off'}">${state.providerStatus?.geminiConfigured?'Configured':'Not configured / unknown'}</span></div>
            <div class="provider-row"><span>Microsoft Translator</span><span class="health ${state.providerStatus?.microsoftConfigured?'ok':'off'}">${state.providerStatus?.microsoftConfigured?'Configured':'Not configured / unknown'}</span></div>
            <div class="provider-row"><span>Google Cloud Translation</span><span class="health ${state.providerStatus?.googleConfigured?'ok':'off'}">${state.providerStatus?.googleConfigured?'Configured':'Not configured / unknown'}</span></div>
            <div class="provider-capability ${broadProviderConfigured() ? 'ok' : 'warning'}">${broadProviderConfigured()
              ? 'Broad languages enabled: Gemini/Microsoft/Google fallback can serve Myanmar/Burmese and the extended language list.'
              : 'DeepL-only mode: Myanmar/Burmese and other extended languages stay disabled until Gemini, Microsoft Translator, or Google Translate is configured on the server.'}</div>
            <div class="provider-action-grid"><button class="secondary" id="refreshProviderStatus">Refresh provider status</button><button class="secondary" id="testLiveTranslation">Test live translation</button></div>
            ${state.liveTestResult ? `<div class="mini-result">${esc(state.liveTestResult)}</div>` : ''}
            </div>
          </details>

          <details class="setting-section">
            <summary>Messenger diagnostics · owner only</summary>
            <div class="setting-section-body provider-card">
            <strong>Messenger adapter</strong>
            <div class="provider-row"><span>Service</span><span id="adapterService">${esc(state.adapterDiagnostics?.service || svc.name)}</span></div>
            <div class="provider-row"><span>Visible messages detected</span><span id="adapterCount" class="health ${Number(state.adapterDiagnostics?.messageCount||0)>0?'ok':'off'}">${Number(state.adapterDiagnostics?.messageCount||0)}</span></div>
            <div class="provider-row"><span>Message box detected</span><span id="adapterComposer" class="health ${state.adapterDiagnostics?.composerFound?'ok':'off'}">${state.adapterDiagnostics?.composerFound?'Yes':'No'}</span></div>
            <button class="secondary full-btn" id="translateVisibleNow">Translate visible messages now</button>
            </div>
          </details>
        ` : ''}
        <div id="noticeSlot">${noticeHtml()}</div>

        <details class="setting-section">
          <summary>Lingua account</summary>
          <div class="setting-section-body auth-card">
          <strong>Lingua account ${state.translationMode==='test' ? '<span class="subtle">(not required in test mode)</span>' : ''}</strong>
          ${state.signedInEmail
            ? `<div class="notice">Signed in as ${esc(state.signedInEmail)}</div>
               <div class="account-plan ${state.accountStatus?.ok && state.accountStatus.plan !== 'free' ? 'paid' : ''}">
                 <strong>${esc(accountPlanSummary())}</strong>
                 ${state.accountStatus?.ok && state.accountStatus.role === 'admin' ? '<span class="owner-badge">OWNER / ADMIN</span>' : ''}
               </div>
               ${accountDevicesHtml()}
               <div class="auth-actions wrap"><button class="small-btn" id="logout">Log out</button><button class="small-btn" id="billing">Billing</button><button class="small-btn gift-btn" id="redeemCode">Redeem Gift Code</button>${state.accountStatus?.ok && state.accountStatus.role === 'admin' ? '<button class="small-btn owner-action" id="openAdmin">Owner Admin</button>' : ''}<button class="small-btn" id="refreshAccount">Refresh plan</button></div>`
            : `<input id="loginEmail" type="email" placeholder="Email" />
               <input id="loginPassword" type="password" placeholder="Password" />
               <div class="auth-actions"><button class="primary" id="loginBtn">Log in</button><button class="small-btn" id="billing">Billing</button></div>`}
          </div>
        </details>

        ${owner ? `
        <details class="setting-section">
          <summary>Voice translator · owner beta</summary>
          <div class="setting-section-body voice-card">
          <div class="voice-title-row">
            <strong>🎙 Voice translator · owner beta</strong>
            <span class="voice-quota">${esc(voiceUsageSummary())}</span>
          </div>
          <div class="subtle">The dedicated speech backend is not live yet. Typed/pasted transcripts can use the normal text translator as a fallback. Microphone and messenger voice-message transcription stay owner-only until the speech backend is enabled.</div>
          <textarea id="voiceTranscript" class="voice-textarea" placeholder="Speak, or type/paste the speech transcript here…">${esc(state.voiceTranscript)}</textarea>
          <div class="voice-actions">
            <button class="secondary" id="voiceMic">${state.voiceListening ? '■ Stop' : '🎙 Start mic'}</button>
            <button class="primary" id="voiceTranslate">Translate voice</button>
          </div>
          ${state.voiceResult ? `<textarea class="voice-textarea result" readonly>${esc(state.voiceResult)}</textarea>
            <div class="voice-actions">
              <button class="secondary" id="voiceSpeak">🔊 Speak result</button>
              <button class="secondary" id="voiceInsert">Insert into chat</button>
            </div>` : ''}
          <div class="mini-result" id="voiceStatus">${esc(state.voiceStatus || 'Voice uses your outgoing target language. For best recognition, choose the source language instead of Auto detect.')}</div>
          ${state.translationMode === 'live' && state.voiceUsage?.ok && state.voiceUsage.remaining <= 0 ? `<button class="primary full-btn" id="voiceUpgrade">Upgrade voice allowance</button>` : ''}
          </div>
        </details>
        ` : ''}

        <details class="setting-section" open>
          <summary>Languages & direct send</summary>
          <div class="setting-section-body">
            <div class="flow-card">
              <div><span>You type</span><strong id="flowSource">${esc(languageName(settings.sourceLang))}</strong></div>
              <b>→</b>
              <div><span>Customer receives</span><strong id="flowTarget">${esc(languageName(settings.outgoingTarget))}</strong></div>
            </div>
            <div class="field"><label>My/source language</label><select id="sourceLang">${langOptions(settings.sourceLang,true,PROVIDER_EXTRA_LANGS)}</select></div>
            <div class="field"><label>Show incoming customer messages in</label><select id="incomingTarget">${langOptions(settings.incomingTarget,false,PROVIDER_EXTRA_LANGS)}</select></div>
            ${PROVIDER_EXTRA_CODES.has(settings.incomingTarget) ? `<div class="direct-send-note burmese-note">${esc(languageName(settings.incomingTarget))} uses Gemini, Microsoft Translator, or Google Translate on the Lingua server. If all broad providers are unavailable, Lingua keeps the original customer message visible and reports the translation error.</div>` : ''}
            <div class="field"><label>Send my messages in (customer language)</label><select id="outgoingTarget">${langOptions(settings.outgoingTarget,false,PROVIDER_EXTRA_LANGS)}</select></div>
            <div class="direct-send-note">Current = one selected conversation. Global = the default for conversations without a private Current profile. Switching these tabs only changes what you edit; it never reloads the messenger or changes a protected Current chat.</div>
          </div>
        </details>

        <details class="setting-section" open>
          <summary>Easy Translate mode</summary>
          <div class="setting-section-body">
        <label class="toggle-row"><span>Translate directly inside messenger</span><input id="nativeComposer" type="checkbox" ${settings.interceptNativeComposer?'checked':''}></label>
        <label class="toggle-row"><span>Auto-translate before Send / Enter</span><input id="translateBefore" type="checkbox" ${settings.translateBeforeSending?'checked':''}></label>
        <label class="toggle-row"><span>Confirm translated text before send</span><input id="confirmSend" type="checkbox" ${settings.confirmBeforeSend?'checked':''}></label>
          </div>
        </details>

        <details class="setting-section" open>
          <summary>Incoming message display</summary>
          <div class="setting-section-body">
        <label class="toggle-row"><span>Auto translate incoming customer messages</span><input id="autoIncoming" type="checkbox" ${settings.autoTranslateIncoming?'checked':''}></label>
        <label class="toggle-row"><span>Auto translate visible history</span><input id="historicalMessages" type="checkbox" ${settings.autoTranslateHistorical?'checked':''}></label>
        <label class="toggle-row"><span>Show clean translation card under message</span><input id="inlineTranslations" type="checkbox" ${settings.showInlineTranslations?'checked':''}></label>
        <label class="toggle-row"><span>Also translate my own sent messages</span><input id="translateOwnMessages" type="checkbox" ${settings.translateOwnMessages?'checked':''}></label>
          </div>
        </details>

        <div class="notice">
          Incoming translations are shown as compact Lingua cards. Your own sent messages are not translated underneath by default, keeping chats easier to read. Each added account keeps an isolated web session.
        </div>
      </aside>
    </div>
    ${state.modal ? renderModal() : ''}
  `;
  bindEvents();
  syncPersistentWebviews();
}

function noticeHtml() {
  if (!state.notice) return '';
  return `<div class="notice ${state.noticeError?'error':''}">${esc(state.notice)}</div>`;
}

function setNotice(message, error=false) {
  state.notice = message || '';
  state.noticeError = Boolean(error);
  const slot = document.querySelector('#noticeSlot');
  if (slot) slot.innerHTML = noticeHtml();
}

function renderModal() {
  const owner = isOwnerAdmin();
  const services = pickerServices();
  return `<div class="modal-backdrop" id="modalBackdrop">
    <div class="modal" id="modalBox">
      <div class="modal-header">
        <div>
          <h2 style="margin:0">Add messaging service</h2>
          <div class="subtle">Choose quantity, then pick a service. Each web copy keeps its own isolated login session. Chrome / Web opens a lightweight Chromium browser inside Lingua with Back, Forward, Home, Reload and an address/search bar. Signal uses the official Signal Desktop companion and genuine Signal QR linking flow.</div>
        </div>
        <button class="small-btn" id="closeModal">Close</button>
      </div>
      <div class="quantity-row">
        <label>Quantity</label>
        <input id="serviceQuantity" type="number" min="1" max="20" value="1" />
        <span>Up to 20 at once. You can add more later.</span>
      </div>
      <div class="service-grid">
        ${services.map(s => `<button class="service-card" data-service="${esc(s.id)}">
          <div class="service-icon" style="background:${esc(s.color)}">${esc(s.letter)}</div>${esc(s.name)}${s.badge?`<span class="service-badge">${esc(s.badge)}</span>`:''}${s.experimental?'<span class="experimental">Experimental</span>':''}
        </button>`).join('')}
      </div>
      ${owner ? `<section class="custom-app-manager">
        <div class="custom-app-manager-head">
          <div>
            <strong>Owner / Admin Custom App Manager</strong>
            <div class="subtle">Add any HTTPS web chat or messaging site without changing the built-in services. Custom apps stay on this Windows installation until you remove the template.</div>
          </div>
          <button class="primary compact" id="addCustomService">+ Add custom app</button>
        </div>
        ${state.customServices.length ? `<div class="custom-app-list">
          ${state.customServices.map(s => `<div class="custom-app-row">
            <div class="service-icon small" style="background:${esc(s.color)}">${esc(s.letter)}</div>
            <div class="custom-app-copy"><strong>${esc(s.name)}</strong><span>${esc(s.url)}</span></div>
            <button class="small-btn" data-custom-edit="${esc(s.id)}">Edit</button>
            <button class="small-btn danger-lite" data-custom-delete="${esc(s.id)}">Delete template</button>
          </div>`).join('')}
        </div>` : `<div class="custom-app-empty">No owner custom apps yet. Built-in apps are unchanged.</div>`}
        <div class="custom-app-warning">Security: custom URLs must use HTTPS and cannot contain embedded usernames/passwords. Translation/direct-send compatibility depends on each website and should be live-tested before customer use.</div>
      </section>` : ''}
    </div>
  </div>`;
}

function bindEvents() {
  document.querySelectorAll('[data-instance]').forEach(btn => btn.onclick = () => {
    if (Date.now() - lastInstanceDragAt < 300) return;
    state.activeId = btn.dataset.instance;
    persist();
    render();
  });
  bindInstanceDragDrop();
  bindAccountHoverTooltips();
  document.querySelector('#toggleInstances')?.addEventListener('click', () => {
    state.instancesCollapsed = !state.instancesCollapsed;
    persist();
    render();
  });
  document.querySelector('#addInstance')?.addEventListener('click', () => { state.modal=true; render(); });
  document.querySelector('#closeModal')?.addEventListener('click', () => { state.modal=false; render(); });
  document.querySelector('#modalBackdrop')?.addEventListener('click', e => {
    if (e.target.id==='modalBackdrop') { state.modal=false; render(); }
  });
  document.querySelectorAll('[data-service]').forEach(btn => btn.onclick = () => {
    const qty = Math.max(1, Math.min(20, Number(document.querySelector('#serviceQuantity')?.value || 1)));
    addService(btn.dataset.service, qty);
  });
  document.querySelector('#addCustomService')?.addEventListener('click', createCustomService);
  document.querySelectorAll('[data-custom-edit]').forEach(btn => btn.addEventListener('click', () => editCustomService(btn.dataset.customEdit)));
  document.querySelectorAll('[data-custom-delete]').forEach(btn => btn.addEventListener('click', () => deleteCustomService(btn.dataset.customDelete)));

  const browserView = activePersistentView();
  const navigateBrowser = () => {
    if (!browserView || serviceFor(activeInstance()).id !== 'chrome') return;
    const input = document.querySelector('#browserAddress');
    const url = normalizeBrowserInput(input?.value);
    if (!url) return setNotice('Enter a valid web address or search.', true);
    rememberBrowserUrl(url);
    try { browserView.loadURL(url); } catch (_) { setNotice('Could not open that web address.', true); }
  };
  document.querySelector('#browserBack')?.addEventListener('click', () => { try { if (browserView?.canGoBack()) browserView.goBack(); } catch (_) {} });
  document.querySelector('#browserForward')?.addEventListener('click', () => { try { if (browserView?.canGoForward()) browserView.goForward(); } catch (_) {} });
  document.querySelector('#browserHome')?.addEventListener('click', () => {
    if (!browserView) return;
    const home = 'https://www.google.com/';
    rememberBrowserUrl(home);
    try { browserView.loadURL(home); } catch (_) {}
  });
  document.querySelector('#browserRefresh')?.addEventListener('click', () => { try { browserView?.reload(); } catch (_) {} });
  document.querySelector('#browserGo')?.addEventListener('click', navigateBrowser);
  document.querySelector('#browserAddress')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); navigateBrowser(); }
  });

  document.querySelector('#toggleSettings')?.addEventListener('click', () => {
    state.settingsCollapsed = !state.settingsCollapsed;
    persist();
    applySettingsCollapsedUi();
  });
  document.querySelector('#modeCurrent')?.addEventListener('click', () => setScopeMode('current'));
  document.querySelector('#modeGlobal')?.addEventListener('click', () => setScopeMode('global'));
  document.querySelector('#resetCurrentProfile')?.addEventListener('click', resetCurrentProfile);
  document.querySelector('#engineLive')?.addEventListener('click', async () => {
    state.translationMode='live';
    persist();
    await refreshAccountStatus();
    state.providerStatus = await window.linguaDesktop.providerStatus().catch(() => ({ok:false}));
    await refreshVoiceUsage();
    render();
  });
  document.querySelector('#engineTest')?.addEventListener('click', () => { state.translationMode='test'; persist(); render(); });
  document.querySelector('#refreshProviderStatus')?.addEventListener('click', async () => {
    state.providerStatus = await window.linguaDesktop.providerStatus().catch(() => ({ok:false}));
    setNotice(broadProviderConfigured()
      ? 'Broad-language provider is ready. Myanmar/Burmese and other Gemini/Microsoft/Google languages are available.'
      : 'Current server is DeepL-only for broad-language purposes. Configure Gemini, Microsoft Translator, or Google Translate on Vercel for Myanmar/Burmese and other broad languages.',
      !broadProviderConfigured());
    render();
  });
  document.querySelector('#testLiveTranslation')?.addEventListener('click', testLiveTranslation);
  document.querySelector('#translateVisibleNow')?.addEventListener('click', () => {
    const view = activePersistentView();
    if (view) { view.send('lingua-rescan', { force:true }); setNotice('Scanning visible messages for translation…'); }
  });

  document.querySelector('#voiceMic')?.addEventListener('click', startVoiceRecognition);
  document.querySelector('#voiceTranslate')?.addEventListener('click', translateVoice);
  document.querySelector('#voiceSpeak')?.addEventListener('click', speakVoiceResult);
  document.querySelector('#voiceInsert')?.addEventListener('click', insertVoiceResult);
  document.querySelector('#voiceUpgrade')?.addEventListener('click', () => window.linguaDesktop.openBilling());
  document.querySelector('#voiceTranscript')?.addEventListener('input', e => { state.voiceTranscript = e.target.value; });

  document.querySelector('#sourceLang')?.addEventListener('change', e => { void setLanguageSafely('sourceLang', e.target.value); });
  document.querySelector('#incomingTarget')?.addEventListener('change', e => { void setLanguageSafely('incomingTarget', e.target.value); });
  document.querySelector('#outgoingTarget')?.addEventListener('change', e => { void setLanguageSafely('outgoingTarget', e.target.value); });
  document.querySelector('#nativeComposer')?.addEventListener('change', e => setSetting('interceptNativeComposer', e.target.checked));
  document.querySelector('#translateBefore')?.addEventListener('change', e => setSetting('translateBeforeSending', e.target.checked));
  document.querySelector('#confirmSend')?.addEventListener('change', e => setSetting('confirmBeforeSend', e.target.checked));
  document.querySelector('#autoIncoming')?.addEventListener('change', e => setSetting('autoTranslateIncoming', e.target.checked));
  document.querySelector('#historicalMessages')?.addEventListener('change', e => setSetting('autoTranslateHistorical', e.target.checked));
  document.querySelector('#inlineTranslations')?.addEventListener('change', e => setSetting('showInlineTranslations', e.target.checked));
  document.querySelector('#translateOwnMessages')?.addEventListener('change', e => setSetting('translateOwnMessages', e.target.checked));

  document.querySelectorAll('[data-remove-device]').forEach(btn => btn.addEventListener('click', () => {
    void removeAccountDevice(btn.dataset.removeDevice, btn.dataset.currentDevice === '1');
  }));

  document.querySelector('#loginBtn')?.addEventListener('click', doLogin);
  document.querySelector('#logout')?.addEventListener('click', doLogout);
  document.querySelector('#billing')?.addEventListener('click', () => window.linguaDesktop.openBilling());
  document.querySelector('#refreshAccount')?.addEventListener('click', async () => {
    await refreshAccountStatus();
    await refreshVoiceUsage();
    state.notice = state.accountStatus?.ok ? `Account refreshed · ${accountPlanSummary()}` : 'Could not refresh account plan.';
    state.noticeError = !state.accountStatus?.ok;
    render();
  });
  document.querySelector('#reloadService')?.addEventListener('click', () => { try { activePersistentView()?.reload(); } catch (_) {} });
  document.querySelector('#openSignalDesktop')?.addEventListener('click', openSignalDesktop);
  document.querySelector('#openSignalDesktopPanel')?.addEventListener('click', openSignalDesktop);
  document.querySelector('#checkSignalDesktop')?.addEventListener('click', () => refreshSignalDesktopStatus({ rerender:true }));
  document.querySelector('#downloadSignalDesktop')?.addEventListener('click', () => window.linguaDesktop.openExternal('https://signal.org/download/'));
  document.querySelector('#clearSession')?.addEventListener('click', clearSession);
  document.querySelector('#appSettingsBtn')?.addEventListener('click', openSettingsCenter);
  document.querySelector('#redeemCode')?.addEventListener('click', redeemGiftCode);
  document.querySelector('#openAdmin')?.addEventListener('click', () => window.linguaDesktop.openAdmin());
  document.querySelector('#accountDetailsBtn')?.addEventListener('click', editAccountDetails);
  document.querySelector('#renameInstance')?.addEventListener('click', renameInstance);
  document.querySelector('#removeInstance')?.addEventListener('click', removeInstance);
  document.querySelector('#toggleFallback')?.addEventListener('click', () => {
    state.showFallbackComposer = !state.showFallbackComposer;
    persist();
    render();
  });
  document.querySelector('#translateInsert')?.addEventListener('click', () => translateCompose(false));
  document.querySelector('#translateSend')?.addEventListener('click', () => translateCompose(true));
  document.querySelector('#composeText')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      translateCompose(true);
    }
  });
}

async function addService(serviceId, quantity=1) {
  const svc = SERVICES.find(s => s.id === serviceId) || customServiceForId(serviceId);
  if (!svc) return;

  if (svc.ownerCustom && !isOwnerAdmin()) {
    state.modal = false;
    render();
    return setNotice('Owner/Admin permission is required to add custom web apps.', true);
  }


  if (serviceId === 'custom') {
    if (!isOwnerAdmin()) return setNotice('Owner/Admin permission is required to add custom web apps.', true);
    return createCustomService();
  }

  let lastId = '';
  const existingCount = state.instances.reduce((count, item) => count + (item.service === svc.id ? 1 : 0), 0);
  const pendingWarmups = [];
  for (let i = 0; i < quantity; i += 1) {
    const id = crypto.randomUUID();
    const nextNumber = existingCount + i + 1;
    const partition = `persist:lingua-${svc.ownerCustom ? 'custom' : svc.id}-${id}`;
    state.instances.push({
      id,
      service:svc.id,
      label: svc.id === 'signal' ? 'Signal' : (svc.id === 'chrome' ? `Chrome ${nextNumber}` : `${svc.name} ${nextNumber}`),
      url:svc.url,
      customName:svc.ownerCustom ? svc.name : undefined,
      customColor:svc.ownerCustom ? svc.color : undefined,
      customLetter:svc.ownerCustom ? svc.letter : undefined,
      partition
    });
    if (svc.url?.startsWith('https://')) {
      pendingWarmups.push(window.linguaDesktop?.warmService?.(svc.url, partition));
    }
    lastId = id;
  }
  state.activeId = lastId;
  state.modal = false;
  persist();
  render();
  Promise.allSettled(pendingWarmups.filter(Boolean)).catch(() => {});
}

async function openSignalDesktop() {
  try {
    await refreshSignalDesktopStatus();
    const result = await window.linguaDesktop?.launchSignal?.();
    if (result?.launched) {
      await refreshSignalDesktopStatus();
      setNotice('Signal Desktop opened. On first setup, scan the genuine QR shown by Signal Desktop with Signal on your phone.');
    } else {
      await refreshSignalDesktopStatus();
      setNotice('Signal Desktop is not installed yet. Use the official download button, complete the Windows installation, then press Re-check installation.', true);
    }
  } catch (error) {
    setNotice(error?.message || 'Could not open Signal Desktop.', true);
  }
}

function createCustomService() {
  if (!isOwnerAdmin()) return setNotice('Owner/Admin permission is required to manage custom apps.', true);
  const name = String(prompt('Custom app name', 'Custom Chat') || '').trim().slice(0, 48);
  if (!name) return;
  const rawUrl = prompt('Full HTTPS web app URL', 'https://') || '';
  const url = normalizeCustomUrl(rawUrl);
  if (!url) return setNotice('Custom app URL must be a valid HTTPS URL without embedded username/password.', true);
  const existing = state.customServices.find(s => s.name.toLowerCase() === name.toLowerCase() && s.url === url);
  if (existing) return setNotice('That custom app is already saved.', true);
  const custom = normalizeCustomService({
    id:`owner-custom-${crypto.randomUUID()}`,
    name,
    url,
    color:'#7C3AED',
    letter:(name[0] || '+').toUpperCase()
  });
  if (!custom) return setNotice('Could not create the custom app.', true);
  state.customServices.push(custom);
  persist();
  state.modal = true;
  render();
  setNotice(`${name} was added to the Owner/Admin service picker.`);
}

function editCustomService(id) {
  if (!isOwnerAdmin()) return setNotice('Owner/Admin permission is required to manage custom apps.', true);
  const item = customServiceForId(id);
  if (!item) return;
  const name = String(prompt('Custom app name', item.name) || '').trim().slice(0, 48);
  if (!name) return;
  const rawUrl = prompt('Full HTTPS web app URL', item.url) || '';
  const url = normalizeCustomUrl(rawUrl);
  if (!url) return setNotice('Custom app URL must be a valid HTTPS URL without embedded username/password.', true);
  item.name = name;
  item.url = url;
  item.letter = (name[0] || '+').toUpperCase();
  persist();
  render();
  setNotice(`${name} custom app template updated. Existing open instances keep their current URL until re-added.`);
}

function deleteCustomService(id) {
  if (!isOwnerAdmin()) return setNotice('Owner/Admin permission is required to manage custom apps.', true);
  const item = customServiceForId(id);
  if (!item) return;
  if (!confirm(`Delete the ${item.name} custom app template?\n\nExisting instances already added to Lingua will remain so active login sessions are not destroyed.`)) return;
  state.customServices = state.customServices.filter(s => s.id !== id);
  persist();
  render();
  setNotice(`${item.name} template removed. Existing instances were preserved.`);
}

function renameInstance() {
  const active = activeInstance();
  if (!active) return;
  const oldLabel = active.label;
  const label = prompt('Rename this account', active.label);
  if (!label?.trim()) return;
  active.label = label.trim().slice(0, 60);
  const details = state.accountDetails?.[active.id];
  if (details && (!details.name || details.name === oldLabel)) details.name = active.label;
  persist();
  render();
}

function removeInstance() {
  const active = activeInstance();
  if (!active) return;
  if (!confirm(`Remove ${active.label} from Lingua Bridge?\n\nThis removes it from the list. Use Reset login first if you also want to clear its saved web session.`)) return;
  state.instances = state.instances.filter(x => x.id !== active.id);
  delete state.perInstance[active.id];
  delete state.accountDetails[active.id];
  delete state.unreadByInstance[active.id];
  delete state.unreadRawByInstance[active.id];
  state.activeId = state.instances[0]?.id || '';
  persist();
  render();
}

async function doLogin() {
  const email = document.querySelector('#loginEmail')?.value.trim();
  const password = document.querySelector('#loginPassword')?.value;
  if (!email || !password) return setNotice('Enter your Lingua email and password.', true);
  setNotice('Signing in…');
  const result = await window.linguaDesktop.login({ email, password });
  if (!result.ok) return setNotice(result.error || 'Login failed.', true);
  state.signedInEmail = result.email;
  await refreshAccountStatus();
  state.providerStatus = await window.linguaDesktop.providerStatus().catch(() => ({ok:false}));
  await refreshVoiceUsage();
  state.notice = 'Lingua account connected.';
  state.noticeError = false;
  render();
}


async function testLiveTranslation() {
  if (!state.signedInEmail) {
    state.liveTestResult = 'Log in first.';
    render();
    return;
  }
  const s = currentSettings();
  try {
    state.liveTestResult = 'Testing…';
    render();
    const target = s.outgoingTarget || 'en';
    const result = await window.linguaDesktop.translate({
      text: 'Hello',
      sourceLang: 'en',
      targetLang: target === 'en' ? 'es' : target,
      testMode: false
    });
    if (!result.ok) throw new Error(result.error || 'Live translation failed.');
    state.liveTestResult = `OK · ${result.provider || 'provider'} · ${result.translatedText}`;
    state.providerStatus = { ...(state.providerStatus || {}), ok:true };
    state.notice = '';
    state.noticeError = false;
    render();
  } catch (error) {
    state.liveTestResult = `FAILED · ${error.message || String(error)}`;
    render();
  }
}

async function doLogout() {
  await window.linguaDesktop.logout();
  state.signedInEmail = '';
  state.providerStatus = null;
  state.accountStatus = null;
  state.voiceUsage = null;
  state.notice = 'Signed out.';
  state.noticeError = false;
  render();
}

async function clearSession() {
  const active = activeInstance();
  if (!active) return;
  if (!confirm(`Reset the saved ${active.label} web login?`)) return;
  const result = await window.linguaDesktop.clearInstanceSession(active.partition);
  if (!result.ok) return setNotice(result.error || 'Could not reset session.', true);
  try { activePersistentView()?.reload(); } catch (_) {}
  setNotice(`${active.label} session cleared.`);
}

async function translateText(text, targetLang, sourceLang) {
  if (state.translationMode === 'live' && !state.signedInEmail) throw new Error('Log in to your Lingua account first.');
  const result = await window.linguaDesktop.translate({
    text,
    sourceLang: sourceLang || currentSettings().sourceLang || 'auto',
    targetLang,
    testMode: state.translationMode === 'test'
  });
  if (!result.ok) throw new Error(result.error || 'Translation failed.');
  return result;
}

async function translateCompose(sendRequested) {
  const box = document.querySelector('#composeText');
  const original = box?.value.trim();
  if (!original) return;
  const s = currentSettings();
  try {
    setNotice('Translating…');
    const result = s.translateBeforeSending
      ? await translateText(original, s.outgoingTarget, s.sourceLang)
      : { translatedText: original, provider: 'identity' };
    let sendNow = sendRequested && !s.confirmBeforeSend;
    if (sendRequested && s.confirmBeforeSend) {
      sendNow = confirm(`Send this translated message?\n\n${result.translatedText}`);
    }
    activePersistentView()?.send('lingua-insert-text', { text: result.translatedText, sendNow });
    setNotice(sendNow
      ? `Translated by ${result.provider || 'provider'} and sent.`
      : `Translated by ${result.provider || 'provider'} and inserted. Review it, then send.`);
    box.value = '';
  } catch (error) {
    setNotice(error.message || String(error), true);
  }
}

function sendSettings() {
  const instance = activeInstance();
  const view = activePersistentView();
  if (!view || !instance) return;
  sendSettingsToPersistentView(view, instance, true);
}

function incomingQueueKey(payload) {
  // Each message has its own pending result ID, even when its text is identical.
  return String(payload.id || '');
}

function enqueueIncoming(view, payload) {
  const key = incomingQueueKey(payload);
  if (!key || incomingQueuedKeys.has(key)) return;
  incomingQueuedKeys.add(key);
  const item = { view, payload, key, attempts: 0 };
  // Real-time customer messages jump ahead of historical backfill. This is a
  // latency optimization only; every queued history item remains deduplicated.
  if (payload.priority === 'history') state.incomingQueue.push(item);
  else state.incomingQueue.unshift(item);
  if (state.incomingQueue.length > 24) {
    const dropped = state.incomingQueue.splice(24);
    for (const oldItem of dropped) {
      incomingQueuedKeys.delete(oldItem.key);
      oldItem.view.send('lingua-translation-result', {
        id:oldItem.payload.id,
        ok:false,
        error:'Incoming translation queue was full. Retry this message.'
      });
    }
  }
  drainIncomingQueue();
}

function drainIncomingQueue() {
  if (!state.incomingQueue.length) return;
  const peek = state.incomingQueue[0];
  const peekBroad = PROVIDER_EXTRA_CODES.has(String(peek?.payload?.targetLang || ''));
  // DeepL/common-language cards may run two at a time for visibly faster backfill.
  // Broad-language providers stay serialized to protect Gemini/Microsoft/Google quotas.
  const concurrencyLimit = peekBroad ? 1 : 2;
  if (state.incomingActive >= concurrencyLimit) return;

  const wait = Math.max(0, incomingNextStartAt - Date.now(), providerPenaltyUntil - Date.now());
  if (wait > 0) {
    setTimeout(drainIncomingQueue, Math.min(wait, 1000));
    return;
  }

  const item = state.incomingQueue.shift();
  if (!item) return;
  state.incomingActive += 1;
  const broadTarget = PROVIDER_EXTRA_CODES.has(String(item.payload.targetLang || ''));
  const isHistory = item.payload.priority === 'history';
  const now = Date.now();
  const broadGap = isHistory
    ? 2200
    : (now < broadPenaltyUntil ? Math.max(2000, broadRealtimeGapMs) : broadRealtimeGapMs);
  const standardGap = isHistory ? 320 : providerRealtimeGapMs;
  incomingNextStartAt = now + (broadTarget ? broadGap : standardGap);

  // If the next item is a normal DeepL/common-language card, allow the second
  // worker to start without waiting for this network request to finish.
  setTimeout(drainIncomingQueue, broadTarget ? 0 : 25);

  (async () => {
    try {
      const result = await translateText(item.payload.text, item.payload.targetLang, item.payload.sourceLang);
      if (broadTarget && !isHistory) broadRealtimeGapMs = Math.max(800, broadRealtimeGapMs - 50);
      if (!isHistory) providerRealtimeGapMs = Math.max(60, providerRealtimeGapMs - 5);
      incomingQueuedKeys.delete(item.key);
      item.view.send('lingua-translation-result', {
        id:item.payload.id,
        ok:true,
        translatedText:result.translatedText,
        provider:result.provider
      });
    } catch (error) {
      const message = error.message || String(error);
      const transient = /temporarily unavailable|429|too many|rate limit|resource exhausted|502|503/i.test(message);
      if (transient) {
        providerRealtimeGapMs = Math.min(1800, Math.max(500, providerRealtimeGapMs * 2));
        providerPenaltyUntil = Date.now() + 12_000;
      }
      if (transient && broadTarget) {
        broadRealtimeGapMs = Math.min(5000, Math.max(1700, broadRealtimeGapMs * 1.7));
        broadPenaltyUntil = Date.now() + 30_000;
      }
      const maxRetries = isHistory ? 0 : 1;
      if (transient && item.attempts < maxRetries) {
        item.attempts += 1;
        const retryDelay = broadTarget ? 6000 : 2500;
        setTimeout(() => {
          if (item.payload.priority === 'history') state.incomingQueue.push(item);
          else state.incomingQueue.unshift(item);
          drainIncomingQueue();
        }, retryDelay);
      } else {
        incomingQueuedKeys.delete(item.key);
        item.view.send('lingua-translation-result', {
          id:item.payload.id,
          ok:false,
          error:message
        });
      }
    } finally {
      state.incomingActive = Math.max(0, state.incomingActive - 1);
      setTimeout(drainIncomingQueue, broadTarget ? (isHistory ? 350 : 100) : (isHistory ? 90 : 30));
    }
  })();
}



window.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented) return;

  // Preserve conventional Escape behavior for Lingua's own modal surfaces first.
  const settingsCenter = document.querySelector('#settingsCenterBackdrop');
  if (settingsCenter) {
    settingsCenter.remove();
    event.preventDefault();
    return;
  }
  if (state.modal) {
    state.modal = false;
    render();
    event.preventDefault();
    return;
  }

  // External links opened in a persistent messenger webview can always return
  // to the chat with Esc. No webview recreation or messenger reload is needed.
  if (escapeBackActiveView()) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);


(async function init() {
  state.preloadPath = await window.linguaDesktop.getPreloadPath();
  const info = await window.linguaDesktop.getServerInfo();
  state.signedInEmail = info.signedInEmail || '';
  state.serverUrl = info.serverUrl || '';
  state.appInfo = await window.linguaDesktop.appInfo().catch(() => null);
  await window.linguaDesktop.setPerformanceProfile(state.appPrefs?.performanceProfile || 'normal').catch(() => null);
  if (state.appPrefs?.proxy?.enabled) await applySavedProxy({ silent:true });
  await refreshAccountStatus();
  state.providerStatus = await window.linguaDesktop.providerStatus().catch(() => ({ok:false}));
  await refreshSignalDesktopStatus();
  await refreshVoiceUsage();
  render();
  applyDisplayMode();
  if (state.appPrefs?.autoCheckUpdates !== false) {
    const last = Number(localStorage.getItem('lingua.lastUpdateCheck') || 0);
    if (!last || Date.now() - last > 6 * 60 * 60 * 1000) {
      localStorage.setItem('lingua.lastUpdateCheck', String(Date.now()));
      checkForUpdates({ interactive:false });
    }
  }
})();
