'use client';

import { useState } from 'react';

export default function RedeemGiftCode() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function redeem() {
    const clean = code.trim();
    if (!clean) return;
    setBusy(true);
    setMessage('');
    setError('');
    const response = await fetch('/api/access-code/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: clean }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error || 'Could not redeem this code.');
      return;
    }
    setMessage(data.message || `${String(data.plan || '').toUpperCase()} access activated.`);
    setCode('');
    window.setTimeout(() => window.location.reload(), 900);
  }

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="font-bold text-lg">Redeem Gift Code</h2>
      <p className="text-sm text-slate-500 mt-1">Enter a Lingua code provided by the owner. A valid code activates the server-side Pro or Business quota immediately.</p>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void redeem(); }} autoComplete="off" placeholder="LINGUA-PRO-…" className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 font-mono" />
        <button onClick={() => void redeem()} disabled={busy || !code.trim()} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg px-5 py-2.5 font-semibold">
          {busy ? 'Checking…' : 'Redeem Code'}
        </button>
      </div>
      {message && <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{message}</div>}
      {error && <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
    </div>
  );
}
