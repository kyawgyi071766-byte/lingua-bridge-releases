'use client';

import { FormEvent, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

const QUICK_REPLIES = ['How to pay?', 'Pricing', 'My payment not detected', 'Talk to human'];

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi — I can help with Lingua pricing, USDT payments, and account support.' },
  ]);
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    const value = text.trim();
    if (!value || loading) return;
    const previous = messages.slice(-8);
    const next = [...messages, { role: 'user' as const, content: value }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value, history: previous }),
      });
      const data = await response.json().catch(() => ({}));
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.ok ? (data.reply || 'How can I help?') : (data.error || 'Support is temporarily unavailable.') },
      ]);
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'Support is temporarily unavailable. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[min(92vw,380px)] h-[520px] max-h-[72vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">Lingua Support</div>
              <div className="text-[11px] text-slate-300">AI assistant with human escalation</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close support" className="text-slate-300 hover:text-white text-xl">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${message.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400">Support is typing…</div>}
          </div>

          <div className="px-3 pt-3 flex gap-2 overflow-x-auto border-t border-slate-100 bg-white">
            {QUICK_REPLIES.map((reply) => (
              <button key={reply} onClick={() => void send(reply)} disabled={loading}
                className="whitespace-nowrap rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {reply}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="p-3 flex gap-2 bg-white">
            <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000}
              placeholder="Ask a question…" className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" />
            <button type="submit" disabled={loading || !input.trim()}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl px-4 text-sm font-semibold">Send</button>
          </form>
        </div>
      )}

      <button onClick={() => setOpen((value) => !value)} aria-label="Open customer support"
        className="ml-auto w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-xl grid place-items-center font-bold text-xl">
        {open ? '×' : '?'}
      </button>
    </div>
  );
}
