import { ExternalLink } from 'lucide-react';
import type { GNewsItem } from '@/lib/gnews';

export function FreshNews({ items }: { items: GNewsItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="ताज़ा अपडेट" className="border-y border-neutral-200 bg-white py-5">
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Live from trusted sources</p>
          <h2 className="text-2xl font-bold">ताज़ा अपडेट</h2>
        </div>
        <span className="hidden text-xs text-neutral-500 sm:block">बाहरी स्रोत · मूल खबर के लिए स्रोत पर जाएँ</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-lg border bg-white transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
            <div className="aspect-[16/9] bg-neutral-100">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" loading="lazy" />}</div>
            <div className="p-3">
              <p className="text-[11px] font-bold text-brand">{item.source?.name ?? 'समाचार स्रोत'}</p>
              <h3 className="mt-1 line-clamp-3 text-base font-bold leading-snug group-hover:text-brand">{item.title}</h3>
              {item.description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-neutral-500">{item.description}</p>}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500">मूल खबर पढ़ें <ExternalLink className="h-3.5 w-3.5" /></span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
