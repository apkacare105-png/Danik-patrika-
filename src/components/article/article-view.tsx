'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, Clock, Link2, MessageCircle, Pause, Twitter, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Article } from '@/lib/types';
import { plainText, countWords, readingMinutes } from '@/lib/content';
import { formatDateHi } from '@/lib/utils';
import { incrementViews } from '@/actions/public';
import { ContentRenderer } from './content-renderer';

const SIZES = [0.9, 1, 1.15, 1.3, 1.5];

/** क्लाइंट-साइड लेख: टेक्स्ट साइज़, फ़्लोटिंग एक्शन बार, ख़बर सुनें, बुकमार्क */
export function ArticleView({ article, adNode }: { article: Article; adNode?: React.ReactNode }) {
  const [sizeIdx, setSizeIdx] = useState(1);
  const [bookmarked, setBookmarked] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const utter = useRef<SpeechSynthesisUtterance | null>(null);
  const key = 'di-bookmarks';

  const text = plainText(article.content_hi.blocks);
  const words = countWords(text);

  useEffect(() => {
    incrementViews(article.slug);
    try {
      const saved = JSON.parse(localStorage.getItem('di-text-size') ?? '1');
      if (Number.isInteger(saved) && saved >= 0 && saved < SIZES.length) setSizeIdx(saved);
      const list: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      setBookmarked(list.includes(article.id));
    } catch { /* स्टोरेज उपलब्ध नहीं */ }
    return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); };
  }, [article.id, article.slug]);

  const changeSize = (d: number) => {
    const n = d === 0 ? 1 : Math.min(SIZES.length - 1, Math.max(0, sizeIdx + d));
    setSizeIdx(n);
    try { localStorage.setItem('di-text-size', String(n)); } catch { /* ignore */ }
  };

  const toggleBookmark = () => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      const next = list.includes(article.id) ? list.filter((x) => x !== article.id) : [...list, article.id];
      localStorage.setItem(key, JSON.stringify(next));
      setBookmarked(next.includes(article.id));
      toast.success(next.includes(article.id) ? 'ख़बर बुकमार्क में सहेजी गई' : 'बुकमार्क हटाया गया');
    } catch {
      setBookmarked((b) => !b);
    }
  };

  const toggleAudio = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) { toast.error('आपके ब्राउज़र में ऑडियो रीडर उपलब्ध नहीं है'); return; }
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(`${article.title_hi}। ${text}`);
    u.lang = 'hi-IN';
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utter.current = u;
    synth.speak(u);
    setSpeaking(true);
    toast('ख़बर सुनाई जा रही है…');
  }, [speaking, article.title_hi, text]);

  const url = () => (typeof window !== 'undefined' ? window.location.href : '');
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${article.title_hi} ${url()}`)}`, '_blank', 'noopener');
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title_hi)}&url=${encodeURIComponent(url())}`, '_blank', 'noopener');
  const copy = async () => {
    try { await navigator.clipboard.writeText(url()); toast.success('लिंक कॉपी हो गया'); } catch { toast.error('लिंक कॉपी नहीं हो सका'); }
  };

  const actions = [
    { label: 'WhatsApp पर शेयर करें', icon: MessageCircle, onClick: shareWhatsApp, cls: 'hover:bg-emerald-500 hover:text-white' },
    { label: 'Twitter पर शेयर करें', icon: Twitter, onClick: shareTwitter, cls: 'hover:bg-sky-500 hover:text-white' },
    { label: 'लिंक कॉपी करें', icon: Link2, onClick: copy, cls: 'hover:bg-neutral-800 hover:text-white' },
    { label: bookmarked ? 'बुकमार्क हटाएँ' : 'बुकमार्क करें', icon: bookmarked ? BookmarkCheck : Bookmark, onClick: toggleBookmark, cls: bookmarked ? 'bg-brand text-white' : 'hover:bg-brand hover:text-white' },
  ];

  return (
    <article>
      <nav aria-label="ब्रेडक्रम्ब" className="mb-3 text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand">होम</Link> <span className="mx-1">/</span>
        <Link href={`/category/${article.category_slug}`} className="font-semibold text-brand hover:underline">{article.category_name}</Link>
      </nav>

      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{article.title_hi}</h1>
      <p className="mt-3 text-lg text-neutral-600">{article.excerpt_hi}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y py-3 text-sm">
        <div className="text-neutral-600">
          <span className="font-semibold text-neutral-900">{article.author_name}</span>
          <span className="mx-2">·</span>{formatDateHi(article.published_at, { time: true })}
          <span className="mx-2">·</span><Clock className="mb-0.5 inline h-3.5 w-3.5" /> {readingMinutes(words)} मिनट का पाठ
        </div>

        <div className="flex items-center gap-2">
          {/* टेक्स्ट साइज़ */}
          <div className="flex items-center overflow-hidden rounded-md border" role="group" aria-label="अक्षर का आकार">
            <button onClick={() => changeSize(-1)} className="px-2.5 py-1 text-xs hover:bg-neutral-100" aria-label="अक्षर छोटे करें">A-</button>
            <button onClick={() => changeSize(0)} className="border-x px-2.5 py-1 text-sm font-semibold hover:bg-neutral-100" aria-label="सामान्य आकार">A</button>
            <button onClick={() => changeSize(1)} className="px-2.5 py-1 text-base font-bold hover:bg-neutral-100" aria-label="अक्षर बड़े करें">A+</button>
          </div>
          <button
            onClick={toggleAudio}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${speaking ? 'bg-brand text-white' : 'border hover:bg-neutral-100'}`}
          >
            {speaking ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {speaking ? 'रोकें' : 'खबर सुनें'}
          </button>
        </div>
      </div>

      {article.featured_image && (
        <figure className="mt-5">
          <img src={article.featured_image} alt={article.title_hi} className="w-full rounded-xl object-cover" />
        </figure>
      )}

      <div className="mt-6 transition-[font-size] duration-200" style={{ fontSize: `${SIZES[sizeIdx]}rem` }}>
        <ContentRenderer blocks={article.content_hi.blocks} adNode={adNode} adAfter={2} />
      </div>

      {/* डेस्कटॉप: बाईं ओर फ़्लोटिंग बार */}
      <motion.div
        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
        className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 rounded-full bg-white p-2 shadow-xl ring-1 ring-black/10 xl:flex"
      >
        {actions.map((a) => (
          <button key={a.label} onClick={a.onClick} title={a.label} aria-label={a.label} className={`rounded-full p-2.5 text-neutral-700 transition ${a.cls}`}>
            <a.icon className="h-5 w-5" />
          </button>
        ))}
      </motion.div>

      {/* मोबाइल: नीचे फ़्लोटिंग बार */}
      <div className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full bg-white p-1.5 shadow-xl ring-1 ring-black/10 xl:hidden">
        {actions.map((a) => (
          <button key={a.label} onClick={a.onClick} aria-label={a.label} className={`rounded-full p-2.5 text-neutral-700 transition ${a.cls}`}>
            <a.icon className="h-5 w-5" />
          </button>
        ))}
        <button onClick={toggleAudio} aria-label="खबर सुनें" className={`rounded-full p-2.5 ${speaking ? 'bg-brand text-white' : 'text-neutral-700'}`}>
          {speaking ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>
    </article>
  );
}
