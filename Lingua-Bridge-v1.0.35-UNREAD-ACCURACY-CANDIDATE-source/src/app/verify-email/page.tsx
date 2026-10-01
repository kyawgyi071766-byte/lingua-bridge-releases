'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working');
  const [message, setMessage] = useState('Verifying your email…');

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
    window.history.replaceState({}, document.title, '/verify-email');
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Verification failed.');
      setStatus('ok');
      setMessage('Email verified. Redirecting to your dashboard…');
      setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 900);
    }).catch((error) => {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed.');
    });
  }, [router]);

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className={`rounded-2xl border p-6 ${status === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-700'}`}>
        <h1 className="text-xl font-bold">Email verification</h1>
        <p className="mt-3 text-sm">{message}</p>
        {status === 'error' && <Link href="/login" className="inline-block mt-4 text-brand-600 font-medium hover:underline">Back to login</Link>}
      </div>
    </div>
  );
}
