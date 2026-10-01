'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LANGUAGES } from '@/lib/languages';
import { loadSettings } from '@/lib/settings';

const targetLangs = LANGUAGES.filter((language) => language.code !== 'auto');

export default function SharePage() {
  const [sharedText, setSharedText] = useState('');
  const [target, setTarget] = useState('en');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const settings = loadSettings();
    setTarget(settings.theirLang || 'en');
    const stored = sessionStorage.getItem('lingua_shared_text') || '';
    if (stored) {
      setSharedText(stored);
      sessionStorage.removeItem('lingua_shared_text');
    }
  }, []);

  useEffect(() => {
    if (sharedText) void doTranslate(sharedText, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedText, target]);

  async function doTranslate(text: string, targetLanguage: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setOutput('');
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang: targetLanguage }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setOutput(data.translated);
    else setError(data.error || 'Translation failed.');
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shared Text</h1>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">← Dashboard</Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
        <div className="text-xs text-slate-500 mb-1">Original (shared from another app)</div>
        <div className="text-slate-800 whitespace-pre-wrap">{sharedText || <span className="text-slate-300">No shared text found. Use your phone&apos;s Share menu and pick Lingua.</span>}</div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-slate-500">Translate to</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
          {targetLangs.map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}
        </select>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>}

      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 min-h-[100px]">
        <div className="text-xs text-brand-500 mb-1">Translation</div>
        <div className="text-brand-900 whitespace-pre-wrap">
          {loading ? 'Translating…' : output || <span className="text-brand-300">—</span>}
        </div>
        {output && (
          <button
            onClick={() => { navigator.clipboard?.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="mt-3 bg-brand-600 text-white text-sm px-4 py-2 rounded-lg font-semibold"
          >{copied ? 'Copied ✓' : 'Copy translation'}</button>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Shared text is transferred through session storage on this device and is removed after Lingua opens it; it is not placed in the share URL.
      </p>
    </div>
  );
}
