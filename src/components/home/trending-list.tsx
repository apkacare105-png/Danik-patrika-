import Link from 'next/link';
import type { Article } from '@/lib/types';
import { compactViews, toHiDigits } from '@/lib/utils';

export function TrendingList({ items }: { items: Article[] }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5" aria-label="ट्रेंडिंग न्यूज़">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-6 w-1.5 rounded bg-brand" />
        <h2 className="text-lg font-bold">ट्रेंडिंग न्यूज़</h2>
      </div>
      <ol className="divide-y">
        {items.slice(0, 5).map((a, i) => (
          <li key={a.id}>
            <Link href={`/news/${a.category_slug}/${a.slug}`} className="group flex gap-3 py-3">
              <span className="font-display text-4xl leading-none text-brand/30 transition-colors group-hover:text-brand">{toHiDigits(i + 1)}</span>
              <div>
                <p className="line-clamp-3 text-sm font-semibold leading-snug group-hover:text-brand">{a.title_hi}</p>
                <p className="mt-1 text-xs text-neutral-500">{compactViews(a.views)} बार पढ़ी गई</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
