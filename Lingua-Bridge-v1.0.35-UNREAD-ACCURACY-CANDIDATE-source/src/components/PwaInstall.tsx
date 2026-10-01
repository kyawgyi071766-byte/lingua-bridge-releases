'use client';

import { useEffect, useState } from 'react';

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export default function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState<DeferredPrompt | null>(null);
  const [platform, setPlatform] = useState('device');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('iPhone / iPad');
    else if (/android/.test(ua)) setPlatform('Android');
    else if (/windows/.test(ua)) setPlatform('Windows');
    else if (/macintosh|mac os x/.test(ua)) setPlatform('macOS');
    else if (/linux/.test(ua)) setPlatform('Linux');

    const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);

    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as DeferredPrompt);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    setPromptEvent(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-semibold text-brand-600">Detected: {platform}</div>
        <h2 className="mt-1 text-2xl font-bold">Install Lingua as an app</h2>
        {installed ? (
          <p className="mt-3 text-sm text-emerald-700">Lingua is already running in installed app mode on this device.</p>
        ) : promptEvent ? (
          <button onClick={install} className="mt-5 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white">Install Lingua</button>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Your browser does not expose a one-click install button here. Follow the device instructions below.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">iPhone / iPad</h3>
          <p className="mt-2 text-sm text-slate-600">Open Lingua in Safari → tap Share → Add to Home Screen → Add. This is the fastest iPhone version and does not require TestFlight.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Android</h3>
          <p className="mt-2 text-sm text-slate-600">Open Lingua in Chrome/Edge → menu → Install app or Add to Home screen. A native APK can also be offered from the private downloads page.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Windows / macOS</h3>
          <p className="mt-2 text-sm text-slate-600">Open Lingua in Chrome or Edge and use the Install icon in the address bar. Native Electron installers can also be distributed privately.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Linux</h3>
          <p className="mt-2 text-sm text-slate-600">Use Chromium/Chrome to install the PWA, or use the AppImage/.deb build when the owner publishes one.</p>
        </div>
      </div>
    </div>
  );
}
