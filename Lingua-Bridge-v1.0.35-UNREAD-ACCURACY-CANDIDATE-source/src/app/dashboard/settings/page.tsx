"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@/lib/languages";
import { loadSettings, saveSettings, DEFAULT_SETTINGS, type ChatSettings, type FontSize } from "@/lib/settings";
import DeviceManager from "@/components/DeviceManager";

const targetLangs = LANGUAGES.filter((l) => l.code !== "auto");
const FONT_SIZES: { id: FontSize; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
  { id: "maximum", label: "Maximum" },
];
const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2", "#db2777"];

export default function SettingsPage() {
  const router = useRouter();
  const [s, setS] = useState<ChatSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => { if (!r.ok) router.push("/login"); });
    setS(loadSettings());
  }, [router]);

  function update(patch: Partial<ChatSettings>) {
    if (!s) return;
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!s) return <div className="max-w-2xl mx-auto px-6 py-16 text-center text-slate-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Translation Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Global translation settings (apply to Chat mode)</p>
        </div>
        <Link href="/dashboard/chat" className="text-sm text-brand-600 font-medium hover:underline">← Back to chat</Link>
      </div>

      {saved && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl">Saved ✓</div>}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        {/* Languages */}
        <div>
          <div className="text-sm font-semibold text-slate-700 mb-3">Languages</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500">Source language (I speak)</label>
              <select value={s.myLang} onChange={(e) => update({ myLang: e.target.value })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                {targetLangs.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Translate to (they speak)</label>
              <select value={s.theirLang} onChange={(e) => update({ theirLang: e.target.value })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                {targetLangs.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <div className="text-sm font-semibold text-slate-700 mb-1">Behavior</div>
          <ToggleRow label="Auto Translate" desc="Automatically translate every message"
            checked={s.autoTranslate} onChange={(v) => update({ autoTranslate: v })} />
          <ToggleRow label="Translate before sending (Confirm & send)" desc="Show a translation preview before the message is added"
            checked={s.confirmSend} onChange={(v) => update({ confirmSend: v })} />
        </div>

        {/* Font size */}
        <div className="border-t border-slate-100 pt-5">
          <div className="text-sm font-semibold text-slate-700 mb-3">Translation Font Size</div>
          <div className="flex gap-4 flex-wrap">
            {FONT_SIZES.map((f) => (
              <label key={f.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="fontSize" checked={s.fontSize === f.id}
                  onChange={() => update({ fontSize: f.id })} className="accent-brand-600" />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="border-t border-slate-100 pt-5">
          <div className="text-sm font-semibold text-slate-700 mb-3">Translation Text Color</div>
          <div className="flex gap-3 flex-wrap items-center">
            {COLORS.map((c) => (
              <button key={c} onClick={() => update({ translateColor: c })}
                className={`w-8 h-8 rounded-full border-2 ${s.translateColor === c ? "border-slate-800 scale-110" : "border-white"}`}
                style={{ backgroundColor: c }} aria-label={c} />
            ))}
            <input type="color" value={s.translateColor}
              onChange={(e) => update({ translateColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-slate-300" />
            <span className="text-xs text-slate-400 font-mono">{s.translateColor}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Preview: <span style={{ color: s.translateColor, fontSize: { small: "12px", medium: "14px", large: "17px", maximum: "20px" }[s.fontSize] }}>
              Hello world — မင်္ဂလာပါ
            </span>
          </p>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <button onClick={() => { setS(DEFAULT_SETTINGS); saveSettings(DEFAULT_SETTINGS); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
            className="text-sm text-slate-400 hover:text-red-500">Reset to defaults</button>
        </div>
      </div>

      <DeviceManager />

      <p className="mt-6 text-xs text-slate-400">
        Settings are saved in your browser. Translation engine (DeepL / Google Translate), monthly quotas and device limits are enforced by the Lingua server.
      </p>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-brand-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}
