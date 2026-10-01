import Link from 'next/link';
import PwaInstall from '@/components/PwaInstall';

export const metadata = { title: 'Install Lingua', alternates: { canonical: '/install' } };

export default function InstallPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <p className="text-sm font-semibold text-brand-600">ONE WEB APP · EVERY DEVICE</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Install Lingua</h1>
      <p className="mt-3 mb-8 max-w-2xl text-slate-600">The PWA is the recommended first global release: one secure web deployment works on phones and computers and can be installed without an app store.</p>
      <PwaInstall />
      <p className="mt-8 text-sm text-slate-500">Have a private native-build link from the owner? <Link href="/downloads" className="font-semibold text-brand-600">Open private downloads</Link>.</p>
    </section>
  );
}
