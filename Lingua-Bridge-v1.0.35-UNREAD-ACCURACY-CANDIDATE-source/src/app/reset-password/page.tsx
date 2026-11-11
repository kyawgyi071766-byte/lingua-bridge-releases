'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [legacyToken, setLegacyToken] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const legacy = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    const accountEmail = new URLSearchParams(window.location.search).get('email') || '';
    setEmail(accountEmail);
    if (/^[a-f0-9]{64}$/i.test(legacy)) setLegacyToken(legacy);
    window.history.replaceState({}, document.title, '/reset-password' + (accountEmail ? '?email=' + encodeURIComponent(accountEmail) : ''));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const token = legacyToken || code.trim();
    if (!legacyToken && !/^\d{6}$/.test(code.trim())) { setError('Enter your six-digit reset code.'); return; }
    if (!legacyToken && !email.trim()) { setError('Enter your account email.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reset password.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-center">Choose a new password</h1>
      <p className="text-center text-sm text-slate-500 mt-2">{legacyToken ? 'Your reset link is ready.' : 'Use the six-digit code emailed to you. Codes expire after 15 minutes.'}</p>
      <form onSubmit={submit} className="mt-8 space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
        {!legacyToken && (
          <>
            <div><label htmlFor="resetEmail" className="text-sm font-medium text-slate-700">Account email</label>
              <input id="resetEmail" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
            <div><label htmlFor="resetCode" className="text-sm font-medium text-slate-700">Six-digit reset code</label>
              <input id="resetCode" type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 tracking-widest" /></div>
          </>
        )}
        <div><label htmlFor="newPassword" className="text-sm font-medium text-slate-700">New password</label>
          <input id="newPassword" type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
        <div><label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm password</label>
          <input id="confirmPassword" type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
        <button disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">{loading ? 'Saving…' : 'Reset password'}</button>
        <p className="text-center text-sm"><Link href="/forgot-password" className="text-brand-600 font-medium">Request another code</Link></p>
      </form>
    </div>
  );
}
