'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { ArticleCardData } from '@/lib/types';
import { Button } from '@/components/ui/button';

/**
 * पेज के नीचे पहुँचते ही "अगली ख़बर" का प्रीव्यू खुलता है और
 * स्क्रॉल जारी रखने पर और ख़बरें (इन्फ़िनिट स्क्रॉल) लोड होती हैं।
 */
export function NextArticle({ items }: { items: ArticleCardData[] }) {
  const [shown, setShown] = useState(0); // 0 = अभी कुछ नहीं दिखा
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      setLoading(true);
      setTimeout(() => {
        setShown((s) => Math.min(items.length, s === 0 ? 1 : s + 2));
        setLoading(false);
      }, 450);
    }, { rootMargin: '0px 0px 120px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, shown]);

  if (!items.length) return null;
  const [first, ...more] = items.slice(0, shown);

  return (
    <section className="mt-10" aria-label="अगली ख़बर">
      {first && (
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden rounded-xl bg-neutral-900 text-white">
          <div className="grid md:grid-cols-2">
            <div className="aspect-video md:aspect-auto">
              {first.featured_image && <img src={first.featured_image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-col justify-center gap-3 p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-red-300">अगली ख़बर · {first.category_name}</span>
              <h3 className="text-2xl font-bold leading-snug">{first.title_hi}</h3>
              <p className="line-clamp-2 text-sm text-neutral-300">{first.excerpt_hi}</p>
              <Button asChild className="w-fit">
                <Link href={`/news/${first.category_slug}/${first.slug}`}>पूरी ख़बर पढ़ें <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {more.length > 0 && (
        <div className="mt-5 space-y-3">
          <h2 className="text-lg font-bold">और ख़बरें</h2>
          {more.map((a) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Link href={`/news/${a.category_slug}/${a.slug}`} className="group flex gap-3 rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5 hover:shadow-md">
                <div className="h-24 w-36 shrink-0 overflow-hidden rounded bg-neutral-200">
                  {a.featured_image && <img src={a.featured_image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-brand">{a.category_name}</span>
                  <p className="line-clamp-2 font-bold group-hover:text-brand">{a.title_hi}</p>
                  <p className="line-clamp-1 text-sm text-neutral-500">{a.excerpt_hi}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div ref={sentinel} className="flex h-16 items-center justify-center text-sm text-neutral-500">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> और ख़बरें लोड हो रही हैं…</> : shown >= items.length ? 'आप सभी ताज़ा ख़बरें पढ़ चुके हैं।' : ''}
      </div>
    </section>
  );
}
