'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setNeedsVerification(false);
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      router.push(next);
      router.refresh();
      return;
    }
    setError(data.error || 'Login failed. Check your email and password.');
    setNeedsVerification(data.code === 'EMAIL_NOT_VERIFIED');
  }

  async function resendVerification() {
    setError('');
    setMessage('');
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setMessage(data.message || 'Verification email sent.');
    else setError(data.error || 'Could not resend verification email.');
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-center">Welcome back</h1>
      <p className="text-center text-slate-500 text-sm mt-1">Log in to your Lingua account</p>
      <form onSubmit={submit} className="mt-8 space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">{message}</div>}
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <button disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        {needsVerification && (
          <button type="button" onClick={resendVerification} className="w-full text-sm text-brand-600 font-medium hover:underline">
            Resend verification email
          </button>
        )}
        <div className="flex items-center justify-between gap-3 text-sm">
          <Link href="/forgot-password" className="text-brand-600 font-medium">Forgot password?</Link>
          <span className="text-slate-500">No account? <Link href="/signup" className="text-brand-600 font-medium">Sign up</Link></span>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-16 text-center text-slate-400">Loading…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
