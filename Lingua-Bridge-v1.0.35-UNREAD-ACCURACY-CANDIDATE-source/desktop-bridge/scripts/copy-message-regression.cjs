const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../electron/service-preload.cjs'), 'utf8');

function functionSource(name) {
  const begin = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\\nfunction ', begin + 10);
  assert(begin >= 0 && end > begin, `${name} helper exists`);
  return source.slice(begin, end);
}

const COPY_REMOVE_SELECTOR = [
  'svg', 'button', 'script', 'style',
  'time, .time, .message-time, .messageTime, [class*="timestamp"], [class*="message-time"], [data-testid*="timestamp"], [data-testid*="message-time"]',
  '#lingua-native-chip, #lingua-composer-target-hint, #lingua-send-shield, .lingua-inline-translation, .lingua-translate-action, .lingua-inline-actions, .lingua-refresh-translation'
].join(', ');

function cleanText(value) {
  return String(value || '').replace(/\\u200b/g, '').replace(/\\s+/g, ' ').trim();
}

// Exercise the real extraction helper with a lightweight clone mock that
// models native timestamps, the injected translation card, and SVG controls.
{
  const state = {
    text: 'Customer sentence\\nLingua · EN\\nTranslated sentence\\n10:42 PM',
    removed: new Set(),
  };
  const clone = {
    get innerText() {
      return state.removed.size >= 3 ? 'Customer sentence' : state.text;
    },
    textContent: 'Customer sentence Lingua · EN Translated sentence 10:42 PM',
    querySelectorAll(selector) {
      assert.match(selector, /svg/);
      assert.match(selector, /time/);
      assert.match(selector, /lingua-inline-translation/);
      return [
        { remove: () => state.removed.add('svg') },
        { remove: () => state.removed.add('card') },
        { remove: () => state.removed.add('time') },
      ];
    },
  };
  const context = vm.createContext({ COPY_REMOVE_SELECTOR, cleanText });
  vm.runInContext(functionSource('extractMessageCopyText'), context);
  assert.equal(context.extractMessageCopyText({ cloneNode: () => clone }), 'Customer sentence');
}

// Exercise the actual copy handler's decisions with mocked selection endpoints.
{
  const context = vm.createContext({
    window: { getSelection: () => context.selection },
    elementFromCopyNode: node => node,
    isEditableCopyTarget: element => Boolean(element?.editable),
    findMessageTextNodeForCopy: element => element?.source || null,
    findBubble: node => node?.bubble || null,
    copyBubbleForPoint: (element, source) => element?.bubble || source?.bubble || null,
    extractMessageCopyText: sourceNode => sourceNode?.plainText || '',
    cleanText,
    isCopyDecorationElement: element => Boolean(element?.decoration),
    COPY_UI_SELECTOR: '.lingua-inline-translation, .lingua-translate-action, .lingua-inline-actions',
  });
  vm.runInContext(functionSource('sanitizeMessageCopy'), context);

  const bubble = {};
  const sourceNode = {
    plainText: 'Customer sent this sentence',
    bubble,
    contains: node => Boolean(node?.insideSource),
  };
  const plainStart = { source: sourceNode, bubble, insideSource: true };
  const plainEnd = { source: sourceNode, bubble, insideSource: true };
  let written = null;
  let prevented = false;
  let stopped = false;
  context.selection = {
    anchorNode: plainStart, focusNode: plainEnd, rangeCount: 1, isCollapsed: false,
    toString: () => 'Customer sent',
  };
  context.sanitizeMessageCopy({
    clipboardData: { setData: (type, value) => { assert.equal(type, 'text/plain'); written = value; } },
    preventDefault: () => { prevented = true; },
    stopImmediatePropagation: () => { stopped = true; },
    stopPropagation: () => {},
  });
  assert.equal(written, 'Customer sent');
  assert.equal(prevented, true);
  assert.equal(stopped, true);

  // When a selection drags through a timestamp or Lingua card, copy the clean
  // original message body instead of the mixed selection.
  written = null;
  prevented = false;
  stopped = false;
  const timestamp = { bubble, decoration: true };
  const cardEnd = { source: sourceNode, bubble, insideSource: false, decoration: true };
  context.selection = {
    anchorNode: plainStart, focusNode: cardEnd, rangeCount: 1, isCollapsed: false,
    toString: () => 'Customer sent this sentence\\nLingua · EN\\nTranslation\\n10:42 PM',
  };
  context.sanitizeMessageCopy({
    clipboardData: { setData: (_type, value) => { written = value; } },
    preventDefault: () => { prevented = true; },
    stopImmediatePropagation: () => { stopped = true; },
    stopPropagation: () => {},
  });
  assert.equal(written, 'Customer sent this sentence');
  assert.equal(prevented, true);

  // A deliberate selection that spans two real messages is left untouched.
  const otherBubble = {};
  const otherSource = {
    plainText: 'My own sent sentence',
    bubble: otherBubble,
    contains: node => Boolean(node?.insideSource),
  };
  written = null;
  prevented = false;
  context.selection = {
    anchorNode: plainStart,
    focusNode: { source: otherSource, bubble: otherBubble, insideSource: true },
    rangeCount: 1,
    isCollapsed: false,
    toString: () => 'Customer sentence\\nMy own sent sentence',
  };
  context.sanitizeMessageCopy({
    clipboardData: { setData: (_type, value) => { written = value; } },
    preventDefault: () => { prevented = true; },
    stopImmediatePropagation: () => {},
    stopPropagation: () => {},
  });
  assert.equal(written, null);
  assert.equal(prevented, false);
}

assert.match(source, /document\\.addEventListener\\('copy', sanitizeMessageCopy, true\\)/);
assert.match(source, /userSelect: 'none'/);
console.log('PASS clean message copy excludes Lingua UI, SVG controls, and timestamps');
console.log('PASS plain partial selections remain text-only and cross-message selections are not hijacked');
