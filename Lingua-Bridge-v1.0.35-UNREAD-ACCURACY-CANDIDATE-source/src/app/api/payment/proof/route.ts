import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { consumeRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/security';
import { activatePayment, cryptoConfig, findMatchingTransfer } from '@/lib/cryptoPayments';
import { reviewPaymentReceipt } from '@/lib/receiptVerification';

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function supportEmail() {
  return (process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'sshksshk2002@gmail.com').trim();
}

function safeReviewJson(review: unknown) {
  return JSON.parse(JSON.stringify(review));
}

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

  const rate = await consumeRateLimit('payment-proof', user.id, 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many receipt checks. Please wait a moment and try again.' }, {
      status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) },
    });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Could not read the receipt upload.' }, { status: 400 });
  const paymentId = String(form.get('paymentId') || '').trim();
  const file = form.get('receipt');
  if (!paymentId) return NextResponse.json({ error: 'Payment id is required.' }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a receipt image first.' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Receipt must be a JPG, PNG, or WebP image.' }, { status: 400 });
  if (file.size < 500 || file.size > MAX_RECEIPT_BYTES) return NextResponse.json({ error: 'Receipt image must be between 500 bytes and 5 MB.' }, { status: 400 });

  const payment = await prisma.payment.findFirst({ where: { id: paymentId, userId: user.id } });
  if (!payment) return NextResponse.json({ error: 'Payment claim not found.' }, { status: 404 });
  if (payment.status === 'confirmed') {
    return NextResponse.json({ ok: true, confirmed: true, plan: user.plan, message: `Payment is already confirmed. Refresh Lingua to load your ${user.plan} plan.` });
  }
  if (payment.status !== 'pending') return NextResponse.json({ error: 'This payment claim is no longer active.' }, { status: 409 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const receiptHash = createHash('sha256').update(bytes).digest('hex');
  const duplicateReceipt = await prisma.payment.findFirst({
    where: { receiptHash, id: { not: payment.id } }, select: { id: true, status: true, txHash: true },
  });

  const { network } = cryptoConfig();
  const review = await reviewPaymentReceipt({
    bytes,
    mimeType: file.type,
    expectedAmount: Number(payment.amount).toFixed(2),
    expectedNetwork: network,
    claimedAt: payment.claimedAt,
  });

  try {
    const transfer = await findMatchingTransfer(payment);
    if (transfer) {
      const duplicateTx = await prisma.payment.findFirst({
        where: { txHash: transfer.txHash, id: { not: payment.id } }, select: { id: true },
      });
      if (duplicateTx) {
        await prisma.payment.update({ where: { id: payment.id }, data: {
          receiptStatus: 'rejected_transaction_reuse', receiptReview: safeReviewJson(review), receiptSubmittedAt: new Date(),
        } });
        return NextResponse.json({ ok: true, confirmed: false, status: 'rejected', message: `This blockchain transaction has already been used for another payment. The plan was not changed. Contact ${supportEmail()} if you believe this is an error.` });
      }

      const activated = await activatePayment(payment.id, transfer.txHash);
      try {
        await prisma.payment.update({ where: { id: payment.id }, data: {
          receiptHash: duplicateReceipt ? null : receiptHash,
          receiptStatus: duplicateReceipt ? 'verified_onchain_duplicate_image' : 'verified_onchain',
          receiptReview: safeReviewJson(review), receiptSubmittedAt: new Date(),
        } });
      } catch (error) {
        console.error('Could not save receipt review metadata after on-chain confirmation:', error);
      }
      return NextResponse.json({
        ok: true,
        confirmed: true,
        plan: activated.user?.plan,
        paidUntil: activated.user?.paidUntil?.toISOString() ?? null,
        txHash: transfer.txHash,
        receiptVerdict: review.verdict,
        message: `Payment confirmed independently on-chain. Your ${activated.user?.plan || payment.plan} plan is active. Refresh Lingua now.`,
      });
    }

    if (duplicateReceipt) {
      return NextResponse.json({
        ok: true, confirmed: false, status: 'duplicate_receipt', receiptVerdict: review.verdict,
        message: `This exact receipt image was already submitted for another payment and cannot be reused. No matching payment was received for this claim. If you paid with a different transaction, upload its receipt or contact ${supportEmail()}.`,
      });
    }

    await prisma.payment.update({ where: { id: payment.id }, data: {
      receiptHash,
      receiptStatus: review.verdict === 'suspicious' ? 'screened_suspicious_unverified' : 'screened_unverified',
      receiptReview: safeReviewJson(review),
      receiptSubmittedAt: new Date(),
    } });

    const suspicious = review.verdict === 'suspicious';
    return NextResponse.json({
      ok: true, confirmed: false, status: suspicious ? 'suspicious_unverified' : 'pending_unverified', receiptVerdict: review.verdict,
      message: suspicious
        ? `The receipt image contains inconsistencies and no matching blockchain payment was found. It is not accepted as proof, and your plan was not changed. If you made a real payment, contact ${supportEmail()} with the transaction hash.`
        : `The receipt image was reviewed, but no matching blockchain payment has been found yet. A screenshot alone cannot confirm payment. Try “verify now” again shortly; if it still fails, contact ${supportEmail()} with the transaction hash.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification is temporarily unavailable.';
    return NextResponse.json({ error: `${message} The receipt alone was not used to activate a paid plan. Contact ${supportEmail()} if needed.` }, { status: 502 });
  }
}
