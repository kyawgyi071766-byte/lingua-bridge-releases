import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { stripe, stripeConfigured, legacyStripeEnabled } from '@/lib/stripe';
import { consumeRateLimit } from '@/lib/rateLimit';
import { getSiteUrl, isCrossSiteRequest } from '@/lib/security';

export async function POST(req: Request) {
  if (!legacyStripeEnabled) return NextResponse.json({ error: 'Legacy Stripe billing is disabled. Use crypto billing.' }, { status: 410 });
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  if (!stripeConfigured) return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 });
  if (!user.stripeCustomerId) return NextResponse.json({ error: 'No Stripe billing account is connected to this account yet.' }, { status: 400 });

  const rate = await consumeRateLimit('billing-portal-user', user.id, 15, 10 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many billing requests. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getSiteUrl()}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe billing portal error:', error);
    return NextResponse.json({ error: 'Could not open the billing portal. Please try again.' }, { status: 500 });
  }
}
