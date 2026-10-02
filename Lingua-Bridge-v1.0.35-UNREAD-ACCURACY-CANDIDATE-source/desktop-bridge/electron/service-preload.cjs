const { ipcRenderer, webFrame } = require('electron');

let settings = {
  isActive: false,
  autoTranslateIncoming: true,
  autoTranslateHistorical: false,
  incomingTarget: 'en',
  sourceLang: 'auto',
  sourceLangLabel: 'Auto detect',
  translateBeforeSending: true,
  outgoingTarget: 'en',
  outgoingTargetLabel: 'English',
  confirmBeforeSend: false,
  interceptNativeComposer: true,
  showInlineTranslations: true,
  translateOwnMessages: false,
  incomingTargetLabel: 'English'
};

const pendingIncoming = new Map();
const pendingIncomingFingerprints = new Set();
const pendingOutgoing = new Map();
let messageCounter = 0;
let scanTimer = null;
let outgoingBusy = false;
let bypassNextSendUntil = 0;
let approvedOutgoingText = '';
let approvedOutgoingCard = null;
let statusChipTimer = null;
let suppressNativeUntil = 0;
let lastEnterHadShift = false;
let composerFocused = false;
let sendShieldTimer = null;
let uiAssistTimer = null;
let lastConversationSignature = '';
let lastUnreadCount = -1;
let unreadTimer = null;
const translationCache = new Map();
// Keep a durable local history so reopening/switching conversations restores already-translated messages without sending them to the provider again.
const TRANSLATION_CACHE_LIMIT = 5000;
const TRANSLATION_CACHE_STORAGE_KEY = 'lingua.translationCache.v2';
const primedConversationKeys = new Set();
let lastScanConversationKey = '';
const translationFailureBackoff = new Map();
const TRANSLATION_FAILURE_BACKOFF_LIMIT = 400;
let translationProviderCooldownUntil = 0;

function translationFailureKey(fp, targetLang = settings.incomingTarget || 'en') {
  return `${targetLang || 'en'}\u0000${fp}`;
}

function failureBackoffFor(fp, targetLang = settings.incomingTarget || 'en') {
  return translationFailureBackoff.get(translationFailureKey(fp, targetLang));
}

function rememberTranslationFailure(fp, message = '', targetLang = settings.incomingTarget || 'en') {
  const key = translationFailureKey(fp, targetLang);
  const previous = translationFailureBackoff.get(key) || { attempts: 0, nextRetryAt: 0 };
  const attempts = Math.min(6, Number(previous.attempts || 0) + 1);
  // Important: never turn a provider outage into an automatic retry storm.
  // A single 429 used to clear the message fingerprint, causing every DOM scan
  // to resubmit the same visible messages and keep the provider rate-limited.
  const delayByAttempt = [15_000, 30_000, 60_000, 120_000, 300_000, 600_000];
  const delay = delayByAttempt[Math.min(attempts - 1, delayByAttempt.length - 1)];
  const transient = /temporarily unavailable|429|too many|rate limit|resource exhausted|502|503/i.test(String(message || ''));
  if (transient) translationProviderCooldownUntil = Math.max(translationProviderCooldownUntil, Date.now() + 15_000);
  translationFailureBackoff.delete(key);
  translationFailureBackoff.set(key, { attempts, nextRetryAt: Date.now() + delay, message: String(message || '') });
  while (translationFailureBackoff.size > TRANSLATION_FAILURE_BACKOFF_LIMIT) {
    translationFailureBackoff.delete(translationFailureBackoff.keys().next().value);
  }
}

function clearTranslationFailure(fp, targetLang = settings.incomingTarget || 'en') {
  translationFailureBackoff.delete(translationFailureKey(fp, targetLang));
}

function translationRetryBlocked(fp, forceRetry = false, targetLang = settings.incomingTarget || 'en') {
  if (forceRetry) return false;
  if (Date.now() < translationProviderCooldownUntil) return true;
  const state = failureBackoffFor(fp, targetLang);
  return Boolean(state && Date.now() < Number(state.nextRetryAt || 0));
}


const SERVICE_RULES = [
  {
    id: 'whatsapp',
    match: host => host.includes('whatsapp.com'),
    messageSelectors: [
      '[data-pre-plain-text] span.selectable-text',
      '[data-pre-plain-text] .copyable-text',
      'div.message-in span.selectable-text',
      'div.message-out span.selectable-text'
    ],
    bubbleSelectors: ['[data-pre-plain-text]', '.message-in', '.message-out'],
    composerSelectors: [
      'footer div[contenteditable="true"][role="textbox"]',
      'footer div[contenteditable="true"][data-tab]',
      'footer div[contenteditable="true"]'
    ],
    sendSelectors: ['button[aria-label="Send"]', 'span[data-icon="send"]', '[data-testid="send"]']
  },
  {
    id: 'telegram',
    match: host => host.includes('telegram.org'),
    // Telegram Web K currently uses .bubble > .message and
    // .input-message-input. Web A/Z uses a different composer. Keep both
    // families here so minor Telegram UI changes do not disable Lingua.
    messageSelectors: [
      '.bubble:not(.service):not(.is-date) .message .translatable-message',
      '.bubble:not(.service):not(.is-date) .message .text-content',
      '.bubble:not(.service):not(.is-date) .message',
      '.bubble-content .translatable-message',
      '.bubble-content .text-content',
      '.Message .text-content',
      '.message-list-item .text-content',
      '[data-message-id] .text-content',
      '[data-mid] .text-content'
    ],
    bubbleSelectors: [
      '.bubble:not(.service):not(.is-date)', '.Message', '.message-list-item',
      '[data-message-id]', '[data-mid]'
    ],
    composerSelectors: [
      '.input-message-input[contenteditable="true"]',
      '#editable-message-text[contenteditable="true"]',
      '.composer_rich_textarea[contenteditable="true"]',
      '[contenteditable="true"][role="textbox"]'
    ],
    sendSelectors: [
      '.btn-send', '[class*="btn-send"]', 'button.main-button.send', 'button.send',
      'button[aria-label="Send"]', 'button[title="Send"]', '[data-testid*="send"]', '.send-button'
    ]
  },
  {
    id: 'messenger',
    match: host => host.includes('messenger.com') || host.includes('facebook.com'),
    messageSelectors: ['[role="main"] [dir="auto"] span[dir="auto"]', '[data-scope="messages_table"] [dir="auto"]'],
    bubbleSelectors: ['[role="row"]', '[data-scope="messages_table"]'],
    composerSelectors: ['div[contenteditable="true"][role="textbox"]', 'div[aria-label*="Message"][contenteditable="true"]'],
    sendSelectors: ['div[aria-label="Press Enter to send"]', 'button[aria-label="Send"]', '[aria-label="Send"]']
  },
  {
    id: 'instagram',
    match: host => host.includes('instagram.com'),
    messageSelectors: ['div[role="row"] span[dir="auto"]', 'main div[dir="auto"]'],
    bubbleSelectors: ['div[role="row"]'],
    composerSelectors: ['div[contenteditable="true"][role="textbox"]', 'textarea[placeholder]'],
    sendSelectors: ['button[type="submit"]', 'div[role="button"][aria-label="Send"]']
  },
  {
    id: 'discord',
    match: host => host.includes('discord.com'),
    messageSelectors: ['[id^="message-content-"]'],
    bubbleSelectors: ['[id^="chat-messages-"]', 'li[class*="messageListItem"]'],
    composerSelectors: ['div[role="textbox"][contenteditable="true"]'],
    sendSelectors: []
  },
  {
    id: 'x',
    match: host => host === 'x.com' || host.includes('twitter.com'),
    messageSelectors: ['[data-testid="messageEntry"] [dir="auto"]', '[data-testid="tweetText"]'],
    bubbleSelectors: ['[data-testid="messageEntry"]'],
    composerSelectors: ['div[data-testid="dmComposerTextInput"][contenteditable="true"]', 'div[role="textbox"][contenteditable="true"]'],
    sendSelectors: ['button[data-testid="dmComposerSendButton"]', 'button[aria-label="Send"]']
  },
  {
    id: 'googlechat',
    match: host => host.includes('chat.google.com'),
    messageSelectors: ['[data-message-id] [dir="auto"]', '[role="main"] [data-message-id]'],
    bubbleSelectors: ['[data-message-id]'],
    composerSelectors: ['div[contenteditable="true"][role="textbox"]', 'textarea'],
    sendSelectors: ['button[aria-label*="Send"]']
  },
  {
    id: 'slack',
    match: host => host.endsWith('slack.com'),
    messageSelectors: ['[data-qa="message-text"]', '[data-qa="message_content"]', '[data-qa*="message"] [dir="auto"]'],
    bubbleSelectors: ['[data-qa="message_container"]', '[data-qa="virtual-list-item"]', '[role="listitem"]'],
    composerSelectors: ['[data-qa="message_input"] [contenteditable="true"]', '[data-qa="message_input"][contenteditable="true"]', 'div[role="textbox"][contenteditable="true"]'],
    sendSelectors: ['button[data-qa="texty_send_button"]', 'button[aria-label*="Send"]']
  },
  {
    id: 'googlemessages',
    match: host => host.includes('messages.google.com'),
    messageSelectors: ['[data-message-id] [dir="auto"]', 'mws-message-part-content', '[role="main"] [dir="auto"]'],
    bubbleSelectors: ['[data-message-id]', 'mws-message-part', '[role="listitem"]'],
    composerSelectors: ['textarea', 'div[contenteditable="true"][role="textbox"]', '[contenteditable="true"]'],
    sendSelectors: ['button[aria-label*="Send"]', 'button[title*="Send"]']
  },
  {
    id: 'linkedin',
    match: host => host.includes('linkedin.com'),
    messageSelectors: ['.msg-s-event-listitem__body', '.msg-s-message-list__event [dir="auto"]', '[data-event-urn] [dir="auto"]'],
    bubbleSelectors: ['.msg-s-message-list__event', '.msg-s-event-listitem', '[data-event-urn]'],
    composerSelectors: ['.msg-form__contenteditable[contenteditable="true"]', 'div[role="textbox"][contenteditable="true"]', 'textarea'],
    sendSelectors: ['button.msg-form__send-button', 'button[type="submit"][aria-label*="Send"]', 'button[aria-label*="Send"]']
  },
  {
    id: 'generic',
    match: () => true,
    messageSelectors: ['[data-message-text]', '.message-text', '.text-content'],
    bubbleSelectors: ['[data-message-id]', '.message', '[role="row"]'],
    composerSelectors: ['div[contenteditable="true"][role="textbox"]', 'textarea'],
    sendSelectors: ['button[aria-label="Send"]', 'button[type="submit"]']
  }
];

function rule() {
  const host = location.hostname;
  return SERVICE_RULES.find(r => r.match(host)) || SERVICE_RULES[SERVICE_RULES.length - 1];
}

const CONVERSATION_TITLE_SELECTORS = {
  telegram: [
    '.chat-info .peer-title',
    '.chat-info-container .peer-title',
    '.topbar .peer-title',
    '.chat-info .user-title',
    '.topbar .user-title',
    '.chat-info-container [class*="title"]',
    '.topbar [class*="title"]'
  ],
  whatsapp: [
    'header [data-testid="conversation-info-header-chat-title"]',
    'header span[title]',
    'header [dir="auto"]'
  ],
  messenger: [
    '[role="main"] header h1',
    '[role="main"] header h2',
    '[role="main"] [aria-label*="Conversation information"] + *',
    '[role="main"] a[role="link"] span[dir="auto"]'
  ],
  instagram: [
    'main header a[role="link"]',
    'main header [dir="auto"]',
    'main header h2'
  ],
  discord: [
    'main [class*="titleWrapper"] [class*="title"]',
    'main header [class*="title"]',
    '[aria-label*="Channel header"] [class*="title"]'
  ],
  x: [
    '[data-testid="DMDrawer"] header [dir="auto"]',
    'main header [dir="auto"]'
  ],
  googlechat: [
    'header [role="heading"]',
    'main [role="heading"]'
  ],
  slack: [
    '[data-qa="channel_name"]',
    '[data-qa="channel_header_name"]',
    'header [data-qa*="channel"]'
  ],
  googlemessages: [
    'header [role="heading"]',
    'main [role="heading"]',
    '[data-conversation-title]'
  ],
  linkedin: [
    '.msg-overlay-conversation-bubble__title',
    '.msg-entity-lockup__entity-title',
    '.msg-thread__link-to-profile'
  ],
  generic: [
    'main header h1',
    'main header h2',
    'header [role="heading"]'
  ]
};


function parseCompactUnread(value) {
  const text = String(value || '').trim().replace(/,/g, '');
  const match = text.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*([kKmM]?)(?:\s|$)/) || text.match(/(\d+(?:\.\d+)?)\s*([kKmM]?)/);
  if (!match) return 0;
  let number = Number(match[1] || 0);
  const suffix = String(match[2] || '').toLowerCase();
  if (suffix === 'k') number *= 1000;
  if (suffix === 'm') number *= 1000000;
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function unreadFromTitle() {
  const title = String(document.title || '');
  const match = title.match(/^\s*\((\d+)\)/) || title.match(/\((\d+)\)\s*$/);
  return match ? Math.max(0, Number(match[1] || 0)) : 0;
}

function unreadFromSelectors(selectors) {
  let total = 0;
  const seen = new Set();
  for (const selector of selectors) {
    let nodes = [];
    try { nodes = [...document.querySelectorAll(selector)]; } catch (_) { continue; }
    for (const node of nodes) {
      if (!node || seen.has(node) || !isVisible(node)) continue;
      seen.add(node);
      const raw = [
        node.getAttribute?.('aria-label'),
        node.getAttribute?.('title'),
        node.innerText,
        node.textContent
      ].filter(Boolean).join(' ');
      const count = parseCompactUnread(raw);
      if (count > 0 && count < 100000) total += count;
    }
  }
  return total;
}

function unreadConversationCountFromSelectors(selectors) {
  let total = 0;
  const seenNodes = new Set();
  const seenRows = new Set();
  for (const selector of selectors) {
    let nodes = [];
    try { nodes = [...document.querySelectorAll(selector)]; } catch (_) { continue; }
    for (const node of nodes) {
      if (!node || seenNodes.has(node) || !isVisible(node)) continue;
      seenNodes.add(node);
      const raw = [
        node.getAttribute?.('aria-label'),
        node.getAttribute?.('title'),
        node.innerText,
        node.textContent
      ].filter(Boolean).join(' ');
      const numeric = parseCompactUnread(raw);
      const saysUnread = /unread|new message/i.test(raw);
      if (!(numeric > 0 || saysUnread)) continue;
      const row = node.closest?.('.chatlist-chat, .Chat, [data-peer-id], [data-testid="cell-frame-container"], [role="row"], [role="listitem"]') || node;
      if (seenRows.has(row)) continue;
      seenRows.add(row);
      total += 1;
    }
  }
  return total;
}

function detectUnreadCount() {
  const titleCount = unreadFromTitle();
  const service = rule().id;
  let domCount = 0;
  if (service === 'telegram') {
    // Only explicit unread markers qualify. Generic .badge nodes can be
    // timestamps, verified marks, folder badges, or other decorations.
    domCount = unreadConversationCountFromSelectors([
      '#column-left .chatlist-chat .badge.unread',
      '#column-left .Chat .Badge.unread',
      '.chatlist .chatlist-chat .badge.unread',
      '.chatlist-chat .badge.unread',
      '.ChatFolders .Chat .Badge.unread',
      '[data-peer-id] .badge.unread',
      '#column-left .chatlist-chat [aria-label*="unread message"]',
      '#column-left .chatlist-chat [aria-label*="Unread message"]'
    ]);
  } else if (service === 'whatsapp') {
    domCount = unreadConversationCountFromSelectors([
      '[data-testid="cell-frame-container"] [data-testid="icon-unread-count"]',
      '[data-testid="cell-frame-container"] [aria-label*="unread"]',
      '[data-testid="cell-frame-container"] [aria-label*="Unread"]',
      '[role="grid"] [aria-label*="unread message"]',
      '[role="grid"] [aria-label*="Unread message"]'
    ]);
  } else if (service === 'messenger' || service === 'instagram' || service === 'facebook') {
    domCount = unreadConversationCountFromSelectors([
      '[aria-label*="unread"]', '[aria-label*="Unread"]', '[data-testid*="unread"]'
    ]);
  }
  if (service === 'telegram') return domCount;
  if (service === 'whatsapp' || service === 'messenger' || service === 'instagram' || service === 'facebook') {
    return domCount > 0 ? domCount : titleCount;
  }
  return Math.max(titleCount, domCount);
}

function reportUnread(force = false) {
  clearTimeout(unreadTimer);
  unreadTimer = setTimeout(() => {
    const count = detectUnreadCount();
    if (!force && count === lastUnreadCount) return;
    lastUnreadCount = count;
    try {
      ipcRenderer.sendToHost('lingua-unread-state', {
        service: rule().id,
        count,
        title: String(document.title || '').slice(0, 180)
      });
    } catch (_) {}
  }, 80);
}

function normalizeConversationTitle(value) {
  const title = cleanText(value).replace(/\s+/g, ' ').trim();
  if (!title || title.length < 2 || title.length > 160) return '';
  const lowered = title.toLowerCase();
  if ([
    'telegram', 'whatsapp', 'messenger', 'instagram', 'discord', 'google chat', 'slack', 'google messages', 'linkedin',
    'search', 'online', 'last seen recently', 'pinned message', 'messages'
  ].includes(lowered)) return '';
  return title;
}

function detectConversationTitle() {
  const service = rule().id;
  const selectors = CONVERSATION_TITLE_SELECTORS[service] || CONVERSATION_TITLE_SELECTORS.generic;
  for (const selector of selectors) {
    for (const el of document.querySelectorAll(selector)) {
      if (!isVisible(el)) continue;
      const title = normalizeConversationTitle(
        el.getAttribute?.('title') || el.getAttribute?.('aria-label') || el.innerText || el.textContent
      );
      if (title) return title;
    }
  }
  return '';
}

function stableConversationAttribute() {
  const composer = findComposer();
  const root = composer?.closest?.('[data-peer-id],[data-chat-id],[data-conversation-id],[data-thread-id],[data-channel-id]');
  if (!root) return '';
  for (const name of ['data-peer-id','data-chat-id','data-conversation-id','data-thread-id','data-channel-id']) {
    const value = cleanText(root.getAttribute?.(name));
    if (value) return `${name}:${value}`;
  }
  return '';
}

function conversationRouteIdentity(service) {
  const pathname = String(location.pathname || '');
  const search = String(location.search || '');
  const hash = String(location.hash || '');

  if (service === 'telegram' && hash && hash !== '#') return `route:${hash}`;
  if (service === 'discord' && /\/channels\//.test(pathname)) return `route:${pathname}`;
  if (service === 'instagram' && /\/direct\/t\//.test(pathname)) return `route:${pathname}`;
  if (service === 'messenger' && /\/t\//.test(pathname)) return `route:${pathname}`;
  if (service === 'x' && /\/messages\//.test(pathname)) return `route:${pathname}`;
  if (service === 'googlechat' && pathname && pathname !== '/') return `route:${pathname}${search}${hash}`;
  if (service === 'slack' && /\/client\//.test(pathname)) return `route:${pathname}`;
  if (service === 'googlemessages' && /\/web\/conversations\//.test(pathname)) return `route:${pathname}${search}`;
  if (service === 'linkedin' && /\/messaging\/(thread|conversation)\//.test(pathname)) return `route:${pathname}${search}`;

  const generic = `${pathname}${search}${hash}`;
  const genericNoise = new Set(['', '/', '/k/', '/a/', '/direct/inbox/']);
  return genericNoise.has(generic) ? '' : `route:${generic}`;
}

function detectConversationInfo() {
  const service = rule().id;
  const title = detectConversationTitle();
  const domId = stableConversationAttribute();
  const routeId = conversationRouteIdentity(service);
  const identity = domId || routeId || (title ? `title:${title.toLocaleLowerCase()}` : '');
  return {
    service,
    key: identity ? `${service}|${identity}` : '',
    title,
    route: `${location.pathname || ''}${location.search || ''}${location.hash || ''}`
  };
}

function reportConversation(force = false) {
  const info = detectConversationInfo();
  const signature = JSON.stringify(info);
  if (!force && signature === lastConversationSignature) return;
  lastConversationSignature = signature;
  try {
    ipcRenderer.sendToHost('lingua-conversation', info);
  } catch (_) {}
}

function cleanText(text) {
  return String(text || '').replace(/\u200b/g, '').replace(/\s+/g, ' ').trim();
}

function isVisible(el) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
}

function isAudioLikeMessage(node) {
  const bubble = findBubble(node);
  if (!bubble) return false;
  const text = cleanText(node.innerText || node.textContent);
  if (/^audio from\b/i.test(text) || /^voice message\b/i.test(text)) return true;
  // Messenger voice notes normally contain an audio element, waveform, play control,
  // or audio/voice-specific classes. Do not pretend these labels are translatable text.
  const audioUi = bubble.querySelector?.([
    'audio',
    '[class*=audio i]',
    '[class*=voice i]',
    '[class*=waveform i]',
    '[aria-label*=audio i]',
    '[aria-label*=voice i]',
    '[title*=audio i]',
    '[title*=voice i]'
  ].join(','));
  return Boolean(audioUi && text.length < 180);
}

function findMessageNodes() {
  const nodes = [];
  const seenBubbles = new Set();
  const composer = findComposer();
  for (const selector of rule().messageSelectors) {
    document.querySelectorAll(selector).forEach(node => {
      if (nodes.length >= 80 || !isVisible(node)) return;
      if (composer && (node === composer || composer.contains(node) || node.contains(composer))) return;
      if (node.closest('#lingua-native-chip, .lingua-inline-translation')) return;
      const text = cleanText(node.innerText || node.textContent);
      if (!text || text.length < 2 || text.length > 5000) return;
      const bubble = findBubble(node);
      if (isAudioLikeMessage(node)) return;
      if (seenBubbles.has(bubble)) return;
      seenBubbles.add(bubble);
      nodes.push(node);
    });
  }
  return nodes;
}

function findBubble(node) {
  for (const selector of rule().bubbleSelectors || []) {
    const bubble = node.closest(selector);
    if (bubble) return bubble;
  }
  return node.parentElement || node;
}

function isOutgoingMessage(node) {
  const bubble = findBubble(node);
  if (!bubble) return false;
  const service = rule().id;
  if (service === 'whatsapp') return Boolean(bubble.matches?.('.message-out') || bubble.closest?.('.message-out'));
  if (service === 'telegram') {
    const cls = String(bubble.className || '');
    if (/\b(is-out|outgoing|own|message-out|is-outgoing)\b/i.test(cls)) return true;
    if (bubble.matches?.('[data-outgoing="true"], [data-is-out="true"], [data-own="true"]')) return true;
    // WebK own bubbles are right aligned. Use geometry only as a conservative fallback.
    const rect = bubble.getBoundingClientRect?.();
    if (rect && rect.width > 0 && rect.left > (innerWidth * 0.42) && rect.right > (innerWidth * 0.72)) return true;
  }
  const cls = String(bubble.className || '');
  return /\b(outgoing|message-out|sent-by-me|from-me|own-message)\b/i.test(cls)
    || Boolean(bubble.matches?.('[data-outgoing="true"], [data-owner="self"], [data-testid*="outgoing"]'));
}

function makeRefreshButton(label = 'Refresh translation') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'lingua-refresh-translation';
  button.setAttribute('aria-label', label);
  button.title = label;
  button.textContent = '↻';
  Object.assign(button.style, {
    width: '22px',
    height: '22px',
    minWidth: '22px',
    padding: '0',
    margin: '0 0 0 6px',
    border: '0',
    borderRadius: '50%',
    background: 'transparent',
    color: '#cbd5e1',
    font: '700 17px/22px system-ui, sans-serif',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: '0.9'
  });
  button.addEventListener('mouseenter', () => { button.style.background = 'rgba(148,163,184,.16)'; });
  button.addEventListener('mouseleave', () => { button.style.background = 'transparent'; });
  return button;
}

function removeManualTranslateAction(node) {
  try { findBubble(node)?.querySelector(':scope > .lingua-translate-action')?.remove(); } catch (_) {}
}

function ensureManualTranslateAction(node) {
  if (!node?.isConnected || isOutgoingMessage(node)) return null;
  const bubble = findBubble(node);
  if (!bubble) return null;
  if (bubble.querySelector(':scope > .lingua-inline-translation')) {
    removeManualTranslateAction(node);
    return null;
  }
  let action = bubble.querySelector(':scope > .lingua-translate-action');
  if (action) return action;
  action = document.createElement('div');
  action.className = 'lingua-translate-action';
  Object.assign(action.style, {
    marginTop: '4px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: '22px'
  });
  const button = makeRefreshButton('Translate this message');
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    forceRefreshIncomingTranslation(node);
  }, true);
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    forceRefreshIncomingTranslation(node);
  }, true);
  action.appendChild(button);
  bubble.appendChild(action);
  return action;
}

function ensureTranslationRefreshButton(host, node) {
  if (!host) return null;
  let row = host.querySelector('.lingua-inline-actions');
  if (!row) {
    row = document.createElement('div');
    row.className = 'lingua-inline-actions';
    Object.assign(row.style, {
      marginTop: '3px',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      minHeight: '22px'
    });
    host.appendChild(row);
  }
  if (!row.querySelector('.lingua-refresh-translation')) {
    const button = makeRefreshButton('Refresh translation');
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      forceRefreshIncomingTranslation(node);
    }, true);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      forceRefreshIncomingTranslation(node);
    }, true);
    row.appendChild(button);
  }
  return row;
}

function ensureTranslationHost(node) {
  const bubble = findBubble(node);
  let existing = bubble.querySelector(':scope > .lingua-inline-translation');
  if (existing) {
    removeManualTranslateAction(node);
    return existing;
  }
  const div = document.createElement('div');
  div.className = 'lingua-inline-translation';
  Object.assign(div.style, {
    marginTop: '6px',
    padding: '7px 9px',
    borderLeft: '3px solid #60a5fa',
    borderRadius: '7px',
    background: 'rgba(15,23,42,.90)',
    boxShadow: '0 2px 10px rgba(0,0,0,.16)',
    color: '#e5efff',
    whiteSpace: 'pre-wrap',
    userSelect: 'text',
    maxWidth: '100%'
  });
  const meta = document.createElement('div');
  meta.className = 'lingua-inline-meta';
  Object.assign(meta.style, {
    font: '600 9px/1.2 system-ui, sans-serif',
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: '#93b8ef',
    marginBottom: '3px'
  });
  const body = document.createElement('div');
  body.className = 'lingua-inline-body';
  Object.assign(body.style, {
    font: '500 12.5px/1.42 system-ui, sans-serif',
    color: '#eef5ff',
    wordBreak: 'break-word'
  });
  div.append(meta, body);
  for (const eventName of ['pointerdown', 'mousedown', 'click', 'dblclick']) {
    div.addEventListener(eventName, event => event.stopPropagation(), true);
  }
  bubble.appendChild(div);
  removeManualTranslateAction(node);
  return div;
}

function setInlineTranslation(host, text, provider, node) {
  const meta = host.querySelector('.lingua-inline-meta');
  const body = host.querySelector('.lingua-inline-body');
  if (meta) meta.textContent = `Lingua · ${settings.incomingTargetLabel || String(settings.incomingTarget || '').toUpperCase()}`;
  if (body) body.textContent = String(text || '').trim();
  if (provider) host.title = `Translated by ${provider}`;
  ensureTranslationRefreshButton(host, node);
}

function currentConversationCacheScope() {
  try {
    const info = detectConversationInfo();
    return String(info?.key || '');
  } catch (_) {
    return '';
  }
}

function translationCacheKey(fp, targetLang = settings.incomingTarget || 'en', conversationKey = currentConversationCacheScope()) {
  return `${conversationKey || 'conversation:unknown'}\u0000${targetLang || 'en'}\u0000${fp}`;
}

function persistTranslationCache() {
  try {
    const entries = [...translationCache.entries()].slice(-TRANSLATION_CACHE_LIMIT);
    localStorage.setItem(TRANSLATION_CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch (_) {}
}

function loadTranslationCache() {
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY);
    const entries = JSON.parse(raw || '[]');
    if (!Array.isArray(entries)) return;
    translationCache.clear();
    for (const item of entries.slice(-TRANSLATION_CACHE_LIMIT)) {
      if (!Array.isArray(item) || item.length !== 2) continue;
      const [key, value] = item;
      if (typeof key !== 'string' || !value?.text) continue;
      translationCache.set(key, {
        text: String(value.text || '').trim(),
        provider: String(value.provider || '')
      });
    }
  } catch (_) {}
}

function rememberTranslation(fp, text, provider, targetLang = settings.incomingTarget || 'en', conversationKey = currentConversationCacheScope()) {
  const key = translationCacheKey(fp, targetLang, conversationKey);
  translationCache.delete(key);
  translationCache.set(key, {
    text: String(text || '').trim(),
    provider: String(provider || '')
  });
  while (translationCache.size > TRANSLATION_CACHE_LIMIT) {
    translationCache.delete(translationCache.keys().next().value);
  }
  persistTranslationCache();
}

function restoreCachedTranslation(node, fp, targetLang = settings.incomingTarget || 'en', conversationKey = currentConversationCacheScope()) {
  const cached = translationCache.get(translationCacheKey(fp, targetLang, conversationKey));
  if (!cached?.text || !node?.isConnected) return false;
  const host = ensureTranslationHost(node);
  setInlineTranslation(host, cached.text, cached.provider, node);
  return true;
}
function fingerprint(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return String(hash >>> 0);
}

function requestIncomingTranslation(node, priority = 'realtime', forceRetry = false, forceFresh = false) {
  if (!settings.isActive) return false;
  if (!settings.autoTranslateIncoming || !settings.showInlineTranslations) return false;
  if (node.closest('.lingua-inline-translation')) return false;
  if (!settings.translateOwnMessages && isOutgoingMessage(node)) return false;
  if (isAudioLikeMessage(node)) return false;
  const text = cleanText(node.innerText || node.textContent);
  if (!text || text.length < 2 || text.length > 5000) return false;

  const targetLang = settings.incomingTarget || 'en';
  const conversationKey = currentConversationCacheScope();
  const fp = fingerprint(text);
  const pendingKey = translationCacheKey(fp, targetLang, conversationKey);

  if (pendingIncomingFingerprints.has(pendingKey)) return false;

  // Normal scans restore cached cards and do not call the provider again.
  // Only the user's explicit refresh button invalidates this one cached result.
  if (!forceFresh && restoreCachedTranslation(node, fp, targetLang, conversationKey)) {
    clearTranslationFailure(fp, targetLang);
    node.dataset.linguaFingerprint = fp;
    return false;
  }
  if (forceFresh) {
    translationCache.delete(pendingKey);
    persistTranslationCache();
    clearTranslationFailure(fp, targetLang);
    node.dataset.linguaFingerprint = '';
  }

  // A matching fingerprint used to return unconditionally here. That meant a
  // transient failure could permanently suppress the card: the delayed retry
  // saw the same fingerprint and exited before sending another request. Keep
  // duplicates blocked while a request/backoff is active, but permit a real
  // retry once the delay has elapsed.
  if (node.dataset.linguaFingerprint === fp) {
    if (pendingIncomingFingerprints.has(pendingKey)) return false;
    if (translationRetryBlocked(fp, forceRetry, targetLang)) return false;
  }

  if (translationRetryBlocked(fp, forceRetry, targetLang)) {
    node.dataset.linguaFingerprint = fp;
    return false;
  }
  if (forceRetry) clearTranslationFailure(fp, targetLang);

  node.dataset.linguaFingerprint = fp;
  const id = `in_${Date.now()}_${++messageCounter}`;
  pendingIncoming.set(id, { node, fp, targetLang, pendingKey, conversationKey });
  pendingIncomingFingerprints.add(pendingKey);
  ipcRenderer.sendToHost('lingua-translate-request', {
    id,
    kind: 'incoming',
    text,
    // Auto-detect independently for every customer message. Mixed English,
    // Spanish, Chinese, etc. in the same conversation remains supported.
    sourceLang: 'auto',
    targetLang,
    priority: priority === 'history' ? 'history' : 'realtime'
  });
  return true;
}

function forceRefreshIncomingTranslation(node) {
  if (!node?.isConnected || !settings.isActive || !settings.showInlineTranslations) return false;
  const text = cleanText(node.innerText || node.textContent);
  if (!text || text.length < 2 || text.length > 5000 || isOutgoingMessage(node)) return false;
  const targetLang = settings.incomingTarget || 'en';
  const conversationKey = currentConversationCacheScope();
  const fp = fingerprint(text);
  const pendingKey = translationCacheKey(fp, targetLang, conversationKey);
  if (pendingIncomingFingerprints.has(pendingKey)) {
    ensureStatusChip('ဘာသာပြန်နေဆဲဖြစ်ပါတယ်…', 'info');
    return false;
  }
  translationCache.delete(pendingKey);
  persistTranslationCache();
  clearTranslationFailure(fp, targetLang);
  node.dataset.linguaFingerprint = '';
  try { findBubble(node)?.querySelector(':scope > .lingua-inline-translation')?.remove(); } catch (_) {}
  ensureStatusChip('Lingua: ပြန်လည်ဘာသာပြန်နေပါတယ်…', 'info', true);
  return requestIncomingTranslation(node, 'realtime', true, true);
}

function showSentTranslationCard(node, original, detectedSource, sentText) {
  if (!node?.isConnected || !settings.isActive || !settings.autoTranslateIncoming
    || !settings.showInlineTranslations || !settings.translateOwnMessages) return;
  const text = cleanText(node.innerText || node.textContent);
  if (text !== cleanText(sentText)) return;
  const targetLang = settings.incomingTarget || 'en';
  const sourceBase = String(detectedSource || '').toLowerCase().split('-')[0];
  const targetBase = String(targetLang).toLowerCase().split('-')[0];
  if (sourceBase && sourceBase === targetBase && cleanText(original)) {
    const fp = fingerprint(text);
    rememberTranslation(fp, original, 'original', targetLang);
    if (restoreCachedTranslation(node, fp, targetLang)) node.dataset.linguaFingerprint = fp;
  } else {
    requestIncomingTranslation(node, 'realtime');
  }
}

function watchSentTranslationCard(sentText, original, detectedSource, previousNodes) {
  if (!settings.translateOwnMessages || !settings.autoTranslateIncoming || !settings.showInlineTranslations) return;
  const conversationKey = detectConversationInfo().key;
  if (!conversationKey) return;
  const previous = previousNodes || new Set();
  let attempts = 0;
  const check = () => {
    if (!settings.isActive || detectConversationInfo().key !== conversationKey) return;
    const node = findMessageNodes().slice().reverse().find(item =>
      !previous.has(item) && isOutgoingMessage(item)
      && cleanText(item.innerText || item.textContent) === cleanText(sentText));
    if (node) return showSentTranslationCard(node, original, detectedSource, sentText);
    if (++attempts < 20) setTimeout(check, 150);
    else scanMessages(false);
  };
  setTimeout(check, 150);
}

function reportDiagnostics(messageCount) {
  if (!settings.isActive) return;
  try {
    ipcRenderer.sendToHost('lingua-adapter-status', {
      service: rule().id,
      host: location.hostname,
      messageCount: Number(messageCount || 0),
      composerFound: Boolean(findComposer())
    });
  } catch (_) {}
}

function clearMessageFingerprints() {
  for (const node of findMessageNodes()) {
    try { node.dataset.linguaFingerprint = ''; } catch (_) {}
  }
}

function scanMessages(force = false) {
  if (!settings.isActive) return;
  const found = findMessageNodes();
  reportDiagnostics(found.length);
  if (!settings.autoTranslateIncoming && !force) return;

  const conversationKey = currentConversationCacheScope();
  if (conversationKey && lastScanConversationKey !== conversationKey) lastScanConversationKey = conversationKey;
  const firstScan = conversationKey ? !primedConversationKeys.has(conversationKey) : false;

  if (force) {
    for (const node of found) {
      try { node.dataset.linguaFingerprint = ''; } catch (_) {}
    }
  }

  // First open of a conversation: restore already-translated messages locally.
  // Do not spend translation-provider requests on old history unless the user
  // explicitly enabled historical translation.
  if (firstScan) {
    for (const node of found) {
      const text = cleanText(node.innerText || node.textContent);
      if (!text || isAudioLikeMessage(node)) continue;
      const fp = fingerprint(text);
      if (restoreCachedTranslation(node, fp, settings.incomingTarget || 'en', conversationKey)) {
        node.dataset.linguaFingerprint = fp;
      } else if (!settings.autoTranslateHistorical && !force) {
        node.dataset.linguaFingerprint = fp;
        node.dataset.linguaSeenConversation = conversationKey;
        if (!isOutgoingMessage(node)) ensureManualTranslateAction(node);
      }
    }
    primedConversationKeys.add(conversationKey);
    if (!settings.autoTranslateHistorical && !force) return;
  }

  const newestFirst = found.slice().reverse();
  const realtimeBudget = force ? 5 : 3;
  let realtimeQueued = 0;
  for (const node of newestFirst) {
    if (realtimeQueued >= realtimeBudget) break;
    const text = cleanText(node.innerText || node.textContent);
    if (!text) continue;
    const fp = fingerprint(text);
    if (restoreCachedTranslation(node, fp, settings.incomingTarget || 'en', conversationKey)) {
      node.dataset.linguaFingerprint = fp;
      removeManualTranslateAction(node);
      continue;
    }
    if (!force && node.dataset.linguaSeenConversation === conversationKey && node.dataset.linguaFingerprint === fp) {
      if (!node.closest?.('.lingua-inline-translation')) ensureManualTranslateAction(node);
      continue;
    }
    if (requestIncomingTranslation(node, 'realtime', force)) {
      removeManualTranslateAction(node);
      node.dataset.linguaSeenConversation = conversationKey;
      realtimeQueued += 1;
    } else if (!isOutgoingMessage(node) && !node.closest?.('.lingua-inline-translation')) {
      ensureManualTranslateAction(node);
    }
  }

  if (settings.autoTranslateHistorical || force) {
    const historyBudget = force ? 14 : 7;
    let historyQueued = 0;
    for (const node of newestFirst) {
      if (historyQueued >= historyBudget) break;
      const text = cleanText(node.innerText || node.textContent);
      if (!text) continue;
      const fp = fingerprint(text);
      if (restoreCachedTranslation(node, fp, settings.incomingTarget || 'en', conversationKey)) {
        removeManualTranslateAction(node);
        continue;
      }
      if (!force && node.dataset.linguaSeenConversation === conversationKey && node.dataset.linguaFingerprint === fp) {
        if (!node.closest?.('.lingua-inline-translation')) ensureManualTranslateAction(node);
        continue;
      }
      if (requestIncomingTranslation(node, 'history', force)) {
        removeManualTranslateAction(node);
        node.dataset.linguaSeenConversation = conversationKey;
        historyQueued += 1;
      } else if (!isOutgoingMessage(node) && !node.closest?.('.lingua-inline-translation')) {
        ensureManualTranslateAction(node);
      }
    }
  }
}
function scheduleScan() {
  if (!settings.isActive || scanTimer) return;
  // Leading-edge throttling prevents Telegram's continuous DOM mutations from
  // postponing the scan forever. It also keeps UI clicks responsive by avoiding
  // a full message scan on every tiny mutation.
  scanTimer = setTimeout(() => {
    scanTimer = null;
    scanMessages(false);
  }, 70);
}

function composerScore(el) {
  if (!el || !isVisible(el)) return -9999;
  const rect = el.getBoundingClientRect();
  const cls = String(el.className || '');
  const label = cleanText([
    el.getAttribute?.('aria-label'),
    el.getAttribute?.('data-placeholder'),
    el.getAttribute?.('placeholder'),
    el.getAttribute?.('title')
  ].filter(Boolean).join(' ')).toLowerCase();
  let score = 0;
  if (/input-message-input|editable-message-text|composer_rich_textarea/.test(cls)) score += 120;
  if (/message|write|type|chat|send/.test(label)) score += 45;
  if (/search|find/.test(label) || el.closest?.('header, nav, [class*=search], [class*=Search]')) score -= 160;
  if (rect.top > innerHeight * 0.62) score += 55;
  if (rect.width > 180) score += 20;
  if (rect.height >= 24 && rect.height < 220) score += 10;
  if (document.activeElement === el || el.contains?.(document.activeElement)) score += 90;
  return score;
}

function findComposer() {
  const all = [];
  const seen = new Set();
  for (const selector of rule().composerSelectors) {
    for (const el of document.querySelectorAll(selector)) {
      if (seen.has(el) || !isVisible(el)) continue;
      seen.add(el);
      all.push(el);
    }
  }
  if (!all.length) return null;
  all.sort((a, b) => composerScore(b) - composerScore(a));
  return composerScore(all[0]) > -100 ? all[0] : null;
}

function findSendElement() {
  const composer = findComposer();
  const cRect = composer?.getBoundingClientRect?.();
  const candidates = [];
  for (const selector of rule().sendSelectors) {
    for (const raw of document.querySelectorAll(selector)) {
      const el = raw.closest?.('button, [role=button]') || raw;
      if (!isVisible(el) || el.id === 'lingua-send-shield') continue;
      if (!candidates.includes(el)) candidates.push(el);
    }
  }
  if (!candidates.length) return null;
  if (!cRect) return candidates[0];
  candidates.sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const ad = Math.abs((ar.left + ar.width / 2) - cRect.right) + Math.abs((ar.top + ar.height / 2) - (cRect.top + cRect.height / 2));
    const bd = Math.abs((br.left + br.width / 2) - cRect.right) + Math.abs((br.top + br.height / 2) - (cRect.top + cRect.height / 2));
    return ad - bd;
  });
  return candidates[0];
}

function composerText(el) {
  if (!el) return '';
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) return cleanText(el.value);
  return cleanText(el.innerText || el.textContent);
}

function dispatchComposerInput(el, text, inputType = 'insertText') {
  try {
    el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType, data: text || null }));
  } catch (_) {}
  try {
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType, data: text || null }));
  } catch (_) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
}

function selectComposerContents(el) {
  const sel = window.getSelection();
  if (!sel) return false;
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

function setComposerText(el, text) {
  if (!el) return false;
  const desired = String(text || '');
  const desiredClean = cleanText(desired);
  if (composerText(el) === desiredClean) return true;
  el.focus();

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, desired); else el.value = desired;
    dispatchComposerInput(el, desired, desired ? 'insertText' : 'deleteContentBackward');
    return composerText(el) === desiredClean;
  }

  // WhatsApp, Telegram and several Chromium messenger editors keep a separate
  // application draft state. Replace the *entire* editable selection in one
  // editing operation instead of delete + insert, which can make WhatsApp merge
  // the old draft with the translated draft and send both strings together.
  selectComposerContents(el);
  if (rule().id === 'whatsapp') {
    // Chromium's native edit command updates WhatsApp's controlled draft in
    // the same path as typing. One selected replacement; never retry/append.
    try { webFrame.insertText(desired); } catch (_) { return false; }
    return composerText(el) === desiredClean;
  }
  let ok = false;
  try {
    ok = desired ? document.execCommand('insertText', false, desired) : document.execCommand('delete', false);
  } catch (_) {}
  if (!ok) {
    // Direct DOM writes bypass WhatsApp's controlled draft state. Leave the
    // editor untouched and fail closed instead of risking a mismatched send.
    return false;
  }
  // execCommand dispatches the browser's own editing events. A second,
  // synthetic beforeinput/input sequence can make a controlled WhatsApp
  // editor replay the same draft several times. Never retry an insertion
  // into that editor: a failed equality check must stop the send.
  return composerText(el) === desiredClean;
}

function matchesSendTarget(target) {
  if (!(target instanceof Element)) return false;
  for (const selector of rule().sendSelectors) {
    if (target.matches(selector) || target.closest(selector)) return true;
  }
  // Telegram occasionally changes the exact send-button wrapper while keeping it
  // beside the composer. Only treat a generic button as Send when text exists.
  if (rule().id === 'telegram') {
    const composer = findComposer();
    const button = target.closest('button, [role="button"]');
    if (composer && button && composerText(composer)) {
      const label = cleanText(button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent).toLowerCase();
      if (/^(send|send message|发送|傳送|보내기|отправить)$/.test(label)) return true;
      const c = String(button.className || '');
      if (/\b(send|btn-send|send-button)\b/i.test(c)) return true;
    }
  }
  return false;
}

function clickSend() {
  bypassNextSendUntil = Date.now() + 2000;
  const found = findSendElement();
  if (found) {
    found.click();
    return true;
  }
  const composer = findComposer();
  if (composer) {
    composer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    composer.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
    return true;
  }
  return false;
}

function ensureStatusChip(message, tone = 'info', sticky = false) {
  let chip = document.getElementById('lingua-native-chip');
  if (!chip) {
    chip = document.createElement('div');
    chip.id = 'lingua-native-chip';
    Object.assign(chip.style, {
      position: 'fixed', bottom: '10px', left: '14px', zIndex: '2147483647',
      maxWidth: '460px', padding: '7px 10px', borderRadius: '10px',
      font: '12px/1.3 system-ui, sans-serif', boxShadow: '0 5px 24px rgba(0,0,0,.28)',
      pointerEvents: 'none', transition: 'opacity .2s ease'
    });
    document.documentElement.appendChild(chip);
  }
  const palette = tone === 'error'
    ? ['#3b0d14', '#fecdd3', '#7f1d1d']
    : tone === 'success'
      ? ['#052e1b', '#bbf7d0', '#166534']
      : ['#0f172a', '#dbeafe', '#1d4ed8'];
  chip.style.background = palette[0];
  chip.style.color = palette[1];
  chip.style.border = `1px solid ${palette[2]}`;
  chip.style.opacity = '1';
  chip.textContent = message;
  clearTimeout(statusChipTimer);
  if (!sticky) statusChipTimer = setTimeout(() => { if (chip) chip.style.opacity = '0'; }, 3200);
}

function directSendEnabled() {
  return Boolean(settings.isActive && settings.translateBeforeSending && settings.interceptNativeComposer);
}

function reportDirectSendState() {
  const composer = findComposer();
  const active = document.activeElement;
  composerFocused = Boolean(composer && active && (active === composer || composer.contains(active)));
  try {
    ipcRenderer.send('lingua:guest-direct-send-state', {
      composerFocused,
      enabled: directSendEnabled()
    });
  } catch (_) {}
}

function ensureComposerTargetHint() {
  let hint = document.getElementById('lingua-composer-target-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'lingua-composer-target-hint';
    Object.assign(hint.style, {
      position: 'fixed', zIndex: '2147483645', pointerEvents: 'none',
      padding: '4px 8px', borderRadius: '8px',
      background: 'rgba(15,23,42,.88)', color: '#dbeafe',
      border: '1px solid rgba(96,165,250,.55)',
      font: '600 11px/1.2 system-ui, sans-serif',
      boxShadow: '0 2px 10px rgba(0,0,0,.18)', whiteSpace: 'nowrap'
    });
    document.documentElement.appendChild(hint);
  }
  const composer = findComposer();
  if (!directSendEnabled() || !composer || !isVisible(composer)) {
    hint.style.display = 'none';
    return;
  }
  const hasText = Boolean(composerText(composer));
  // v1.0.28 restores the old empty-composer language guide. It stays visible
  // while the empty box is focused, then disappears immediately when typing
  // starts so it never overlaps the user's message.
  if (hasText) {
    hint.style.display = 'none';
    return;
  }
  const rect = composer.getBoundingClientRect();
  const sourceLabel = settings.sourceLangLabel || (settings.sourceLang === 'auto' ? 'Auto detect' : String(settings.sourceLang || '').toUpperCase());
  const targetLabel = settings.outgoingTargetLabel || String(settings.outgoingTarget || '').toUpperCase();
  hint.textContent = `${sourceLabel} → ${targetLabel}`;
  hint.style.display = 'block';
  const width = Math.min(260, Math.max(150, hint.offsetWidth || 190));
  const left = Math.max(8, Math.min(innerWidth - width - 8, rect.right - width - 8));
  const top = Math.max(4, rect.top + Math.max(3, (rect.height - 24) / 2));
  hint.style.left = `${left}px`;
  hint.style.top = `${top}px`;
}

function ensureSendShield() {
  let shield = document.getElementById('lingua-send-shield');
  if (!shield) {
    shield = document.createElement('button');
    shield.id = 'lingua-send-shield';
    shield.type = 'button';
    shield.setAttribute('aria-label', 'Lingua translate and send');
    Object.assign(shield.style, {
      position: 'fixed', zIndex: '2147483646', opacity: '0.001',
      border: '0', margin: '0', padding: '0', background: '#000',
      cursor: 'pointer', display: 'none'
    });
    shield.addEventListener('pointerdown', event => {
      preventEvent(event);
      if (!outgoingBusy) requestOutgoingTranslation(null, 'send-shield-pointer');
    }, true);
    shield.addEventListener('mousedown', event => preventEvent(event), true);
    shield.addEventListener('click', event => {
      preventEvent(event);
      if (!outgoingBusy) requestOutgoingTranslation(null, 'send-shield-click');
    }, true);
    document.documentElement.appendChild(shield);
  }
  const composer = findComposer();
  const send = findSendElement();
  if (!directSendEnabled() || !composer || !composerText(composer) || !send || !isVisible(send)) {
    shield.style.display = 'none';
    return;
  }
  const rect = send.getBoundingClientRect();
  shield.style.display = 'block';
  shield.style.left = `${rect.left}px`;
  shield.style.top = `${rect.top}px`;
  shield.style.width = `${Math.max(26, rect.width)}px`;
  shield.style.height = `${Math.max(26, rect.height)}px`;
}

function updateComposerHint() {
  if (!settings.isActive) {
    try {
      document.getElementById('lingua-composer-target-hint')?.style.setProperty('display', 'none');
      document.getElementById('lingua-send-shield')?.style.setProperty('display', 'none');
    } catch (_) {}
    composerFocused = false;
    reportDirectSendState();
    return;
  }
  reportDirectSendState();
  ensureComposerTargetHint();
  ensureSendShield();
}

function preventEvent(event) {
  if (!event) return;
  if (typeof event.preventDefault === 'function') event.preventDefault();
  if (typeof event.stopPropagation === 'function') event.stopPropagation();
  if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
}

function requestOutgoingTranslation(event, trigger = 'send') {
  if (!settings.isActive || !directSendEnabled()) return false;

  // While the first key/pointer event is being translated, browsers can still
  // emit keypress/beforeinput/click for the same physical action. Those follow-up
  // events MUST also be cancelled. Returning without preventDefault here was the
  // cause of WhatsApp occasionally sending the original draft alongside the
  // translated draft.
  if (outgoingBusy || (Date.now() < suppressNativeUntil && Date.now() >= bypassNextSendUntil)) {
    preventEvent(event);
    return true;
  }
  // bypassNextSendUntil is set only for Lingua's own verified translated send.
  if (Date.now() < bypassNextSendUntil) return false;

  const composer = findComposer();
  if (!composer) return false;
  const text = composerText(composer);
  if (!text) return false;
  if (approvedOutgoingText && approvedOutgoingText === text) {
    approvedOutgoingText = '';
    if (approvedOutgoingCard?.sentText === text) {
      const existingNodes = new Set(findMessageNodes());
      watchSentTranslationCard(text, approvedOutgoingCard.original, approvedOutgoingCard.detectedSource, existingNodes);
    }
    approvedOutgoingCard = null;
    ensureStatusChip('Lingua: sending translated message', 'success');
    return false;
  }

  preventEvent(event);
  suppressNativeUntil = Date.now() + 900;
  outgoingBusy = true;
  ensureStatusChip('Lingua: translating before send…', 'info', true);

  // Clear immediately while the native send event is still being captured.
  // This prevents Telegram from sending the original source text if one of its
  // internal handlers runs after our capture listener. Restore on failure.
  setComposerText(composer, '');

  const id = `out_${Date.now()}_${++messageCounter}`;
  pendingOutgoing.set(id, { composer, original: text, trigger, cleared: true });
  ipcRenderer.sendToHost('lingua-translate-request', {
    id,
    kind: 'outgoing-native',
    text,
    sourceLang: settings.sourceLang || 'auto',
    targetLang: settings.outgoingTarget || 'en'
  });
  return true;
}

function onNativeBeforeInput(event) {
  if (!settings.translateBeforeSending || !settings.interceptNativeComposer) return;
  if (event.inputType !== 'insertParagraph' && event.inputType !== 'insertLineBreak') return;
  if (lastEnterHadShift) return;
  const composer = findComposer();
  if (!composer) return;
  if (event.target === composer || composer.contains(event.target)) requestOutgoingTranslation(event, 'beforeinput');
}

function onNativeKeypress(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
  const composer = findComposer();
  if (!composer) return;
  if (event.target === composer || composer.contains(event.target)) requestOutgoingTranslation(event, 'keypress');
}

function onNativeKeydown(event) {
  lastEnterHadShift = Boolean(event.shiftKey);
  if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
  const composer = findComposer();
  if (!composer) return;
  if (event.target === composer || composer.contains(event.target)) requestOutgoingTranslation(event, 'keydown');
}

function onNativePointerDown(event) {
  if (matchesSendTarget(event.target)) requestOutgoingTranslation(event, 'pointerdown');
}

function onNativeClick(event) {
  if (matchesSendTarget(event.target)) requestOutgoingTranslation(event, 'click');
}

window.addEventListener('keydown', onNativeKeydown, true);
window.addEventListener('keypress', onNativeKeypress, true);
window.addEventListener('beforeinput', onNativeBeforeInput, true);
window.addEventListener('pointerdown', onNativePointerDown, true);
window.addEventListener('mousedown', onNativePointerDown, true);
window.addEventListener('click', onNativeClick, true);
document.addEventListener('focusin', () => setTimeout(updateComposerHint, 25), true);
document.addEventListener('focusout', () => setTimeout(updateComposerHint, 25), true);

ipcRenderer.on('lingua-native-enter', () => {
  requestOutgoingTranslation(null, 'chromium-before-input');
});

ipcRenderer.on('lingua-settings', (_event, next) => {
  const previous = settings;
  settings = { ...settings, ...(next || {}) };
  clearTimeout(scanTimer);
  if (!settings.isActive) {
    updateComposerHint();
    return;
  }

  const becameActive = !previous.isActive && settings.isActive;
  const translationChanged = previous.sourceLang !== settings.sourceLang
    || previous.incomingTarget !== settings.incomingTarget
    || previous.translateOwnMessages !== settings.translateOwnMessages
    || previous.showInlineTranslations !== settings.showInlineTranslations;
  const incomingEnabled = !previous.autoTranslateIncoming && settings.autoTranslateIncoming;

  if (translationChanged) clearMessageFingerprints();
  if (settings.autoTranslateIncoming && (becameActive || translationChanged || incomingEnabled)) {
    // Normal scan preserves existing message fingerprints. Do not force a full
    // history retranslation merely because the host UI rendered again.
    scanTimer = setTimeout(() => scanMessages(false), 280);
  } else {
    reportDiagnostics(findMessageNodes().length);
  }
  updateComposerHint();
  reportConversation(true);
});

ipcRenderer.on('lingua-rescan', (_event, payload) => {
  if (!settings.isActive) return;
  scanMessages(Boolean(payload?.force));
});

ipcRenderer.on('lingua-translation-result', async (_event, result) => {
  if (String(result.id || '').startsWith('in_')) {
    const pending = pendingIncoming.get(result.id);
    if (!pending) return;
    pendingIncoming.delete(result.id);
    const { node, fp, targetLang, pendingKey, conversationKey } = pending;
    pendingIncomingFingerprints.delete(pendingKey);
    if (!node.isConnected || node.dataset.linguaFingerprint !== fp) return;
    // Do not attach a late result to a different conversation after the user switches chats.
    if (conversationKey && conversationKey !== currentConversationCacheScope()) return;
    // A result from a previous language selection must never be inserted into
    // the newly selected target-language card/cache.
    if (targetLang !== (settings.incomingTarget || 'en')) return;
    if (!result.ok) {
      const message = result.error || 'translation failed';
      rememberTranslationFailure(fp, message, targetLang);
      // Preserve the fingerprint. Clearing it here caused every Telegram/
      // WhatsApp DOM mutation to re-submit the same failed card indefinitely.
      node.dataset.linguaFingerprint = fp;
      ensureManualTranslateAction(node);
      ensureStatusChip('ဘာသာပြန်ခြင်းမအောင်မြင်ပါ — ↻ ကိုနှိပ်ပြီး ပြန်ကြိုးစားနိုင်ပါတယ်', 'info');
      try { ipcRenderer.sendToHost('lingua-translation-error', { kind:'incoming', error:message }); } catch (_) {}
      const retry = failureBackoffFor(fp, targetLang);
      if (retry && node.isConnected) {
        const delay = Math.max(1000, Number(retry.nextRetryAt || 0) - Date.now());
        setTimeout(() => {
          if (!node.isConnected || !settings.isActive || !settings.autoTranslateIncoming) return;
          requestIncomingTranslation(node, 'realtime', false);
        }, delay + 150);
      }
      return;
    }
    clearTranslationFailure(fp, targetLang);
    rememberTranslation(fp, result.translatedText, result.provider, targetLang, conversationKey);
    const host = ensureTranslationHost(node);
    setInlineTranslation(host, result.translatedText, result.provider, node);
    return;
  }

  if (String(result.id || '').startsWith('out_')) {
    const pending = pendingOutgoing.get(result.id);
    if (!pending) return;
    pendingOutgoing.delete(result.id);
    outgoingBusy = false;
    // The first native send gesture has completed. Allow a deliberate second
    // press in confirm-before-send mode immediately after the translation arrives.
    suppressNativeUntil = 0;
    if (!result.ok) {
      const composer = findComposer() || pending.composer;
      if (composer && pending.original) setComposerText(composer, pending.original);
      ensureStatusChip('ဘာသာပြန်ခြင်းမအောင်မြင်ပါ', 'info');
      return;
    }
    const composer = findComposer() || pending.composer;
    if (!composer) {
      ensureStatusChip('စာပို့ခြင်း မအောင်မြင်ပါ', 'info');
      return;
    }
    const translatedText = String(result.translatedText || '');
    const expectedText = cleanText(translatedText);
    if (!expectedText) {
      const originalBox = findComposer() || composer;
      if (originalBox) setComposerText(originalBox, pending.original || '');
      ensureStatusChip('ဘာသာပြန်ခြင်းမအောင်မြင်ပါ', 'info');
      return;
    }
    setComposerText(composer, translatedText);
    // WhatsApp may reconcile its controlled draft on the next renderer tick.
    // Wait for that one edit to settle before checking; never insert twice.
    if (rule().id === 'whatsapp') await new Promise(resolve => setTimeout(resolve, 100));
    if (composerText(composer) !== expectedText) {
      setComposerText(composer, pending.original || '');
      approvedOutgoingText = '';
      ensureStatusChip('စာပို့ခြင်း မအောင်မြင်ပါ', 'info');
      try { ipcRenderer.sendToHost('lingua-translation-error', { kind:'send', error:'composer replacement verification failed' }); } catch (_) {}
      return;
    }
    if (settings.confirmBeforeSend) {
      approvedOutgoingText = expectedText;
      approvedOutgoingCard = { sentText: expectedText, original: pending.original, detectedSource: result.detectedSource };
      ensureStatusChip('Lingua: translated. Press Send/Enter again to send.', 'success', true);
    } else {
      approvedOutgoingText = '';
      approvedOutgoingCard = null;
      ensureStatusChip('Lingua: translated and sending…', 'success');
      setTimeout(() => {
        const active = findComposer() || composer;
        if (!active || composerText(active) !== expectedText) {
          if (active) setComposerText(active, pending.original || '');
          ensureStatusChip('စာပို့ခြင်း မအောင်မြင်ပါ', 'info');
          return;
        }
        const existingNodes = new Set(findMessageNodes());
        if (clickSend()) watchSentTranslationCard(expectedText, pending.original, result.detectedSource, existingNodes);
        setTimeout(updateComposerHint, 120);
      }, 220);
    }
  }
});

ipcRenderer.on('lingua-insert-text', (_event, payload) => {
  const composer = findComposer();
  if (!composer) {
    ipcRenderer.sendToHost('lingua-composer-result', { ok: false, error: 'Message composer not found on this page.' });
    return;
  }
  setComposerText(composer, String(payload.text || ''));
  if (payload.sendNow) clickSend();
  ipcRenderer.sendToHost('lingua-composer-result', { ok: true, sent: Boolean(payload.sendNow) });
});

window.addEventListener('DOMContentLoaded', () => {
  loadTranslationCache();
  const observer = new MutationObserver(() => {
    reportUnread();
    if (!settings.isActive) return;
    scheduleScan();
    clearTimeout(uiAssistTimer);
    uiAssistTimer = setTimeout(() => {
      updateComposerHint();
      reportConversation();
    }, 40);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  reportUnread(true);
  if (settings.isActive) scheduleScan();
  setTimeout(() => { reportUnread(true); if (settings.isActive) { scanMessages(false); updateComposerHint(); reportConversation(true); } }, 800);
  // Keep the frequently-running loop lightweight. Full message discovery is
  // deliberately moved to a slower diagnostics timer so clicking/switching chats
  // does not compete with repeated DOM-wide scans.
  setInterval(() => {
    reportUnread();
    if (!settings.isActive) return;
    updateComposerHint();
    reportConversation();
  }, 800);
  setInterval(() => {
    if (!settings.isActive || document.hidden) return;
    reportDiagnostics(findMessageNodes().length);
  }, 3500);
});
