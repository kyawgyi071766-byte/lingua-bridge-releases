import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/security';
import { activatePayment, findMatchingTransfer } from '@/lib/cryptoPayments';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const rate = await consumeRateLimit('payment-check', user.id, 12, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Please wait a moment before checking again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const paymentId = typeof body?.paymentId === 'string' ? body.paymentId : '';
  if (!paymentId) return NextResponse.json({ error: 'Payment id is required.' }, { status: 400 });

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId: user.id } });
  if (!payment) return NextResponse.json({ error: 'Payment claim not found.' }, { status: 404 });

  if (payment.status === 'confirmed') {
    const refreshed = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true, paidUntil: true } });
    return NextResponse.json({ ok: true, confirmed: true, plan: refreshed?.plan, paidUntil: refreshed?.paidUntil?.toISOString() ?? null });
  }
  if (payment.status !== 'pending') {
    return NextResponse.json({ ok: true, confirmed: false, message: 'not detected yet' });
  }

  try {
    const transfer = await findMatchingTransfer(payment);
    if (!transfer) return NextResponse.json({ ok: true, confirmed: false, message: 'not detected yet' });

    const duplicate = await prisma.payment.findFirst({
      where: { txHash: transfer.txHash, id: { not: payment.id } },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({
        ok: true,
        confirmed: false,
        message: 'A matching transfer was found but is already linked to another payment. Contact support with the transaction hash.',
      });
    }

    const activated = await activatePayment(payment.id, transfer.txHash);
    return NextResponse.json({
      ok: true,
      confirmed: true,
      txHash: transfer.txHash,
      plan: activated.user?.plan,
      paidUntil: activated.user?.paidUntil?.toISOString() ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification is temporarily unavailable.';
    return NextResponse.json({
      error: `${message} Your account has not been changed or suspended. Please try again later.`,
    }, { status: 502 });
  }
}
