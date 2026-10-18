'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('Enter the six-digit code sent to your inbox. It expires after 15 minutes.');
  const [resending, setResending] = useState(false);

  async function verify(token: string, accountEmail: string) {
    setStatus('working');
    setMessage('Verifying your email…');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: accountEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Verification failed.');
      setStatus('ok');
      setMessage('Email verified. Redirecting to your dashboard…');
      setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 900);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed.');
    }
  }

  useEffect(() => {
    const legacyToken = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    const accountEmail = new URLSearchParams(window.location.search).get('email') || '';
    setEmail(accountEmail);
    // Keep older 64-byte verification links usable while moving new users
    // to typed six-digit codes. Never leave a secret in browser history.
    window.history.replaceState({}, document.title, '/verify-email' + (accountEmail ? '?email=' + encodeURIComponent(accountEmail) : ''));
    if (/^[a-f0-9]{64}$/i.test(legacyToken)) void verify(legacyToken, accountEmail);
  // A legacy token is consumed just once when the page first opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setStatus('error');
      setMessage('Enter the six-digit code from your email.');
      return;
    }
    void verify(code.trim(), email);
  }

  async function resend() {
    setResending(true);
    setStatus('idle');
    setMessage('Requesting a new code…');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not resend verification code.');
      setMessage(data.message || 'If this account is awaiting verification, a new code has been sent.');
      setCode('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not resend code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-center">Verify your email</h1>
      <p className="text-sm text-center text-slate-500 mt-2">Only the inbox owner can activate a Lingua account.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        <div className={`text-sm rounded-lg p-3 ${status === 'error' ? 'bg-red-50 text-red-700' : status === 'ok' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'}`}>{message}</div>
        <div>
          <label htmlFor="verificationEmail" className="text-sm font-medium text-slate-700">Account email</label>
          <input id="verificationEmail" type="email" required autoComplete="email" value={email} disabled={status === 'working' || status === 'ok'} onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label htmlFor="verificationCode" className="text-sm font-medium text-slate-700">Six-digit verification code</label>
          <input id="verificationCode" type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="000000"
            value={code} disabled={status === 'working' || status === 'ok'} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 tracking-widest" />
        </div>
        <button type="submit" disabled={status === 'working' || status === 'ok'} className="w-full bg-brand-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
          {status === 'working' ? 'Verifying…' : 'Verify email'}
        </button>
        <button type="button" onClick={() => void resend()} disabled={resending || status === 'working' || status === 'ok' || !email}
          className="w-full text-sm font-semibold text-brand-600 disabled:opacity-50">{resending ? 'Sending…' : 'Resend verification code'}</button>
        <p className="text-center text-sm"><Link href="/login" className="text-brand-600 font-medium">Back to login</Link></p>
      </form>
    </div>
  );
}
