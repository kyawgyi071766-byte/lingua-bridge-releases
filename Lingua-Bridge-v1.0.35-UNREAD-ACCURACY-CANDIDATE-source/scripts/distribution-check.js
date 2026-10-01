const fs = require('fs');
const required = [
  'public/manifest.json',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/apple-touch-icon.png',
  'src/app/install/page.tsx',
  'src/app/downloads/page.tsx',
  'src/app/robots.ts',
  'src/app/sitemap.ts',
  'src/app/api/download/access/route.ts',
  '.github/workflows/build-test-installers.yml',
  'vercel.json',
];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error('Distribution files missing:', missing.join(', '));
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
if (manifest.display !== 'standalone' || !Array.isArray(manifest.icons) || manifest.icons.length < 2) {
  console.error('PWA manifest is incomplete.');
  process.exit(1);
}
const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
const home = fs.readFileSync('src/app/page.tsx', 'utf8');
const downloads = fs.readFileSync('src/app/downloads/page.tsx', 'utf8');
const robots = fs.readFileSync('src/app/robots.ts', 'utf8');
const sitemap = fs.readFileSync('src/app/sitemap.ts', 'utf8');
const admin = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
const checks = [
  ['Canonical metadata is configured', /metadataBase/.test(layout) && /alternates/.test(home)],
  ['Open Graph metadata is configured', /openGraph/.test(layout)],
  ['Google verification is configurable', /GOOGLE_SITE_VERIFICATION/.test(layout)],
  ['Home page publishes SoftwareApplication data', /SoftwareApplication/.test(home)],
  ['Current v1.0.22 public release is visible', /v1\.0\.22 Global Public Release/.test(home)],
  ['Official pricing is visible', /9 USDT/.test(home) && /29 USDT/.test(home)],
  ['Public downloads are indexable', /robots:\s*\{\s*index:\s*true/.test(downloads)],
  ['Robots allows downloads', robots.includes("'/downloads'")],
  ['Sitemap includes downloads', sitemap.includes('`${site}/downloads`')],
  ['Owner admin is noindex', /robots:\s*\{\s*index:\s*false/.test(admin)],
  ['Billing and dashboard are noindex', /robots:\s*\{\s*index:\s*false/.test(fs.readFileSync('src/app/billing/page.tsx', 'utf8')) && /robots:\s*\{\s*index:\s*false/.test(fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8'))],
];
for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`Distribution check failed: ${label}`);
    process.exit(1);
  }
}
console.log('Distribution static checks passed.');
