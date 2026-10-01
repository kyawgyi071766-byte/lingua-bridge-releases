"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LANGUAGES } from "@/lib/languages";
import { loadSettings } from "@/lib/settings";

const targetLangs = LANGUAGES.filter((l) => l.code !== "auto");

export default function ClipboardPage() {
  const router = useRouter();
  const [target, setTarget] = useState("en");
  const [original, setOriginal] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoCopied, setAutoCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => { if (!r.ok) router.push("/login?next=/dashboard/clipboard"); });
    const s = loadSettings();
    setTarget(s.theirLang || "en");
  }, [router]);

  async function readAndTranslate() {
    setError("");
    setOutput("");
    setAutoCopied(false);
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      setError("Could not read clipboard. On iPhone, allow paste permission, or paste manually below.");
      return;
    }
    if (!text.trim()) { setError("Clipboard is empty. Copy some text from any app first."); return; }
    setOriginal(text);
    setLoading(true);
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang: target }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setOutput(data.translated);
      try {
        await navigator.clipboard.writeText(data.translated);
        setAutoCopied(true);
      } catch { /* clipboard write blocked — user can tap copy */ }
    } else {
      setError(data.error || "Translation failed.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clipboard Translate</h1>
          <p className="text-sm text-slate-500 mt-1">Works in every app — copy, open Lingua, paste back.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="text-sm text-slate-500">Translate to</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
          {targetLangs.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      <button onClick={readAndTranslate} disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-brand-600/20">
        {loading ? "Translating…" : "📋 Read clipboard & translate"}
      </button>

      {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}
      {autoCopied && <div className="mt-4 bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl">Translation auto-copied to clipboard — just paste back into your app. ✓</div>}

      {original && (
        <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-xs text-slate-500 mb-1">Copied text</div>
          <div className="text-slate-800 whitespace-pre-wrap">{original}</div>
        </div>
      )}
      {output && (
        <div className="mt-3 bg-brand-50 border border-brand-200 rounded-2xl p-4">
          <div className="text-xs text-brand-500 mb-1">Translation</div>
          <div className="text-brand-900 whitespace-pre-wrap">{output}</div>
          <button onClick={() => navigator.clipboard?.writeText(output)}
            className="mt-3 text-sm bg-brand-600 text-white px-4 py-2 rounded-lg font-semibold">Copy again</button>
        </div>
      )}

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">
        <div className="font-semibold text-slate-700 mb-2">How to use with any app</div>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>In WhatsApp / Telegram / Messenger / Instagram / Line / Zalo / TikTok etc., long-press a message → Copy.</li>
          <li>Open the Lingua app (install to home screen for one-tap access).</li>
          <li>Tap the big button above — translation is auto-copied.</li>
          <li>Switch back to your app and Paste.</li>
        </ol>
      </div>
    </div>
  );
}
