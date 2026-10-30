'use client';

import { useRef, useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'मेरे ड्राफ़्ट्स की सूची दिखाओ',
  'इस विषय पर एक ड्राफ़्ट बनाओ: ',
  'मेरे आख़िरी ड्राफ़्ट के लिए 3 शीर्षक सुझाओ',
];

export function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;

    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setError(null);
    setBusy(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; reply?: string; error?: string } | null;
      if (!res.ok || !data?.ok || !data.reply) {
        setError(data?.error ?? 'एजेंट से जवाब नहीं मिला।');
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply as string }]);
    } catch {
      setError('नेटवर्क त्रुटि। कृपया फिर से कोशिश करें।');
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }));
    }
  };

  return (
    <section className="mt-4 rounded-xl bg-white p-3 shadow-sm sm:p-4">
      <header className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-bold">संपादकीय सहायक</h2>
        <span className="text-xs text-neutral-500">ड्राफ़्ट बनाएँ, सुधारें, शीर्षक सुझाएँ — प्रकाशन आप स्वयं करेंगे</span>
      </header>

      <div ref={listRef} className="max-h-[360px] space-y-2 overflow-y-auto rounded-lg bg-neutral-50 p-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="rounded-full border bg-white px-3 py-1.5 text-xs text-neutral-700 hover:border-brand"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`whitespace-pre-wrap rounded-lg p-2.5 text-sm ${m.role === 'user' ? 'ml-8 bg-white' : 'mr-8 bg-red-50'}`}>
            {m.content}
          </div>
        ))}

        {busy && (
          <div className="mr-8 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-sm text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> सोच रहा है…
          </div>
        )}
      </div>

      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={2}
          placeholder="जैसे: मेरे ड्राफ़्ट में बाढ़ पर एक ख़बर लिखो…"
          aria-label="संपादकीय सहायक को संदेश"
          disabled={busy}
          className="min-h-[44px] flex-1"
        />
        <Button type="submit" disabled={busy || !input.trim()} aria-label="भेजें">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
}
