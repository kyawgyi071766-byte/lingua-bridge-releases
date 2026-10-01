import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import { consumeRateLimit } from '@/lib/rateLimit';
import { getClientAddress, isCrossSiteRequest } from '@/lib/security';
import { prisma } from '@/lib/prisma';

interface SupportMessage {
  role: 'user' | 'assistant';
  content: string;
}

function supportEmail() {
  return (process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'sshksshk2002@gmail.com').trim();
}

function fallbackReply(message: string): string {
  const q = message.toLowerCase();
  const prices = `Free: $${PLANS.free.price}/month, Pro: $${PLANS.pro.price}/month, Business: $${PLANS.business.price}/month.`;
  if (/price|pricing|plan|cost|business|pro/.test(q)) {
    return `${prices} Pro includes ${PLANS.pro.monthlyChars.toLocaleString()} characters/month and Business includes ${PLANS.business.monthlyChars.toLocaleString()} characters/month.`;
  }
  if (/pay|payment|trust|wallet|usdt|crypto|upgrade/.test(q) && !/not detected|missing|verify/.test(q)) {
    return 'Open Billing, choose Pro or Business, and Lingua will show your exact USDT amount, network, and the owner Trust Wallet address. Send exactly that amount on the displayed network, then press “I have paid — verify now”.';
  }
  if (/not detected|missing|verify|pending|paid/.test(q)) {
    return `Blockchain indexing can take a little time. Keep the payment page open and press “I have paid — verify now” again after a short wait. You may also upload the receipt for AI-assisted screening, but a receipt image alone never activates a plan. Lingua requires an independent blockchain match. If it still is not detected, send your transaction hash and account email to ${supportEmail()} so a human can review it.`;
  }
  if (/human|agent|person|support|help/.test(q)) {
    return `A human can review your case. Please provide the transaction hash (if this is a payment issue) and the email address on your Lingua account. You can also contact ${supportEmail()}.`;
  }
  if (/suspend|fraud|blocked/.test(q)) {
    return 'Lingua does not automatically suspend accounts during payment verification. Suspension is only an admin action after proven fraud. If you believe your account was suspended incorrectly, contact support with your account email.';
  }
  return `I can help with payments, pricing, payment verification, and account support. ${prices} For payment issues, include your transaction hash and account email if you need human review.`;
}

function cleanHistory(value: unknown): SupportMessage[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).flatMap((item) => {
    const role = item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : null;
    const content = typeof item?.content === 'string' ? item.content.trim().slice(0, 1200) : '';
    return role && content ? [{ role, content }] : [];
  });
}

export async function POST(req: Request) {
  if (isCrossSiteRequest(req)) return NextResponse.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : '';
  if (!message) return NextResponse.json({ error: 'Message is required.' }, { status: 400 });

  const user = await getCurrentUser();
  const latestPayment = user ? await prisma.payment.findFirst({
    where: { userId: user.id },
    orderBy: { claimedAt: 'desc' },
    select: { status: true, plan: true, txHash: true, confirmedAt: true, claimedAt: true, receiptStatus: true },
  }).catch(() => null) : null;

  const paymentQuestion = /pay|payment|paid|receipt|proof|verify|upgrade|pro|business|plan/i.test(message);
  if (user && paymentQuestion && latestPayment?.status === 'confirmed' && user.plan !== 'free') {
    return NextResponse.json({
      ok: true,
      mode: 'verified-account-state',
      reply: `Your latest payment is confirmed and your ${user.plan} plan is active. Refresh/reload Lingua (or use Refresh plan) to load the updated plan. If it still does not appear after refreshing, contact ${supportEmail()}.`,
    });
  }
  if (user && paymentQuestion && latestPayment?.status === 'pending') {
    return NextResponse.json({
      ok: true,
      mode: 'verified-account-state',
      reply: `Your latest ${latestPayment.plan} payment is still pending; Lingua does not yet have an independently confirmed blockchain transfer for it. A receipt screenshot alone cannot activate the plan. Use “I have paid — verify now” or upload the receipt for screening, then refresh after confirmation. If it remains pending, contact ${supportEmail()} with the transaction hash.`,
    });
  }

  const identifier = user?.id || getClientAddress(req);
  const rate = await consumeRateLimit('support', identifier, 25, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many support messages. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ ok: true, reply: fallbackReply(message), mode: 'fallback' });

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  const model = (process.env.OPENAI_MODEL || 'gpt-4.1-mini').trim();
  const history = cleanHistory(body?.history);
  const configChain = (process.env.CRYPTO_CHAIN || 'tron').trim().toLowerCase() === 'bsc' ? 'USDT-BEP20' : 'USDT-TRC20';
  const prompt = [
    'You are Lingua customer support. Be concise, calm, accurate, and never claim that a blockchain payment is confirmed unless the Lingua payment verification endpoint has confirmed it.',
    `Exact plans: Free $${PLANS.free.price}/month (${PLANS.free.monthlyChars.toLocaleString()} chars/month); Pro $${PLANS.pro.price}/month (${PLANS.pro.monthlyChars.toLocaleString()} chars/month); Business $${PLANS.business.price}/month (${PLANS.business.monthlyChars.toLocaleString()} chars/month).`,
    `Payment method: USDT sent to the owner Trust Wallet. The Billing page creates a unique exact amount and displays the active network (${configChain}), wallet address, and a “I have paid — verify now” button. The checkout amount can include identification cents up to $0.99 above the listed base plan price. The customer must send the exact displayed amount on the exact displayed network.`,
    'Accounts are NEVER automatically suspended while a payment is being verified. A legitimate paying or verifying customer must not be disturbed or suspended. Suspension happens only manually by an admin after proven fraud.',
    'Once a payment is confirmed automatically on-chain or manually by an admin/support operator, Lingua immediately activates the selected paid plan for 30 days.',
    `If automatic verification misses a payment, ask the customer for the transaction hash and their Lingua account email, then direct them to human support at ${supportEmail()}.`,
    'Do not ask for wallet seed phrases, private keys, passwords, one-time codes, or card details. Never tell a user to share those secrets.',
    user ? `Current signed-in account context: email ${user.email}; current plan ${user.plan}; suspended ${user.suspended ? 'yes' : 'no'}; latest payment ${latestPayment ? `${latestPayment.status} for ${latestPayment.plan}` : 'none'}.` : 'The visitor is not signed in, so do not claim knowledge of their account status.',
    'A receipt screenshot can be edited or reused. Never treat an image alone as proof of payment. Paid-plan activation requires an independent blockchain match or explicit owner/admin verification.',
    `If the signed-in user has a confirmed paid plan, tell them to refresh/reload Lingua or use Refresh plan. If the plan still does not appear, direct them to ${supportEmail()}.`,
    `If the payment is pending or not detected, tell the customer that no confirmed payment is recorded yet. Ask them to use Billing verification/receipt review and, if needed, contact ${supportEmail()} with the transaction hash.`,
  ].join('\n');

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 350,
        messages: [
          { role: 'system', content: prompt },
          ...history,
          { role: 'user', content: message },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Support AI returned HTTP ${response.status}.`);
    const data = await response.json().catch(() => ({}));
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('Support AI returned an empty response.');
    return NextResponse.json({ ok: true, reply: content.trim(), mode: 'ai' });
  } catch (error) {
    console.error('Support AI error:', error);
    return NextResponse.json({ ok: true, reply: fallbackReply(message), mode: 'fallback' });
  }
}
