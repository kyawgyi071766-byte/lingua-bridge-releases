'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

type Download = { id: string; label: string; note: string; available: boolean; href: string | null };

export default function DownloadPortal() {
  const [token, setToken] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [publicMode, setPublicMode] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [message, setMessage] = useState('Checking access…');
  const [busy, setBusy] = useState(false);

  async function loadDownloads() {
    const response = await fetch('/api/download/list', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    setConfigured(data.configured !== false);
    setAuthorized(Boolean(data.authorized));
    setPublicMode(Boolean(data.public));
    setDownloads(Array.isArray(data.downloads) ? data.downloads : []);
    if (data.authorized && data.public) setMessage('Public downloads are available. Choose your platform below.');
    else if (data.authorized) setMessage('Access granted for 24 hours on this browser.');
    else if (data.configured === false) setMessage('The owner has not configured private downloads yet.');
    else setMessage('Enter the access code from the owner, or open the complete private link they sent you.');
  }

  async function unlock(value: string) {
    if (!value.trim()) return;
    setBusy(true);
    setMessage('Verifying access…');
    const response = await fetch('/api/download/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: value.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Access could not be verified.');
      setBusy(false);
      return;
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setToken('');
    await loadDownloads();
    setBusy(false);
  }

  useEffect(() => {
    const hashToken = window.location.hash.startsWith('#') ? decodeURIComponent(window.location.hash.slice(1)) : '';
    if (hashToken) unlock(hashToken).catch(() => setMessage('Could not verify the private link.'));
    else loadDownloads().catch(() => setMessage('Could not load download access.'));
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    unlock(token).catch(() => setMessage('Could not verify access.'));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">{publicMode ? 'Public app downloads' : 'Private app downloads'}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        {!authorized && configured && !publicMode && (
          <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-brand-500"
              placeholder="Access code"
              autoComplete="off"
            />
            <button disabled={busy} className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-60">
              {busy ? 'Checking…' : 'Unlock downloads'}
            </button>
          </form>
        )}
      </div>

      {authorized && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {downloads.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold">{item.label}</h3>
              <p className="mt-1 min-h-10 text-sm text-slate-500">{item.note}</p>
              {item.available && item.href ? (
                <a href={item.href} className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Download</a>
              ) : (
                <span className="mt-4 inline-flex rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500">Build not uploaded yet</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
        <h2 className="font-bold text-brand-900">No installer? Use the web app like an app.</h2>
        <p className="mt-2 text-sm text-brand-900/80">The PWA works on Android, iPhone/iPad, Windows and macOS without waiting for an app-store release.</p>
        <Link href="/install" className="mt-4 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">Installation guide</Link>
      </div>
    </div>
  );
}
