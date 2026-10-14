import Link from 'next/link';

/** "ताज़ा ख़बर" टिकर — CSS marquee, माउस ले जाने पर रुक जाता है */
export function BreakingTicker({ items }: { items: { title: string; href: string }[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items]; // निर्बाध लूप के लिए दोहराव
  return (
    <div className="bg-neutral-900 text-white" role="region" aria-label="ताज़ा ख़बर">
      <div className="mx-auto flex max-w-7xl items-stretch">
        <span className="z-10 flex shrink-0 items-center gap-2 bg-brand px-3 py-2 text-sm font-bold sm:px-4">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          ताज़ा ख़बर
        </span>
        <div className="group relative flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee items-center whitespace-nowrap py-2 group-hover:[animation-play-state:paused]">
            {loop.map((it, i) => (
              <Link key={i} href={it.href} className="px-5 text-sm hover:text-red-300 hover:underline" aria-hidden={i >= items.length}>
                <span className="mr-2 text-brand">●</span>
                {it.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
