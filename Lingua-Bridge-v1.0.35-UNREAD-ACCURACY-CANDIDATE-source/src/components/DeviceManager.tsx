'use client';

import { useEffect, useState } from 'react';

type DeviceItem = {
  id: string;
  name: string;
  type: string;
  platform: string;
  appVersion: string | null;
  lastSeenAt: string;
  createdAt: string;
  current: boolean;
};

type DeviceState = {
  ok: boolean;
  plan: string;
  grantType: string;
  limited: boolean;
  limit: number | null;
  count: number;
  currentDeviceId: string | null;
  canSelfRemove: boolean;
  ownerRemovalRequired: boolean;
  devices: DeviceItem[];
  error?: string;
};

export default function DeviceManager() {
  const [state, setState] = useState<DeviceState | null>(null);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/devices', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState({ ok: false, plan: 'free', grantType: 'free', limited: false, limit: null, count: 0, currentDeviceId: null, canSelfRemove: false, ownerRemovalRequired: false, devices: [], error: data.error || 'Could not load devices.' });
      return;
    }
    setState(data);
  }

  useEffect(() => { void load(); }, []);

  async function remove(device: DeviceItem) {
    if (!state?.canSelfRemove) return;
    if (!window.confirm(`Remove ${device.name} from your Lingua device list?`)) return;
    setBusyId(device.id);
    setMessage('');
    const response = await fetch('/api/devices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: device.id }),
    });
    const data = await response.json().catch(() => ({}));
    setBusyId('');
    if (!response.ok) {
      setMessage(data.error || 'Could not remove device.');
      return;
    }
    setMessage('Device removed. You may attach a replacement device on a later Lingua Bridge login.');
    await load();
  }

  return (
    <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-800">Connected Lingua Bridge devices</h2>
          <p className="text-xs text-slate-500 mt-1">Device limits are verified by the server. Raw device IDs are not stored in the database.</p>
        </div>
        <button onClick={() => void load()} className="text-xs text-brand-600 hover:underline">Refresh</button>
      </div>

      {!state && <div className="text-sm text-slate-400 mt-4">Loading devices…</div>}
      {state?.error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{state.error}</div>}
      {state?.ok && (
        <>
          <div className="mt-4 text-sm font-semibold">
            {state.limited ? `${state.count} / ${state.limit} devices connected` : 'No device limit on this plan'}
          </div>
          {state.ownerRemovalRequired && (
            <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl">
              Gift-code access allows one device. To change devices, contact the Lingua owner; only the Owner Dashboard can release this slot.
            </div>
          )}
          {message && <div className="mt-3 text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl">{message}</div>}
          <div className="mt-4 space-y-3">
            {state.devices.length === 0 ? <div className="text-sm text-slate-400">No desktop device has been attached yet.</div> : state.devices.map((device) => (
              <div key={device.id} className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-sm">{device.name} {device.current && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">THIS DEVICE</span>}</div>
                  <div className="text-xs text-slate-500 mt-1">{device.type} · {device.platform}{device.appVersion ? ` · Lingua v${device.appVersion}` : ''}</div>
                  <div className="text-xs text-slate-500 mt-1">Last used {new Date(device.lastSeenAt).toLocaleString()}</div>
                </div>
                {state.canSelfRemove && (
                  <button onClick={() => void remove(device)} disabled={busyId === device.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40">
                    {busyId === device.id ? 'Removing…' : device.current ? 'Remove this device' : 'Remove device'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
