const fs = require('fs');
const app = fs.readFileSync('src/app.js','utf8');
const css = fs.readFileSync('src/styles.css','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const checks = [
  ['v1.0.19 marker', app.includes("v1.0.19") && pkg.version === '1.0.19'],
  ['pointer reorder used', app.includes("pointerdown") && app.includes("setPointerCapture") && app.includes("syncInstanceListDomOrder")],
  ['native DataTransfer drag removed', !app.includes("dataTransfer.setData('text/plain'")],
  ['downward index correction', app.includes("if (fromIndex < desiredIndex) desiredIndex -= 1")],
  ['order persists', app.includes("state.instances.splice(desiredIndex, 0, moved)") && app.includes("persist();")],
  ['drag does not render messenger', !/function bindInstanceDragDrop[\s\S]*?\n}\n/.exec(app)?.[0]?.includes('render();')],
  ['touch/pointer stable', css.includes('touch-action:none')],
  ['server url diagnostics', app.includes("provider-server-url") && app.includes("state.serverUrl = info.serverUrl")],
  ['Gemini provider status', app.includes("geminiConfigured") && app.includes("Gemini API")],
  ['Burmese broad language', app.includes('["my", "Myanmar / Burmese')],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
