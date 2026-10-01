"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LANGUAGES } from "@/lib/languages";
import { loadSettings, saveSettings, FONT_SIZE_PX, type ChatSettings } from "@/lib/settings";

interface Msg {
  id: number;
  side: "me" | "them";
  original: string;
  translated?: string;
  ts: number;
}

const MSG_KEY_PREFIX = "lingua_chat_msgs";
const targetLangs = LANGUAGES.filter((l) => l.code !== "auto");

export default function ChatPage() {
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{ text: string; side: "me" | "them"; translated: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(loadSettings());
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" }).then(async (response) => {
      if (!response.ok || !active) return;
      const data = await response.json();
      if (!active || typeof data.email !== "string") return;
      const key = `${MSG_KEY_PREFIX}:${encodeURIComponent(data.email.toLowerCase())}`;
      setStorageKey(key);
      try {
        const raw = localStorage.getItem(key);
        if (raw) setMsgs(JSON.parse(raw));
      } catch { /* ignore invalid local history */ }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, pending]);

  function persist(next: Msg[]) {
    setMsgs(next);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next.slice(-200)));
  }

  function updateSetting(patch: Partial<ChatSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  async function callTranslate(text: string, target: string, source?: string): Promise<string> {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang: target, sourceLang: source }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Translation failed");
    return data.translated;
  }

  // side=me  -> I typed it in my language, translate to their language
  // side=them -> I pasted their message in their language, translate to my language
  async function handleSend(side: "me" | "them") {
    if (!settings || !input.trim()) return;
    const text = input.trim();
    const target = side === "me" ? settings.theirLang : settings.myLang;
    setError("");
    if (!settings.autoTranslate) {
      persist([...msgs, { id: Date.now(), side, original: text, ts: Date.now() }]);
      setInput("");
      return;
    }
    setLoading(true);
    try {
      const translated = await callTranslate(text, target);
      setLoading(false);
      if (settings.confirmSend) {
        setPending({ text, side, translated });
      } else {
        persist([...msgs, { id: Date.now(), side, original: text, translated, ts: Date.now() }]);
        setInput("");
      }
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Translation failed.");
    }
  }

  function confirmPending() {
    if (!pending) return;
    persist([...msgs, { id: Date.now(), side: pending.side, original: pending.text, translated: pending.translated, ts: Date.now() }]);
    setPending(null);
    setInput("");
  }

  async function translateBubble(id: number) {
    if (!settings) return;
    const m = msgs.find((x) => x.id === id);
    if (!m) return;
    const target = m.side === "me" ? settings.theirLang : settings.myLang;
    try {
      const translated = await callTranslate(m.original, target);
      persist(msgs.map((x) => (x.id === id ? { ...x, translated } : x)));
    } catch (e: any) {
      setError(e?.message || "Translation failed.");
    }
  }

  if (!settings || !storageKey) return <div className="max-w-3xl mx-auto px-6 py-16 text-center text-slate-400">Loading…</div>;

  const tStyle = { fontSize: FONT_SIZE_PX[settings.fontSize], color: settings.translateColor };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="text-xl font-bold">Chat Translator</h1>
          <p className="text-xs text-slate-500">Auto-translate both sides of a conversation</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/dashboard" className="text-slate-500 hover:text-brand-600">Text mode</Link>
          <Link href="/dashboard/settings" className="text-slate-500 hover:text-brand-600">Settings</Link>
        </div>
      </div>

      {/* Language bar + toggles */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 w-16">I speak</span>
          <select value={settings.myLang} onChange={(e) => updateSetting({ myLang: e.target.value })}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 flex-1 min-w-[120px] bg-white">
            {targetLangs.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          <span className="text-slate-400">⇄</span>
          <span className="text-xs text-slate-500 w-16">They speak</span>
          <select value={settings.theirLang} onChange={(e) => updateSetting({ theirLang: e.target.value })}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 flex-1 min-w-[120px] bg-white">
            {targetLangs.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-5 text-sm flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.autoTranslate} onChange={(e) => updateSetting({ autoTranslate: e.target.checked })}
              className="w-4 h-4 accent-brand-600" />
            Auto Translate
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.confirmSend} onChange={(e) => updateSetting({ confirmSend: e.target.checked })}
              className="w-4 h-4 accent-brand-600" />
            Confirm &amp; send (preview before sending)
          </label>
          <button onClick={() => { persist([]); setError(""); }} className="text-xs text-slate-400 hover:text-red-500 ml-auto">
            Clear history
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>}

      {/* Messages */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 h-[420px] overflow-y-auto space-y-3 mb-4">
        {msgs.length === 0 && !pending && (
          <div className="h-full grid place-items-center text-slate-300 text-sm">
            Type a message below, or paste the other person&apos;s message and translate it.
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.side === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              m.side === "me" ? "bg-brand-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
            }`}>
              <div className="text-sm whitespace-pre-wrap">{m.original}</div>
              {m.translated ? (
                <div className="mt-1 pt-1 border-t border-white/20 whitespace-pre-wrap" style={tStyle}>{m.translated}</div>
              ) : (
                <button onClick={() => translateBubble(m.id)}
                  className="mt-1 text-xs underline opacity-70 hover:opacity-100">Translate</button>
              )}
            </div>
          </div>
        ))}

        {/* Confirm preview */}
        {pending && (
          <div className={`flex ${pending.side === "me" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-amber-50 border border-amber-300">
              <div className="text-xs text-amber-700 font-semibold mb-1">Preview — confirm to send</div>
              <div className="text-sm text-slate-800">{pending.text}</div>
              <div className="mt-1 pt-1 border-t border-amber-200" style={tStyle}>{pending.translated}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={confirmPending} className="bg-brand-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">Confirm send</button>
                <button onClick={() => setPending(null)} className="bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pending ? "Confirm or cancel the preview above…" : `Type in ${LANGUAGES.find(l=>l.code===settings.myLang)?.name || "your language"}, or paste their message…`}
          disabled={!!pending || loading}
          rows={2}
          className="w-full resize-none p-2 focus:outline-none text-sm"
          maxLength={5000}
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-slate-400">{input.length}/5000</span>
          <div className="flex gap-2">
            <button onClick={() => handleSend("them")} disabled={loading || !input.trim() || !!pending}
              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-sm px-4 py-2 rounded-lg font-medium">
              ← They said (translate for me)
            </button>
            <button onClick={() => handleSend("me")} disabled={loading || !input.trim() || !!pending}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg font-semibold">
              {loading ? "Translating…" : "I say → send translated"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
