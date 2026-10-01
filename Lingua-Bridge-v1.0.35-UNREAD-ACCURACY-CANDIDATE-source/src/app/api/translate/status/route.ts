import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { translationProviderStatus } from '@/lib/translator';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  return NextResponse.json({ ok: true, ...translationProviderStatus() });
}
