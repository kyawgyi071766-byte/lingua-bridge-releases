import { NextResponse } from 'next/server';
import { getCurrentUser, isOwnerAdminUser } from '@/lib/auth';
import { translationProviderStatus } from '@/lib/translator';
import { getTranslationProviderUsageStatus } from '@/lib/translationProviderGuard';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  const status = { ok: true, ...translationProviderStatus() };
  // Keep operational usage and quota details private to the verified owner account.
  if (!isOwnerAdminUser(user)) {
    return NextResponse.json(status, { headers: { 'Cache-Control': 'no-store' } });
  }

  const providerUsage = await getTranslationProviderUsageStatus();
  return NextResponse.json(
    { ...status, providerUsage },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
