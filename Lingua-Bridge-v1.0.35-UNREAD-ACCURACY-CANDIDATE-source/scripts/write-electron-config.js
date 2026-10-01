const fs = require('fs');
const path = require('path');

const value = (process.env.SERVER_URL || '').trim();
if (!/^https:\/\//i.test(value) || value.includes('your-domain.com')) {
  console.error('SERVER_URL must be a real https:// production URL before building the desktop app.');
  process.exit(1);
}
fs.writeFileSync(path.join(__dirname, '..', 'electron', 'runtime-config.json'), JSON.stringify({ serverUrl: value }, null, 2));
console.log(`Embedded desktop SERVER_URL: ${value}`);
