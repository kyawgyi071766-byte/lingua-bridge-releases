const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const appSource = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8')
  .replace(/^import\s+['\"]\.\/styles\.css['\"];?\s*/m, '');
fs.writeFileSync(path.join(dist, 'app.js'), appSource);
fs.copyFileSync(path.join(root, 'src', 'styles.css'), path.join(dist, 'styles.css'));
fs.copyFileSync(path.join(root, 'src', 'lingua-logo.png'), path.join(dist, 'lingua-logo.png'));
fs.writeFileSync(path.join(dist, 'index.html'), `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https: data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' https:; frame-src https:;">\n  <title>Lingua Bridge</title>\n  <link rel="stylesheet" href="./styles.css" />\n</head>\n<body>\n  <div id="app"></div>\n  <script type="module" src="./app.js"></script>\n</body>\n</html>\n`);
console.log('Built static renderer into dist/');
