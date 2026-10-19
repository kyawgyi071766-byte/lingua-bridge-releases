'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LANGUAGES } from '@/lib/languages';
import { loadSettings } from '@/lib/settings';
import { clearMobileMemory, getMobileStorage, LatestMobileRequest, loadMobileMemory, saveMobileMemory, type MobileTranslation } from '@/lib/mobile-translation-memory';

const targetLangs = LANGUAGES.filter(language => language.code !== 'auto');
export default function SharePage() {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('en');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);
  const [remember, setRemember] = useState(false);
  const [history, setHistory] = useState<MobileTranslation[]>([]);
  const requests = useRef(new LatestMobileRequest());

  useEffect(() => {
    let alive = true;
    setTarget(loadSettings().theirLang || 'en');
    // Consume the share only after authentication succeeds, so retry/login cannot lose it.
    fetch('/api/auth/me', {cache:'no-store'}).then(async response => {
      if (response.status === 401) {
        location.replace('/login?next=/dashboard/share');
        return;
      }
      if (!response.ok) throw new Error('Could not check your session. Reload to retry.');
      const user = await response.json();
      if (!alive) return;
      if (typeof user.email !== 'string' || !user.email) throw new Error('Please sign in again.');
      setEmail(user.email);
      let shared = '';
      try {
        shared = sessionStorage.getItem('lingua_shared_text') || '';
        sessionStorage.removeItem('lingua_shared_text');
      } catch { setNotice('Shared text could not be restored. Paste it below.'); }
      setText(Array.from(shared).slice(0,5000).join(''));
      setReady(true);
    }).catch(error => { if (alive) setError(error.message || 'Could not check your session.'); });
    return () => { alive = false; requests.current.cancel(); };
  }, []);

  function changed() {
    requests.current.cancel();
    setLoading(false);
    setOutput('');
    setError('');
    setNotice('');
  }

  async function translate() {
    if (!ready || !text.trim()) return;
    const original = text, language = target;
    const request = requests.current.begin();
    setOutput(''); setError(''); setNotice('');
    if (remember) {
      const cached = loadMobileMemory(getMobileStorage(),email).find(r => r.text === original && r.target === language);
      if (cached) { setOutput(cached.translated); setLoading(false); setNotice('Restored from this device.'); return; }
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      if (request.current()) {
        requests.current.cancel();
        setLoading(false);
        setError('Translation timed out. Please retry.');
      }
    },30000);
    try {
      const response = await fetch('/api/translate', {
        method:'POST', signal:request.signal, headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text:original,targetLang:language})
      });
      const data = await response.json().catch(() => ({}));
      if (!request.current()) return;
      if (!response.ok) throw new Error(data.error || 'Translation failed.');
      if (typeof data.translated !== 'string' || !data.translated.trim()) throw new Error('No translation returned. Please retry.');
      setOutput(data.translated);
      if (remember) {
        if (!saveMobileMemory(getMobileStorage(),email,{text:original,target:language,translated:data.translated,at:Date.now()})) {
          setNotice('Translation succeeded, but this device could not save history.');
        }
        setHistory(loadMobileMemory(getMobileStorage(),email).reverse());
      }
    } catch (error) {
      if (request.current()) setError(error instanceof Error ? error.message : 'Network error. Please retry.');
    } finally {
      clearTimeout(timeout);
      if (request.current()) setLoading(false);
    }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(output); setNotice('Copied. Paste into your messaging app.'); }
    catch { setError('Copy was blocked. Select and copy the translation manually.'); }
  }
  async function share() {
    try { await navigator.share({text:output}); }
    catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setError('Sharing failed. Use Copy instead.');
    }
  }
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Shared Text Translate</h1>
        <Link href="/dashboard" className="text-brand-600">Dashboard</Link>
      </div>
      <p className="text-sm text-slate-500 mb-4">Share or select text in another app, choose Lingua, then review and translate. You control when text is sent.</p>
      <label className="block text-sm mb-2" htmlFor="shared-text">Original text (you can correct it)</label>
      <textarea id="shared-text" value={text} maxLength={5000} rows={6}
        onChange={event=>{changed();setText(event.target.value);}}
        className="w-full border rounded-xl p-4" placeholder="Share from another app, or paste here." />
      <label className="block my-4">Translate to
        <select aria-label="Target language" value={target}
          onChange={event=>{changed();setTarget(event.target.value);}} className="ml-3 border rounded-lg p-2">
          {targetLangs.map(language=><option key={language.code} value={language.code}>{language.name}</option>)}
        </select>
      </label>
      <button onClick={translate} disabled={!ready || loading || !text.trim()} className="bg-brand-600 text-white rounded-lg px-5 py-3 disabled:opacity-50">
        {loading ? 'Translating…' : 'Translate'}
      </button>
      {error && <p role="alert" className="my-4 text-red-700">{error}</p>}
      {notice && <p role="status" className="my-4 text-slate-600">{notice}</p>}
      <div aria-live="polite" className="my-5 border rounded-xl p-5 whitespace-pre-wrap select-text">{output || 'Translation appears here.'}</div>
      {output && <div className="flex gap-3">
        <button onClick={copy} className="border rounded-lg px-4 py-2">Copy translation</button>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' &&
          <button onClick={share} className="border rounded-lg px-4 py-2">Share translation</button>}
      </div>}
      <label className="block mt-8 text-sm">
        <input type="checkbox" checked={remember} disabled={!ready} onChange={event=>{
          changed();setRemember(event.target.checked);
          setHistory(event.target.checked ? loadMobileMemory(getMobileStorage(),email).reverse() : []);
        }} /> Remember translations on this device for this account
      </label>
      <p className="text-xs text-slate-500 mt-2">Off by default. Saved messages remain on this device until cleared. Only exact text and language matches are reused; edited text gets a new translation.</p>
      {remember && <section className="mt-4" aria-label="Translation history">
        <button onClick={()=>{
          changed();
          if (clearMobileMemory(getMobileStorage(),email)) setHistory([]);
          else setError('Could not clear history. Check browser storage settings.');
        }} className="text-sm underline">Clear saved history for this account</button>
        <ul className="mt-3 space-y-2">{history.map((item,index)=><li key={item.at+':'+index}>
          <button className="w-full border rounded-lg p-3 text-left" onClick={()=>{
            changed();setText(item.text);setTarget(item.target);setOutput(item.translated);
          }}>{item.text.slice(0,100)} → {item.translated.slice(0,100)}</button>
        </li>)}</ul>
      </section>}
    </div>
  );
}
