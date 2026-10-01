'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    setToken(value);
    window.history.replaceState({}, document.title, '/reset-password');
    if (!value) setError('Reset token is missing.');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError('Reset token is missing.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) { router.push('/dashboard'); router.refresh(); }
    else setError(data.error || 'Could not reset password.');
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-center">Choose a new password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
        <div><label className="text-sm font-medium text-slate-700">New password</label><input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
        <div><label className="text-sm font-medium text-slate-700">Confirm password</label><input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
        <button disabled={loading || !token} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">{loading ? 'Saving…' : 'Reset password'}</button>
        <p className="text-center text-sm"><Link href="/login" className="text-brand-600 font-medium">Back to login</Link></p>
      </form>
    </div>
  );
}
