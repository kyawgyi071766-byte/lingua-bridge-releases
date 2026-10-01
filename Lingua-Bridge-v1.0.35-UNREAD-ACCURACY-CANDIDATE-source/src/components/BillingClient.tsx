'use client';

import { ChangeEvent, useState } from 'react';

type PaymentClaim = {
  id: string;
  plan: string;
  amount: string;
  chain: string;
  network: string;
  address: string;
  claimedAt: string;
  verifyWindowEndsAt: string;
};

export default function BillingClient({ plan, currentPlan }: { plan: 'pro' | 'business'; currentPlan: string }) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [claim, setClaim] = useState<PaymentClaim | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [reviewingReceipt, setReviewingReceipt] = useState(false);

  const current = currentPlan === plan;
  const downgrade = currentPlan === 'business' && plan === 'pro';

  async function createPayment() {
    setLoading(true);
    setError('');
    setMessage('');
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error || 'Could not create payment instructions.');
      return;
    }
    setClaim(data.payment);
  }

  async function verifyPayment() {
    if (!claim) return;
    setChecking(true);
    setError('');
    setMessage('');
    const response = await fetch('/api/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: claim.id }),
    });
    const data = await response.json().catch(() => ({}));
    setChecking(false);
    if (!response.ok) {
      setError(data.error || 'Could not verify the payment right now.');
      return;
    }
    if (data.confirmed) {
      setMessage(`Payment confirmed. Your ${data.plan || plan} plan is active for 30 days.`);
      window.setTimeout(() => window.location.reload(), 1200);
      return;
    }
    setMessage(data.message || 'not detected yet');
  }

  async function reviewReceipt() {
    if (!claim || !receipt) return;
    setReviewingReceipt(true);
    setError('');
    setMessage('');
    const form = new FormData();
    form.append('paymentId', claim.id);
    form.append('receipt', receipt);
    try {
      const response = await fetch('/api/payment/proof', { method: 'POST', body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not review the receipt right now.');
        return;
      }
      setMessage(data.message || (data.confirmed ? 'Payment confirmed.' : 'Receipt reviewed.'));
      if (data.confirmed) {
        window.setTimeout(() => window.location.reload(), 1200);
      }
    } catch {
      setError('Could not review the receipt right now.');
    } finally {
      setReviewingReceipt(false);
    }
  }

  function chooseReceipt(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] || null;
    setReceipt(next);
    setError('');
    setMessage('');
  }

  async function copyAddress() {
    if (!claim) return;
    try {
      await navigator.clipboard.writeText(claim.address);
      setMessage('Wallet address copied.');
    } catch {
      setError('Could not copy automatically. Select and copy the address manually.');
    }
  }

  if (current) {
    return <div className="mt-6 bg-brand-50 text-brand-700 text-sm font-medium py-2.5 rounded-lg text-center">Current plan</div>;
  }

  if (downgrade) {
    return <div className="mt-6 bg-slate-50 text-slate-500 text-sm py-2.5 rounded-lg text-center">Lower than your current Business plan</div>;
  }

  return (
    <div className="mt-6">
      {!claim ? (
        <button onClick={() => void createPayment()} disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
          {loading ? 'Preparing payment…' : `Upgrade to ${plan[0].toUpperCase() + plan.slice(1)}`}
        </button>
      ) : (
        <div className="border border-brand-200 bg-brand-50/50 rounded-xl p-4 space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Send exactly</div>
            <div className="text-3xl font-extrabold text-slate-900">{claim.amount} USDT</div>
          </div>
          <div className="text-sm">
            <div className="text-slate-500">Network</div>
            <div className="font-semibold">{claim.network}</div>
          </div>
          <div className="text-sm">
            <div className="text-slate-500">Trust Wallet address</div>
            <div className="mt-1 flex gap-2 items-start">
              <code className="flex-1 text-xs break-all bg-white border border-slate-200 rounded-lg p-2">{claim.address}</code>
              <button onClick={() => void copyAddress()} className="border border-slate-300 bg-white hover:bg-slate-50 rounded-lg px-3 py-2 text-xs font-semibold">Copy</button>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3">
            Send the exact amount above and use only the displayed network. Sending a different token, amount, or network may require manual support review.
          </div>
          <button onClick={() => void verifyPayment()} disabled={checking || reviewingReceipt}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
            {checking ? 'Checking blockchain…' : 'I have paid — verify now'}
          </button>
          <div className="border border-slate-200 bg-white rounded-lg p-3 space-y-2">
            <div className="text-xs font-semibold text-slate-700">Optional receipt review</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upload a JPG, PNG, or WebP receipt (max 5 MB). AI can screen the image for inconsistencies and duplicate reuse, but Lingua activates Pro/Business only after an independent blockchain match or owner verification.
            </p>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseReceipt}
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700" />
            <button onClick={() => void reviewReceipt()} disabled={!receipt || reviewingReceipt || checking}
              className="w-full border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 py-2 rounded-lg text-sm font-semibold">
              {reviewingReceipt ? 'Reviewing receipt + checking blockchain…' : 'Review receipt and verify payment'}
            </button>
          </div>
          <button onClick={() => { setClaim(null); setReceipt(null); }} disabled={checking || reviewingReceipt} className="w-full text-xs text-slate-500 hover:text-slate-700">Close payment instructions</button>
        </div>
      )}
      {message && <p className="text-xs text-green-700 mt-2">{message}</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
