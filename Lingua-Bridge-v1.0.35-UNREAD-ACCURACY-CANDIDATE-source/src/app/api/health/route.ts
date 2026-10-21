import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    // Preview-only safety check: prove our test deployment targets the intended
    // isolated Neon database before allowing account-level end-to-end tests.
    // Do not disclose DB URLs, credentials, or hostnames in the response.
    if (process.env.VERCEL_ENV === 'preview' && process.env.LINGUA_PREVIEW_NEON_HOST) {
      const actualHost = new URL(process.env.DATABASE_URL || 'postgresql://missing@localhost/missing').hostname;
      const isolatedPreviewDatabase = actualHost === process.env.LINGUA_PREVIEW_NEON_HOST;
      return NextResponse.json(
        { status: 'ok', isolatedPreviewDatabase },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Healthcheck database error:', error);
    return NextResponse.json({ status: 'degraded' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
