import { NextResponse } from 'next/server';
import { getOwnerAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { activatePayment, findMatchingTransfer } from '@/lib/cryptoPayments';
import { isCrossSiteRequest } from '@/lib/security';

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const admin = await getOwnerAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const paymentId = typeof body?.paymentId === 'string' ? body.paymentId : '';
  const txHash = typeof body?.txHash === 'string' && body.txHash.trim() ? body.txHash.trim().slice(0, 160) : null;
  if (!paymentId) return NextResponse.json({ error: 'paymentId is required.' }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  if (payment.status === 'confirmed') {
    const user = await prisma.user.findUnique({ where: { id: payment.userId }, select: { plan: true, paidUntil: true } });
    return NextResponse.json({ ok: true, plan: user?.plan, paidUntil: user?.paidUntil?.toISOString() ?? null, alreadyConfirmed: true });
  }

  try {
    // Owner confirmation is still anchored to an independent chain lookup. A
    // screenshot, OCR result, or AI opinion alone can never activate a plan.
    const transfer = await findMatchingTransfer(payment);
    if (!transfer) {
      return NextResponse.json({ error: 'No matching confirmed blockchain transfer was found. Do not approve from a receipt image alone.' }, { status: 409 });
    }
    if (txHash && transfer.txHash.toLowerCase() !== txHash.toLowerCase()) {
      return NextResponse.json({ error: 'The supplied transaction hash does not match the independently detected payment.' }, { status: 409 });
    }

    const result = await activatePayment(paymentId, transfer.txHash);
    return NextResponse.json({
      ok: true,
      txHash: transfer.txHash,
      plan: result.user?.plan,
      paidUntil: result.user?.paidUntil?.toISOString() ?? null,
      alreadyConfirmed: result.alreadyConfirmed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not confirm payment.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
