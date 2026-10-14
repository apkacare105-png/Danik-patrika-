'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { searchArticlesAction } from '@/actions/public';

type Result = Awaited<ReturnType<typeof searchArticlesAction>>[number];

const SUGGESTIONS = ['मेट्रो', 'क्रिकेट', 'शेयर बाज़ार', 'स्मार्टफोन', 'सेहत'];

export function SearchModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, start] = useTransition();
  const seq = useRef(0);

  // डिबाउंस्ड लाइव सर्च (Server Action)
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const id = ++seq.current;
    const t = setTimeout(() => {
      start(async () => {
        const r = await searchArticlesAction(q);
        if (id === seq.current) {
          setResults(r);
          setSearched(true);
        }
      });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12%] max-w-2xl translate-y-0 p-0" hideClose>
        <DialogTitle className="sr-only">ख़बरें खोजें</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4 py-3">
          {pending ? <Loader2 className="h-5 w-5 animate-spin text-brand" /> : <Search className="h-5 w-5 text-neutral-400" />}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ख़बर, विषय या श्रेणी खोजें…"
            className="flex-1 bg-transparent py-1 text-lg outline-none placeholder:text-neutral-400"
            aria-label="खोज"
          />
          <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-neutral-500">Esc</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {q.trim().length < 2 && (
            <div className="p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">लोकप्रिय खोजें</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setQ(s)} className="rounded-full bg-neutral-100 px-3 py-1 text-sm hover:bg-brand hover:text-white">{s}</button>
                ))}
              </div>
            </div>
          )}
          {searched && results.length === 0 && (
            <p className="p-6 text-center text-neutral-500">“{q}” के लिए कोई ख़बर नहीं मिली।</p>
          )}
          <ul>
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/news/${r.category_slug}/${r.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-100"
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-neutral-200">
                    {r.featured_image && <img src={r.featured_image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-brand">{r.category_name}</span>
                    <p className="line-clamp-2 text-sm font-semibold">{r.title_hi}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
