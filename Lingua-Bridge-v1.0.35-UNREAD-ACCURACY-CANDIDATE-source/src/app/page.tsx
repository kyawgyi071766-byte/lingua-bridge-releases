import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const metadata = { alternates: { canonical: '/' } };

export const dynamic = "force-dynamic";

const DEFAULT_APPS = [
  { name: "WhatsApp", color: "#25D366" }, { name: "Telegram", color: "#229ED9" }, { name: "Messenger", color: "#0084FF" },
  { name: "Instagram", color: "#E1306C" }, { name: "Facebook", color: "#1877F2" }, { name: "Line", color: "#06C755" },
  { name: "TikTok", color: "#010101" }, { name: "X/Twitter", color: "#0f1419" }, { name: "Zalo", color: "#0068FF" },
  { name: "Discord", color: "#5865F2" }, { name: "Snapchat", color: "#FFFC00" }, { name: "Teams", color: "#464EB8" },
  { name: "Google Chat", color: "#1a73e8" }, { name: "Tinder", color: "#FE3C72" }, { name: "VK", color: "#0077FF" },
  { name: "Botim", color: "#2ECC71" }, { name: "BiP", color: "#FFB300" }, { name: "TextNow", color: "#9C27B0" },
  { name: "Google Voice", color: "#0F9D58" }, { name: "TextFree", color: "#FF5722" }, { name: "Max", color: "#002BEA" },
];

async function supportedApps() {
  try {
    const rows = await prisma.supportedApp.findMany({ where: { enabled: true }, orderBy: { createdAt: "asc" } });
    return rows.length ? rows.map((row) => ({ name: row.name, color: row.color })) : DEFAULT_APPS;
  } catch {
    return DEFAULT_APPS;
  }
}

export default async function HomePage() {
  const apps = await supportedApps();
  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Lingua Bridge',
    softwareVersion: '1.0.35',
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Windows 10, Windows 11',
    offers: [
      { '@type': 'Offer', name: 'Pro — 30 days', price: '9', priceCurrency: 'USD' },
      { '@type': 'Offer', name: 'Business — 30 days', price: '29', priceCurrency: 'USD' },
    ],
  };
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication).replace(/</g, '\\u003c') }} />
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-block bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          v1.0.35 Global Release · Windows 10/11 · English + Simplified Chinese · multilingual provider fallback
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Translate anything,<br />
          <span className="text-brand-600">in seconds.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          Translate international customer conversations across popular desktop messengers, including Myanmar/Burmese and other broad-provider languages. Sign up free, upgrade when you need more. No automatic renewal.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-500">Pro 9 USDT / 30 days · Business 29 USDT / 30 days</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/signup" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-brand-600/20">
            Start translating free
          </Link>
          <a href="#pricing" className="text-slate-700 font-medium hover:text-brand-600">See pricing →</a>
          <Link href="/downloads" className="text-slate-700 font-medium hover:text-brand-600">Customer download →</Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-6">
        {[
          { t: "Accurate & fluent", d: "Uses professional translation providers with automatic fallback when multiple providers are configured." },
          { t: "Privacy-minded", d: "Translation text is sent to your configured provider to produce a result; Lingua does not save translated text in its database." },
          { t: "Simple crypto billing", d: "Upgrade with a unique USDT amount sent directly to the owner Trust Wallet. Paid access activates after verification." },
        ].map((f) => (
          <div key={f.t} className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-semibold text-lg">{f.t}</h3>
            <p className="text-slate-600 text-sm mt-2">{f.d}</p>
          </div>
        ))}
      </section>

      {/* Works with all apps */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-center">Translate across the messaging apps you already use</h2>
        <p className="text-center text-slate-600 mt-2">Use Lingua with apps that allow copying or sharing text — no modification of your messaging account is required.</p>
        <div className="mt-10 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4">
          {apps.map((app) => (
            <div key={app.name} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl grid place-items-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: app.color }}>
                {app.name[0]}
              </div>
              <span className="text-xs text-slate-600 text-center">{app.name}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">…and more. Apps that expose Copy or Share can work with Lingua.</p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center">Simple, transparent pricing</h2>
        <p className="text-center text-slate-600 mt-2">Pay with USDT for 30 days of access. No automatic renewal.</p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((id) => {
            const p = PLANS[id];
            const popular = id === "pro";
            return (
              <div
                key={id}
                className={`relative bg-white border rounded-2xl p-8 flex flex-col ${
                  popular ? "border-brand-600 ring-2 ring-brand-600/20 scale-[1.03]" : "border-slate-200"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="font-bold text-xl">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">${p.price}</span>
                  <span className="text-slate-500">/30 days</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {(p.monthlyChars / 1000).toLocaleString()}k characters / month
                </p>
                <ul className="mt-6 space-y-2 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brand-600 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={id === "free" ? "/signup" : "/login?next=/billing"}
                  className={`mt-8 block text-center py-3 rounded-xl font-semibold ${
                    popular
                      ? "bg-brand-600 hover:bg-brand-700 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  {id === "free" ? "Get started" : "Choose " + p.name}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer sales and support contact */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-bold">Purchase & Support</h2>
          <p className="mt-2 text-slate-600">For Pro or Business purchases, account verification, or payment assistance, contact our support team. Include your Lingua account Gmail address and preferred plan.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href="https://t.me/linguabridgebridish" target="_blank" rel="noreferrer" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl font-semibold">Contact on Telegram</a>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=sshksshk2002@gmail.com" target="_blank" rel="noreferrer" className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-5 py-3 rounded-xl font-semibold">Email via Gmail</a>
          </div>

        </div>
      </section>
    </div>
  );
}
