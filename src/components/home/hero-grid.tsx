import Link from 'next/link';
import type { Article } from '@/lib/types';
import { timeAgoHi } from '@/lib/utils';

export function HeroGrid({ lead, side }: { lead: Article; side: Article[] }) {
  return (
    <section aria-label="मुख्य ख़बरें" className="grid gap-4 lg:grid-cols-3">
      <Link href={`/news/${lead.category_slug}/${lead.slug}`} className="group relative block overflow-hidden rounded-xl bg-neutral-900 lg:col-span-2">
        <div className="aspect-[16/10] w-full sm:aspect-[16/9]">
          {lead.featured_image && (
            <img src={lead.featured_image} alt="" className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <span className="inline-flex items-center gap-1.5 rounded bg-brand px-2 py-1 text-xs font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> ब्रेकिंग · {lead.category_name}
          </span>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-white drop-shadow sm:text-4xl">{lead.title_hi}</h1>
          <p className="mt-2 hidden max-w-2xl text-sm text-neutral-200 sm:block">{lead.excerpt_hi}</p>
          <p className="mt-2 text-xs text-neutral-300">{timeAgoHi(lead.published_at)}</p>
        </div>
      </Link>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {side.slice(0, 3).map((a) => (
          <Link key={a.id} href={`/news/${a.category_slug}/${a.slug}`} className="group flex gap-3 rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 transition hover:shadow-md sm:flex-col lg:flex-row">
            <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-neutral-200 sm:h-auto sm:w-full sm:aspect-video lg:aspect-auto lg:h-24 lg:w-32">
              {a.featured_image && <img src={a.featured_image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
            </div>
            <div className="min-w-0 self-center">
              <span className="text-xs font-bold text-brand">{a.category_name}</span>
              <h2 className="line-clamp-3 text-sm font-bold leading-snug group-hover:text-brand sm:text-base">{a.title_hi}</h2>
              <p className="mt-1 text-xs text-neutral-500">{timeAgoHi(a.published_at)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
