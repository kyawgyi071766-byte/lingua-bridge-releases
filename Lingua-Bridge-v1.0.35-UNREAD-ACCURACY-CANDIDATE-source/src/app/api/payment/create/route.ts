import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/security';
import { createOrReusePayment, isPaidPlan, paymentWindowMs } from '@/lib/cryptoPayments';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  if (user.suspended) {
    return NextResponse.json(
      { error: 'Your account is temporarily suspended. Contact support before making a new payment.' },
      { status: 403 }
    );
  }

  const rate = await consumeRateLimit('payment-create', user.id, 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many payment requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const plan = body?.plan;
  if (!isPaidPlan(plan)) return NextResponse.json({ error: 'Choose Pro or Business.' }, { status: 400 });
  if (user.plan === 'business' && plan === 'pro') {
    return NextResponse.json({ error: 'Business accounts cannot be downgraded through a new payment.' }, { status: 400 });
  }

  try {
    const { payment, walletAddress, network, reused } = await createOrReusePayment(user.id, plan);
    return NextResponse.json({
      ok: true,
      reused,
      payment: {
        id: payment.id,
        plan: payment.plan,
        amount: Number(payment.amount).toFixed(2),
        chain: payment.chain,
        network,
        address: walletAddress,
        claimedAt: payment.claimedAt.toISOString(),
        verifyWindowEndsAt: new Date(payment.claimedAt.getTime() + paymentWindowMs()).toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create payment instructions.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
