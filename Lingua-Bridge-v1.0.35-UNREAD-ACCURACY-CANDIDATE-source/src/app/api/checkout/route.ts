import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, stripeConfigured, PRICE_IDS, paidPlan, legacyStripeEnabled } from '@/lib/stripe';
import { consumeRateLimit } from '@/lib/rateLimit';
import { getSiteUrl, isCrossSiteRequest } from '@/lib/security';

export async function POST(req: Request) {
  if (!legacyStripeEnabled) return NextResponse.json({ error: 'Legacy Stripe checkout is disabled. Use crypto billing.' }, { status: 410 });
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const rate = await consumeRateLimit('checkout-user', user.id, 10, 10 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many billing requests. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  }
  if (!stripeConfigured) return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 });
  if (user.stripeSubscriptionId) {
    return NextResponse.json({ error: 'A subscription already exists. Use the billing portal to change or cancel it.', manage: true }, { status: 409 });
  }

  const { searchParams } = new URL(req.url);
  const plan = paidPlan(searchParams.get('plan'));
  if (!plan) return NextResponse.json({ error: 'Choose a valid paid plan.' }, { status: 400 });
  const priceId = PRICE_IDS[plan];
  if (!priceId || !priceId.startsWith('price_') || priceId.startsWith('price_xxx')) {
    return NextResponse.json({ error: `Stripe price for ${plan} is not configured yet.` }, { status: 503 });
  }

  try {
    const siteUrl = getSiteUrl();
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create(
        { email: user.email, metadata: { userId: user.id } },
        { idempotencyKey: `lingua-customer-${user.id}` }
      );
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const checkoutBucket = Math.floor(Date.now() / (10 * 60_000));
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/billing?success=1`,
      cancel_url: `${siteUrl}/billing?canceled=1`,
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
      allow_promotion_codes: true,
    }, { idempotencyKey: `lingua-checkout-${user.id}-${plan}-${checkoutBucket}` });

    if (!session.url) return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 });
  }
}
