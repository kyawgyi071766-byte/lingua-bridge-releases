const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');

const checks = [
  ['Burmese interface option is available', app.includes('value="my"') && app.includes('>မြန်မာ</option>')],
  ['English, Burmese and Simplified Chinese are explicitly supported', app.includes("['en', 'my', 'zh-CN'].includes(selected)")],
  ['account footer expand label has Burmese translation', app.includes('"Expand messaging account sidebar": "စာတိုအကောင့်ဘေးဘားကို ချဲ့ရန်"')],
  ['account footer collapse label has Burmese translation', app.includes('"Collapse messaging account sidebar": "စာတိုအကောင့်ဘေးဘားကို ခေါက်ရန်"')],
  ['account footer add button has Burmese translation', app.includes('"Add messaging account": "စာတိုအကောင့် ထည့်ရန်"')],
  ['original text is preserved across language switches', app.includes('const uiTextSource = new WeakMap()') && app.includes('previous && current === previous.translated ? previous.source : current')],
  ['dynamic text and attributes are observed', app.includes('new MutationObserver(records =>') && app.includes('characterData: true') && app.includes("attributeFilter: ['title', 'aria-label', 'placeholder']")],
  ['language selection applies immediately without rerender', /#uiLanguage[\s\S]{0,420}applyUiLanguage\(\);\s*\}\);/.test(app) && !/#uiLanguage[\s\S]{0,420}render\(\)/.test(app)],
  ['observer translates inserted footer controls', app.includes('record.addedNodes.forEach(node => translateUiSubtree(node, activeDict))')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
