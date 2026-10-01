"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LANGUAGES } from "@/lib/languages";

const TARGET_LANGUAGES = LANGUAGES.filter((language) => language.code !== "auto");

export default function DashboardPage() {
  const router = useRouter();
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("en");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) router.push("/login");
      else r.json().then((d) => setEmail(d.email));
    });
    fetch("/api/usage").then((r) => r.ok && r.json().then(setUsage)).catch(() => {});
  }, [router]);

  async function doTranslate() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input, targetLang: target, sourceLang: source }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setOutput(data.translated);
      setProvider(data.provider || "");
      setUsage((u: any) => ({ ...u, used: data.used, limit: data.limit, remaining: data.limit - data.used }));
    } else {
      setError(data.error || "Translation failed.");
      if (data.upgrade) setOutput("");
    }
  }

  function swap() {
    if (source === "auto") return;
    const s = source;
    setSource(target);
    setTarget(s);
    setInput(output);
    setOutput(input);
  }

  const pct = usage && usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Translate</h1>
          <p className="text-sm text-slate-500">Signed in as {email || "…"}</p>
        </div>
        <div className="text-right">
          <div className="text-xs mb-1.5">
            <Link href="/dashboard/chat" className="text-brand-600 font-medium hover:underline">Chat</Link>
            <span className="text-slate-300 mx-1.5">·</span>
            <Link href="/dashboard/clipboard" className="text-brand-600 font-medium hover:underline">Clipboard</Link>
            <span className="text-slate-300 mx-1.5">·</span>
            <Link href="/dashboard/settings" className="text-slate-500 hover:text-brand-600">Settings</Link>
          </div>
          <div className="text-sm text-slate-600">
            Plan: <span className="font-semibold capitalize">{usage?.plan || "…"}</span> ·{" "}
            {usage ? `${((usage.used || 0) / 1000).toFixed(1)}k / ${(usage.limit / 1000).toLocaleString()}k chars` : "…"}
          </div>
          <div className="w-48 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
          </div>
          <button onClick={() => router.push("/billing")} className="text-xs text-brand-600 font-medium mt-1 hover:underline">
            Upgrade plan →
          </button>
        </div>
      </div>

      {usage?.plan === "free" && (
        <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <span><b>Free trial:</b> limited to {((usage?.limit || 0) / 1000).toFixed(1)}k chars/month. Upgrade to Pro for more usage.</span>
          <button onClick={() => router.push("/billing")} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap">Upgrade now</button>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-center justify-between gap-3">
          <span>{error}</span>
          {error.includes("limit") && (
            <button onClick={() => router.push("/billing")} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap">
              Upgrade now
            </button>
          )}
        </div>
      )}

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {/* Input */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="border-b border-slate-100 p-3 flex items-center gap-2">
            <select value={source} onChange={(e) => setSource(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option value="auto">Auto detect</option>
              {TARGET_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <button onClick={swap} className="ml-auto text-slate-400 hover:text-brand-600 text-lg" title="Swap languages">⇄</button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text here…"
            className="w-full h-64 p-4 resize-none focus:outline-none text-base"
            maxLength={5000}
          />
          <div className="border-t border-slate-100 p-3 flex items-center justify-between text-xs text-slate-400">
            <span>{input.length} / 5000</span>
            <button onClick={doTranslate} disabled={loading || !input.trim()}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-5 py-2 rounded-lg font-semibold text-sm">
              {loading ? "Translating…" : "Translate"}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="border-b border-slate-100 p-3 flex items-center gap-2">
            <select value={target} onChange={(e) => setTarget(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white">
              {TARGET_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <button
              onClick={() => { navigator.clipboard?.writeText(output); }}
              className="ml-auto text-xs text-slate-500 hover:text-brand-600"
            >Copy</button>
          </div>
          <div className="h-64 p-4 overflow-auto text-base whitespace-pre-wrap">
            {loading ? <span className="text-slate-400">Translating…</span> : output || <span className="text-slate-300">Translation appears here</span>}
          </div>
          <div className="border-t border-slate-100 p-3 text-xs text-slate-400">{provider ? `Provider: ${provider === "deepl" ? "DeepL" : provider === "google" ? "Google Translate" : "No translation needed"}` : "Translation provider is selected securely on the server"}</div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/"))}
          className="text-sm text-slate-400 hover:text-red-500">Log out</button>
      </div>
    </div>
  );
}
