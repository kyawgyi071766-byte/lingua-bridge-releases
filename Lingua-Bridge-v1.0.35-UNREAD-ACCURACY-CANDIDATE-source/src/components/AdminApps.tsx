'use client';
import { useEffect, useState } from 'react';

interface AppRow { id: string; name: string; quantity: number; color: string; }

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#0f1419'];

export default function AdminApps() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState('#2563eb');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/admin/apps', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setApps(data.apps || []);
    else setError(data.error || 'Could not load supported apps.');
  }

  useEffect(() => { void load(); }, []);

  async function addApp(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), quantity, color }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Could not add app.'); return; }
    setName('');
    setQuantity(1);
    await load();
  }

  async function removeApp(id: string, appName: string) {
    if (!window.confirm(`Remove ${appName} from the supported-app list?`)) return;
    setError('');
    const res = await fetch(`/api/admin/apps?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || 'Could not remove app.'); return; }
    await load();
  }

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 font-semibold flex items-center justify-between">
        <span>Supported Apps ({apps.length})</span>
        <span className="text-xs text-slate-400 font-normal">Overrides the default landing-page list when at least one is added</span>
      </div>

      {error && <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}

      <form onSubmit={addApp} className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-slate-500">Name</label>
          <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="e.g. WhatsApp Business"
            className="mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm w-48" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Quantity</label>
          <input type="number" min={1} max={10000} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm w-24" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Color</label>
          <div className="mt-1.5 flex gap-1.5">
            {COLORS.map((choice) => (
              <button type="button" key={choice} onClick={() => setColor(choice)} aria-label={`Use color ${choice}`}
                className={`w-6 h-6 rounded-full border-2 ${color === choice ? 'border-slate-800' : 'border-white'}`}
                style={{ backgroundColor: choice }} />
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading || !name.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-5 py-2 rounded-lg text-sm font-semibold">
          {loading ? 'Adding…' : 'Add app'}
        </button>
      </form>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {apps.length === 0 && <p className="text-sm text-slate-400 col-span-full">No custom apps added. The landing page is using its default app list.</p>}
        {apps.map((app) => (
          <div key={app.id} className="border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg grid place-items-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: app.color }}>
              {app.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{app.name}</div>
              <div className="text-xs text-slate-400">Qty: {app.quantity}</div>
            </div>
            <button onClick={() => removeApp(app.id, app.name)} aria-label={`Remove ${app.name}`} className="text-slate-300 hover:text-red-500 text-sm flex-shrink-0">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
