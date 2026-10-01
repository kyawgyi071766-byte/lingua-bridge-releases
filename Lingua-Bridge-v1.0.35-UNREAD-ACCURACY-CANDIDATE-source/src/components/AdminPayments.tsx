'use client';

import { useState } from 'react';

export interface AdminPaymentRow {
  id: string;
  email: string;
  plan: string;
  amount: string;
  chain: string;
  status: string;
  txHash: string | null;
  claimedAt: string;
  confirmedAt: string | null;
  receiptStatus: string | null;
}

export default function AdminPayments({ initialPayments }: { initialPayments: AdminPaymentRow[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function confirm(payment: AdminPaymentRow) {
    if (!window.confirm(`Verify ${payment.amount} USDT for ${payment.email} (${payment.plan}) on-chain and activate only if the transfer is found?`)) return;
    const txHash = window.prompt('Optional: paste the transaction hash to cross-check. Lingua will still require an independent blockchain match.', payment.txHash || '')?.trim() || null;
    setBusyId(payment.id);
    setError('');
    const response = await fetch('/api/admin/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: payment.id, txHash }),
    });
    const data = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setError(data.error || 'Could not confirm payment.');
      return;
    }
    setPayments((current) => current.map((row) => row.id === payment.id ? {
      ...row,
      status: 'confirmed',
      txHash: txHash || row.txHash,
      confirmedAt: new Date().toISOString(),
    } : row));
  }

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 font-semibold">Crypto payments ({payments.length})</div>
      {error && <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Customer</th>
              <th className="text-left px-5 py-3">Plan</th>
              <th className="text-left px-5 py-3">Amount</th>
              <th className="text-left px-5 py-3">Network</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Receipt</th>
              <th className="text-left px-5 py-3">Claimed</th>
              <th className="text-left px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium">{payment.email}</td>
                <td className="px-5 py-3 capitalize">{payment.plan}</td>
                <td className="px-5 py-3 font-mono">{payment.amount} USDT</td>
                <td className="px-5 py-3 uppercase text-slate-500">{payment.chain}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${payment.status === 'confirmed' ? 'bg-green-100 text-green-700' : payment.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{payment.status}</span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">{payment.receiptStatus || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{payment.claimedAt.slice(0, 16).replace('T', ' ')}</td>
                <td className="px-5 py-3">
                  {payment.status === 'confirmed' ? (
                    <span className="text-xs text-slate-400">Activated</span>
                  ) : (
                    <button onClick={() => void confirm(payment)} disabled={busyId === payment.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-40">
                      {busyId === payment.id ? 'Verifying…' : 'Verify on-chain'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No crypto payment claims yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
