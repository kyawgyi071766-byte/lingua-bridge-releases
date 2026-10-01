import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DOWNLOAD_COOKIE, downloadGateConfigured, downloadsArePublic, downloadUrl, verifyDownloadCookie } from '@/lib/downloadAccess';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!downloadGateConfigured()) return NextResponse.json({ error: 'Downloads are not configured yet.' }, { status: 503 });
  const store = await cookies();
  const isPublic = downloadsArePublic();
  if (!isPublic && !verifyDownloadCookie(store.get(DOWNLOAD_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Download access required.' }, { status: 401 });
  }
  const platform = new URL(req.url).searchParams.get('platform');
  const url = downloadUrl(platform);
  if (!url) return NextResponse.json({ error: 'This platform build is not available yet.' }, { status: 404 });
  const response = NextResponse.redirect(url, 307);
  if (isPublic) response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
  else response.headers.set('Cache-Control', 'no-store');
  return response;
}
