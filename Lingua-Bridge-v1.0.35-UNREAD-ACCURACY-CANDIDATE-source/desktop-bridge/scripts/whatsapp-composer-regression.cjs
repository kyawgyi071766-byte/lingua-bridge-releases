const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'electron', 'service-preload.cjs'), 'utf8');
const start = source.indexOf('function setComposerText(');
const end = source.indexOf('\nfunction matchesSendTarget(', start);
assert(start >= 0 && end > start);
const calls = [];
const editor = {
  textContent: 'Original draft',
  innerText: 'Original draft',
  focus() {},
  dispatchEvent(event) {
    calls.push(event.type);
    // WhatsApp's controlled draft may re-apply text when a synthetic
    // beforeinput is fired after execCommand already inserted it.
    if (event.type === 'beforeinput' && this.textContent) {
      this.textContent += this.textContent;
      this.innerText = this.textContent;
    }
  },
};
const context = {
  document: {
    execCommand(command, _ui, value) {
      calls.push(command);
      editor.textContent = command === 'insertText' ? value : '';
      editor.innerText = editor.textContent;
      return true;
    },
  },
  HTMLTextAreaElement: class {},
  HTMLInputElement: class {},
  selectComposerContents: () => true,
  rule: () => ({ id: 'telegram' }),
  cleanText: value => String(value || '').replace(/\s+/g, ' ').trim(),
  composerText: el => el.textContent,
  dispatchComposerInput: (...args) => editor.dispatchEvent({ type: 'beforeinput' }),
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
assert.equal(context.setComposerText(editor, 'Translated once'), true);
assert.equal(editor.textContent, 'Translated once');
assert.equal(calls.filter(call => call === 'insertText').length, 1);
assert.equal(calls.filter(call => call === 'beforeinput').length, 0);
console.log('PASS WhatsApp controlled composer replaces the draft once');

// A controlled WhatsApp editor can reject execCommand while accepting native
// text insertion. It must receive one replacement, never a second append.
const nativeCalls = [];
const nativeEditor = { textContent: 'Original draft', innerText: 'Original draft', focus() {} };
const nativeContext = {
  document: { execCommand() { throw new Error('execCommand must not be used for WhatsApp'); } },
  webFrame: { insertText(value) {
    nativeCalls.push(value);
    nativeEditor.textContent = value;
    nativeEditor.innerText = value;
  } },
  rule: () => ({ id: 'whatsapp' }),
  HTMLTextAreaElement: class {}, HTMLInputElement: class {},
  selectComposerContents: () => true,
  cleanText: value => String(value || '').replace(/\s+/g, ' ').trim(),
  composerText: el => el.textContent,
};
vm.createContext(nativeContext);
vm.runInContext(source.slice(start, end), nativeContext);
assert.equal(nativeContext.setComposerText(nativeEditor, 'Translated once'), true);
assert.equal(nativeEditor.textContent, 'Translated once');
assert.deepEqual(nativeCalls, ['Translated once']);
console.log('PASS WhatsApp native insertion replaces the selected draft once');
