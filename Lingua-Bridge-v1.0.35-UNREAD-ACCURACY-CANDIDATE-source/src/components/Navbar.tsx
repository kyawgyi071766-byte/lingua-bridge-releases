'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [ownerAdmin, setOwnerAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) { setRole(null); setLoaded(true); return; }
        const data = await response.json();
        if (active) { setRole(data.role || 'user'); setOwnerAdmin(Boolean(data.ownerAdmin)); setLoaded(true); }
      })
      .catch(() => { if (active) { setRole(null); setOwnerAdmin(false); setLoaded(true); } });
    return () => { active = false; };
  }, [pathname]);

  const loggedIn = Boolean(role);
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-700">
          <span className="w-8 h-8 rounded-lg bg-brand-600 text-white grid place-items-center text-sm">L</span>
          Lingua
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#pricing" className="text-slate-600 hover:text-brand-600 hidden sm:inline">Pricing</Link>
          <Link href="/install" className="text-slate-600 hover:text-brand-600 hidden md:inline">Install</Link>
          {loaded && loggedIn ? (
            <>
              <Link href="/dashboard" className="text-slate-600 hover:text-brand-600">Dashboard</Link>
              <Link href="/billing" className="text-slate-600 hover:text-brand-600">Billing</Link>
              {ownerAdmin && <Link href="/admin" className="text-slate-600 hover:text-brand-600 hidden sm:inline">Admin</Link>}
            </>
          ) : loaded ? (
            <>
              <Link href="/login" className="text-slate-600 hover:text-brand-600">Log in</Link>
              <Link href="/signup" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium">Sign up free</Link>
            </>
          ) : <span className="text-slate-300">…</span>}
        </nav>
      </div>
    </header>
  );
}
