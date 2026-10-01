'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setMessage(data.message || 'If the account exists, a reset link has been sent.');
    else setError(data.error || 'Could not request a reset link.');
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-center">Reset your password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        {message && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">{message}</div>}
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <button disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <p className="text-center text-sm"><Link href="/login" className="text-brand-600 font-medium">Back to login</Link></p>
      </form>
    </div>
  );
}
