import DownloadPortal from '@/components/DownloadPortal';

export const metadata = {
  title: 'Download Lingua Bridge for Windows',
  description: 'Download the official Lingua Bridge Windows desktop translator for multilingual customer conversations.',
  alternates: { canonical: '/downloads' },
  robots: { index: true, follow: true },
};

export default function DownloadsPage() {
  const version = (process.env.DESKTOP_STABLE_VERSION || '1.0.22').trim();
  const checksum = (process.env.DESKTOP_STABLE_WINDOWS_SHA256 || '').trim().toLowerCase();
  const checksumOk = /^[a-f0-9]{64}$/.test(checksum);
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-600">OFFICIAL PUBLIC DOWNLOADS</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Download Lingua Bridge</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Get the official Windows build of Lingua Bridge for multilingual customer conversations. Public downloads use the configured release host directly for faster global delivery.
        </p>
        <p className="mt-3 text-xs text-slate-500">Current Windows release: v{version}</p>
        {checksumOk && <p className="mt-1 break-all text-xs text-slate-500">SHA-256: {checksum}</p>}
      </div>
      <DownloadPortal />
    </section>
  );
}
