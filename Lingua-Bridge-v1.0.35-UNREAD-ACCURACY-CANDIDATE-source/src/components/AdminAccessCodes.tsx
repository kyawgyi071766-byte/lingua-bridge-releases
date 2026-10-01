'use client';

import { useState } from 'react';

export type AccessCodeRow = {
  id: string;
  code: string;
  level: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  redemptions: number;
  activeUsers: number;
};

export default function AdminAccessCodes({ initialCodes }: { initialCodes: AccessCodeRow[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [level, setLevel] = useState<'pro' | 'business'>('pro');
  const [duration, setDuration] = useState<'30d' | '90d' | 'forever'>('30d');
  const [maxUses, setMaxUses] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  async function refresh() {
    const response = await fetch('/api/admin/access-codes', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.ok && Array.isArray(data.codes)) setCodes(data.codes);
  }

  async function createCode() {
    setBusy(true);
    setError('');
    setCreatedCode('');
    const response = await fetch('/api/admin/access-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, duration, maxUses }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error || 'Could not create access code.');
      return;
    }
    setCreatedCode(data.code || '');
    await refresh();
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      window.prompt('Copy this code:', code);
    }
  }

  async function revoke(row: AccessCodeRow) {
    if (!row.isActive) return;
    if (!window.confirm(`Revoke ${row.code}? Active gift-code users on this code will return to Free immediately. Revocation is permanent.`)) return;
    setError('');
    const response = await fetch('/api/admin/access-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, isActive: false }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Could not update the code.');
      return;
    }
    await refresh();
  }

  async function changeLimit(row: AccessCodeRow) {
    const value = window.prompt(`Maximum uses for ${row.code}`, String(row.maxUses));
    if (value === null) return;
    const next = Number(value);
    setError('');
    const response = await fetch('/api/admin/access-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, maxUses: next }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Could not change usage limit.');
      return;
    }
    await refresh();
  }

  return (
    <section className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="font-semibold">Access Codes</div>
        <div className="text-xs text-slate-500 mt-1">Owner-created gift access. Codes are encrypted at rest; redemption and quotas are enforced by the server.</div>
      </div>

      <div className="p-5 grid md:grid-cols-4 gap-3 items-end bg-slate-50/60">
        <label className="text-sm">
          <span className="text-slate-600">Level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value as 'pro' | 'business')} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">
            <option value="pro">Pro · 300 voice/mo</option>
            <option value="business">Business · 2,000 voice/mo</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-slate-600">Validity</span>
          <select value={duration} onChange={(e) => setDuration(e.target.value as '30d' | '90d' | 'forever')} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="forever">Permanent</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-slate-600">Max users</span>
          <input type="number" min={1} max={1000} value={maxUses} onChange={(e) => setMaxUses(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white" />
        </label>
        <button onClick={() => void createCode()} disabled={busy} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 font-semibold">
          {busy ? 'Creating…' : 'Create Access Code'}
        </button>
      </div>

      {createdCode && (
        <div className="mx-5 mt-5 border border-green-200 bg-green-50 rounded-xl p-4">
          <div className="text-xs font-bold uppercase text-green-700">New code created</div>
          <div className="flex flex-wrap gap-2 items-center mt-2">
            <code className="font-bold break-all text-slate-900">{createdCode}</code>
            <button onClick={() => void copyCode(createdCode)} className="border border-green-300 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold">Copy</button>
          </div>
          <div className="text-xs text-green-800 mt-2">Give this only to the intended person. Default max use is 1.</div>
        </div>
      )}
      {error && <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}

      <div className="overflow-x-auto mt-5">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Code</th>
              <th className="text-left px-5 py-3">Level</th>
              <th className="text-left px-5 py-3">Uses</th>
              <th className="text-left px-5 py-3">Expires</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Controls</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 align-top">
                <td className="px-5 py-3">
                  <code className="text-xs break-all font-semibold">{row.code}</code>
                  <button onClick={() => void copyCode(row.code)} className="ml-2 text-xs text-brand-600 hover:underline">Copy</button>
                  <div className="text-[11px] text-slate-400 mt-1">Created {row.createdAt.slice(0, 10)} · active users {row.activeUsers}</div>
                </td>
                <td className="px-5 py-3 capitalize font-semibold">{row.level}</td>
                <td className="px-5 py-3">{row.usedCount} / {row.maxUses}</td>
                <td className="px-5 py-3 text-slate-500">{row.expiresAt ? row.expiresAt.slice(0, 10) : 'Permanent'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <button onClick={() => void changeLimit(row)} className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold mr-2">Limit</button>
                  <button onClick={() => void revoke(row)} disabled={!row.isActive} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-700 disabled:opacity-40">
                    {row.isActive ? 'Revoke' : 'Revoked'}
                  </button>
                </td>
              </tr>
            ))}
            {!codes.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No access codes created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
