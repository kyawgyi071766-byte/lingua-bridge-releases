'use client';

import { useState } from 'react';

export interface AdminDeviceRow {
  id: string;
  name: string;
  type: string;
  platform: string;
  appVersion: string | null;
  lastSeenAt: string;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  plan: string;
  grantType: string;
  role: string;
  usageChars: number;
  usageLimit: number;
  voiceUses: number;
  voiceLimit: number;
  joined: string;
  paidUntil: string | null;
  lastActiveAt: string;
  suspended: boolean;
  deviceLimit: number | null;
  devices: AdminDeviceRow[];
}

export default function AdminUserTable({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function toggle(user: AdminUserRow) {
    const next = !user.suspended;
    const warning = next
      ? `Suspend ${user.email}? Only do this after proven fraud. Payment verification alone is never a reason to suspend.`
      : `Unsuspend ${user.email}?`;
    if (!window.confirm(warning)) return;
    setBusyId(user.id);
    setError('');
    const response = await fetch('/api/admin/user/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, suspended: next }),
    });
    const data = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setError(data.error || 'Could not update suspension status.');
      return;
    }
    setUsers((current) => current.map((row) => row.id === user.id ? { ...row, suspended: next } : row));
  }

  async function removeDevice(user: AdminUserRow, device: AdminDeviceRow) {
    if (!window.confirm(`Remove ${device.name} from ${user.email}?\n\nThe user can attach a replacement device on the next allowed login.`)) return;
    setBusyId(`device:${device.id}`);
    setError('');
    const response = await fetch('/api/admin/device/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, deviceId: device.id }),
    });
    const data = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setError(data.error || 'Could not remove device.');
      return;
    }
    setUsers((current) => current.map((row) => row.id === user.id
      ? { ...row, devices: row.devices.filter((item) => item.id !== device.id) }
      : row));
  }

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 font-semibold">Users ({users.length})</div>
      {error && <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Plan / grant</th>
              <th className="text-left px-5 py-3">Devices</th>
              <th className="text-left px-5 py-3">Text quota</th>
              <th className="text-left px-5 py-3">Voice quota</th>
              <th className="text-left px-5 py-3">Paid / gift until</th>
              <th className="text-left px-5 py-3">Last active</th>
              <th className="text-left px-5 py-3">Joined</th>
              <th className="text-left px-5 py-3">Control</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100 align-top">
                <td className="px-5 py-3 font-medium">
                  {user.email}
                  {user.role === 'admin' && <span className="ml-2 text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Owner</span>}
                  {user.suspended && <span className="ml-2 text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Suspended</span>}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.plan === 'free' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>{user.plan}</span>
                  <div className="text-[11px] text-slate-500 mt-1">{user.grantType.replace('_', ' ')}</div>
                </td>
                <td className="px-5 py-3 min-w-[260px]">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    {user.deviceLimit === null ? 'Unlimited / not enforced' : `${user.devices.length} / ${user.deviceLimit} attached`}
                  </div>
                  {user.devices.length === 0 ? <div className="text-xs text-slate-400">No Lingua Bridge device attached yet.</div> : (
                    <div className="space-y-2">
                      {user.devices.map((device) => (
                        <div key={device.id} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                          <div className="font-medium text-xs">{device.name} · {device.type}</div>
                          <div className="text-[11px] text-slate-500">{device.platform}{device.appVersion ? ` · v${device.appVersion}` : ''}</div>
                          <div className="text-[11px] text-slate-500">Last used {new Date(device.lastSeenAt).toLocaleString()}</div>
                          <button
                            onClick={() => void removeDevice(user, device)}
                            disabled={busyId === `device:${device.id}`}
                            className="mt-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40"
                          >{busyId === `device:${device.id}` ? 'Removing…' : 'Remove device'}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500">{user.usageChars.toLocaleString()} / {user.usageLimit.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500">{user.voiceUses.toLocaleString()} / {user.voiceLimit.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500">{user.paidUntil ? user.paidUntil.slice(0, 10) : user.grantType === 'gift_code' && user.plan !== 'free' ? 'Permanent' : '—'}</td>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(user.lastActiveAt).toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-500">{user.joined}</td>
                <td className="px-5 py-3">
                  <button onClick={() => void toggle(user)} disabled={busyId === user.id || user.role === 'admin'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 ${user.suspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                    {busyId === user.id ? 'Saving…' : user.suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 text-xs text-slate-500 border-t border-slate-100">
        Paid Pro/Business accounts may attach up to 2 Lingua Bridge devices. Gift-code accounts may attach 1 device and only the owner can release that slot. Free/Test remain unrestricted.
      </div>
    </div>
  );
}
