import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';
import { isCrossSiteRequest } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  await clearSession();
  return NextResponse.json({ ok: true });
}
