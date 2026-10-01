const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
  'package.json', 'src/app.js', 'src/styles.css',
  'electron/main.cjs', 'electron/host-preload.cjs', 'electron/service-preload.cjs',
  'scripts/build-static.cjs', 'scripts/validate.cjs'
];

let failed = false;
console.log(`Node ${process.version} · ${process.platform}/${process.arch}`);
const major = Number(process.versions.node.split('.')[0]);
if (major < 20) {
  console.error('FAIL Node.js 20 or newer is required.');
  failed = true;
} else {
  console.log('PASS Node.js version');
}
for (const rel of required) {
  const full = path.join(root, rel);
  const ok = fs.existsSync(full) && fs.statSync(full).size > 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${rel}`);
  if (!ok) failed = true;
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg?.build?.win?.target?.some?.(t => t.target === 'nsis')) console.log('PASS Windows NSIS target configured');
else { console.error('FAIL Windows NSIS target missing'); failed = true; }
console.log('INFO Real Gemini/Microsoft/Google/DeepL keys are intentionally NOT stored in this desktop source.');
console.log('INFO Test Mode can be used without API keys; Live Mode uses the Lingua server.');
if (failed) process.exit(1);
