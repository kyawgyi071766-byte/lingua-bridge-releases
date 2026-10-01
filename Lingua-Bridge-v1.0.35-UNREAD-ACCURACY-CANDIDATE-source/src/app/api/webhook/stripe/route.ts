import { NextResponse } from 'next/server';
import { stripe, paidPlan, planFromPriceId, legacyStripeEnabled } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

function customerIdOf(obj: any): string | null {
  if (typeof obj?.customer === 'string') return obj.customer;
  return typeof obj?.customer?.id === 'string' ? obj.customer.id : null;
}

function planOfSubscription(obj: any): 'pro' | 'business' | null {
  // The live subscription item is authoritative. Metadata may be stale after a
  // customer changes plans through the Stripe customer portal.
  const pricePlan = planFromPriceId(obj?.items?.data?.[0]?.price?.id);
  if (pricePlan) return pricePlan;
  return paidPlan(obj?.metadata?.plan);
}

async function updateByUserOrCustomer(userId: unknown, customerId: string | null, data: Record<string, unknown>) {
  if (typeof userId === 'string' && userId) {
    await prisma.user.updateMany({ where: { id: userId }, data });
    return;
  }
  if (customerId) await prisma.user.updateMany({ where: { stripeCustomerId: customerId }, data });
}

export async function POST(req: Request) {
  if (!legacyStripeEnabled) return NextResponse.json({ received: false, disabled: true }, { status: 410 });
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  const configured = secret.startsWith('whsec_') && !secret.startsWith('replace-');

  if (!configured) {
    console.error('STRIPE_WEBHOOK_SECRET is missing or invalid.');
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  try {
    const obj = event.data.object;

    if (event.type === 'checkout.session.completed') {
      const plan = paidPlan(obj?.metadata?.plan);
      const userId = obj?.metadata?.userId;
      if (plan && typeof userId === 'string') {
        await prisma.user.updateMany({
          where: { id: userId },
          data: {
            plan,
            grantType: 'purchase',
            accessCodeId: null,
            stripeCustomerId: customerIdOf(obj) || undefined,
            stripeSubscriptionId: typeof obj.subscription === 'string' ? obj.subscription : undefined,
          },
        });
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const status = String(obj?.status || '');
      const plan = planOfSubscription(obj);
      const customerId = customerIdOf(obj);
      const userId = obj?.metadata?.userId;

      if ((status === 'active' || status === 'trialing') && plan) {
        await updateByUserOrCustomer(userId, customerId, {
          plan,
          grantType: 'purchase',
          accessCodeId: null,
          stripeSubscriptionId: typeof obj?.id === 'string' ? obj.id : undefined,
          stripeCustomerId: customerId || undefined,
        });
      } else if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
        await updateByUserOrCustomer(userId, customerId, { plan: 'free', grantType: 'free', accessCodeId: null, stripeSubscriptionId: null });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      await updateByUserOrCustomer(obj?.metadata?.userId, customerIdOf(obj), { plan: 'free', grantType: 'free', accessCodeId: null, stripeSubscriptionId: null });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler error.' }, { status: 500 });
  }
}
