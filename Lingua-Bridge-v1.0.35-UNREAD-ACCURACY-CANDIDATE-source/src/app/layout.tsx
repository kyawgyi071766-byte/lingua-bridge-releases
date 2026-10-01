import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SupportWidget from "@/components/SupportWidget";

const publicUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lingua-github-import.vercel.app';
const googleVerification = (process.env.GOOGLE_SITE_VERIFICATION || '').trim();

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: {
    default: "Lingua Bridge — Desktop Messenger Translation",
    template: "%s — Lingua Bridge",
  },
  description: "Lingua Bridge translates customer messages across WhatsApp, Telegram and other desktop messaging services with provider fallback, verified updates and multilingual support including Myanmar/Burmese.",
  keywords: [
    "Lingua Bridge",
    "desktop translator",
    "messenger translator",
    "WhatsApp translator",
    "Telegram translator",
    "Myanmar Burmese translator",
    "customer chat translation",
    "Windows translation app",
  ],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Lingua Bridge',
    title: 'Lingua Bridge — Desktop Messenger Translation',
    description: 'Translate international customer conversations across popular desktop messaging services.',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Lingua Bridge' }],
  },
  twitter: {
    card: 'summary',
    title: 'Lingua Bridge — Desktop Messenger Translation',
    description: 'Translate international customer conversations across popular desktop messaging services.',
  },
  verification: googleVerification ? { google: googleVerification } : undefined,
  manifest: '/manifest.json',
  applicationName: 'Lingua Bridge',
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Lingua', statusBarStyle: 'default' },
};

export const viewport = { themeColor: "#2563eb" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://github.com" />
        <link rel="dns-prefetch" href="https://release-assets.githubusercontent.com" />
      </head>
      <body>
        <Navbar />
        <main className="min-h-[70vh]">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
            <div>© {new Date().getFullYear()} Lingua Bridge. All rights reserved. · Translation via configured providers</div>
            <div className="mt-2 flex items-center justify-center gap-4">
              <Link href="/downloads" className="hover:text-brand-600">Downloads</Link>
              <Link href="/privacy" className="hover:text-brand-600">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-600">Terms</Link>
            </div>
          </div>
        </footer>
        <SupportWidget />
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}" }} />
      </body>
    </html>
  );
}
