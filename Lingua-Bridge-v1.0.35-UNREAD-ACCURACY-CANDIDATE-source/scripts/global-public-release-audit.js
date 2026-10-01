const fs = require('fs');
function read(p){ return fs.readFileSync(p,'utf8'); }
const layout=read('src/app/layout.tsx');
const page=read('src/app/page.tsx');
const downloads=read('src/app/downloads/page.tsx');
const robots=read('src/app/robots.ts');
const sitemap=read('src/app/sitemap.ts');
const list=read('src/app/api/download/list/route.ts');
const env=read('.env.example');
const checks=[
 ['SEO title is product-focused', layout.includes('Lingua Bridge — Desktop Messenger Translation')],
 ['SEO keywords include messenger and Burmese terms', layout.includes('WhatsApp translator') && layout.includes('Myanmar Burmese translator')],
 ['Google Search Console verification is configurable', layout.includes('GOOGLE_SITE_VERIFICATION') && env.includes('GOOGLE_SITE_VERIFICATION=')],
 ['public downloads are indexable', downloads.includes('robots: { index: true, follow: true }')],
 ['robots allows public downloads', robots.includes("'/downloads'") && !robots.includes("disallow: ['/admin', '/api/', '/billing', '/dashboard', '/downloads']")],
 ['sitemap includes downloads', sitemap.includes('`${site}/downloads`')],
 ['homepage advertises current release', page.includes('v1.0.22 Global Public Release')],
 ['public download bypasses Vercel binary proxy', list.includes('isPublic ? downloadUrl(item.id)')],
 ['public release mode documented', env.includes('DOWNLOAD_ACCESS_MODE=public')],
];
let failed=false;
for(const [label,ok] of checks){ console.log(`${ok?'PASS':'FAIL'} ${label}`); if(!ok) failed=true; }
if(failed) process.exit(1);
