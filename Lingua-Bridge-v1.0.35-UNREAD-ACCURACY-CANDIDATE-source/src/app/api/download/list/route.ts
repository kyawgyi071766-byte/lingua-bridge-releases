import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  DOWNLOAD_COOKIE,
  downloadCatalog,
  downloadGateConfigured,
  downloadsArePublic,
  downloadUrl,
  verifyDownloadCookie,
} from '@/lib/downloadAccess';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!downloadGateConfigured()) {
    return NextResponse.json({ configured: false, authorized: false, downloads: [] });
  }
  const isPublic = downloadsArePublic();
  const store = await cookies();
  const authorized = isPublic || verifyDownloadCookie(store.get(DOWNLOAD_COOKIE)?.value);
  if (!authorized) return NextResponse.json({ configured: true, authorized: false, downloads: [] }, { status: 401 });

  return NextResponse.json({
    configured: true,
    public: isPublic,
    authorized: true,
    downloads: downloadCatalog().map((item) => ({
      ...item,
      // Public mode sends the browser directly to the configured HTTPS release asset
      // (for example GitHub Releases) so the large binary is never proxied through Vercel.
      href: item.available
        ? (isPublic ? downloadUrl(item.id) : `/api/download/file?platform=${item.id}`)
        : null,
    })),
  }, {
    headers: isPublic
      ? { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
      : { 'Cache-Control': 'no-store' },
  });
}
