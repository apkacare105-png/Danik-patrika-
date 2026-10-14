'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ArticleCardData } from '@/lib/types';
import { formatDateHi } from '@/lib/utils';

type Tab = { slug: string; name: string; articles: ArticleCardData[] };

/** बिना पेज रीलोड के श्रेणी टैब बदलें — डेटा सर्वर से पहले ही आ चुका है */
export function CategoryTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.slug);
  const current = tabs.find((t) => t.slug === active);
  if (!current) return null;
  const [first, ...rest] = current.articles;

  return (
    <section aria-label="श्रेणी अनुसार ख़बरें" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2 border-b">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.slug}
              role="tab"
              aria-selected={t.slug === active}
              onClick={() => setActive(t.slug)}
              className={`relative whitespace-nowrap px-4 py-3 text-base font-bold transition-colors ${t.slug === active ? 'text-brand' : 'text-neutral-600 hover:text-brand'}`}
            >
              {t.name}
              {t.slug === active && <motion.span layoutId="cat-tab-underline" className="absolute inset-x-0 -bottom-px h-[3px] bg-brand" />}
            </button>
          ))}
        </div>
        <Link href={`/category/${current.slug}`} className="hidden items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand sm:flex">
          सभी देखें <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.slug}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="mt-4 grid gap-4 md:grid-cols-2"
        >
          {first ? (
            <Link href={`/news/${first.category_slug}/${first.slug}`} className="group block">
              <div className="aspect-video overflow-hidden rounded-lg bg-neutral-200">
                {first.featured_image && <img src={first.featured_image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
              </div>
              <h3 className="mt-3 text-xl font-bold leading-snug group-hover:text-brand">{first.title_hi}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{first.excerpt_hi}</p>
            </Link>
          ) : (
            <p className="text-neutral-500">इस श्रेणी में अभी कोई ख़बर नहीं है।</p>
          )}
          <ul className="divide-y">
            {rest.slice(0, 4).map((a) => (
              <li key={a.id}>
                <Link href={`/news/${a.category_slug}/${a.slug}`} className="group flex gap-3 py-3 first:pt-0">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-neutral-200">
                    {a.featured_image && <img src={a.featured_image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brand">{a.title_hi}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatDateHi(a.published_at, { short: true })}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
