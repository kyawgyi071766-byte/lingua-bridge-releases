'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Use 10–128 characters with at least one letter and one number.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && data.needsVerification) {
      setMessage('Account created. Check your email and click the verification link before logging in.');
      return;
    }
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
      return;
    }
    setError(data.error || 'Signup failed. Please try again.');
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-center">Create your account</h1>
      <p className="text-center text-slate-500 text-sm mt-1">Start with a small free monthly translation allowance</p>
      <form onSubmit={submit} className="mt-8 space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">{message}</div>}
        <div>
          <label className="text-sm font-medium text-slate-700">Name</label>
          <input type="text" maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input type="password" required minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <p className="text-xs text-slate-400 mt-1">10–128 characters, including at least one letter and one number.</p>
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-500">
          <input type="checkbox" required className="mt-0.5" />
          <span>I agree to the <Link href="/terms" className="text-brand-600 hover:underline">Terms</Link> and <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.</span>
        </label>
        <button disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account? <Link href="/login" className="text-brand-600 font-medium">Log in</Link>
        </p>
      </form>
    </div>
  );
}
