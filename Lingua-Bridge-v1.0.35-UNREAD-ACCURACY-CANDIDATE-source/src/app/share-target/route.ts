import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const rawText = form?.get('text') ?? form?.get('title') ?? '';
  const text = typeof rawText === 'string' ? Array.from(rawText).slice(0, 5000).join('') : '';
  const user = await getCurrentUser();
  const destination = user ? '/dashboard/share' : '/login?next=/dashboard/share';
  const safeText = JSON.stringify(text).replace(/</g, '\\u003c');
  const safeDestination = JSON.stringify(destination).replace(/</g, '\\u003c');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Lingua</title></head><body><script>sessionStorage.setItem('lingua_shared_text',${safeText});location.replace(${safeDestination});</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
