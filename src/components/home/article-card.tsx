import Link from 'next/link';
import type { ArticleCardData } from '@/lib/types';
import { cn, formatDateHi } from '@/lib/utils';

const href = (a: ArticleCardData) => `/news/${a.category_slug}/${a.slug}`;

export function ArticleCard({
  article, variant = 'vertical', className,
}: { article: ArticleCardData; variant?: 'vertical' | 'horizontal' | 'compact'; className?: string }) {
  if (variant === 'compact') {
    return (
      <Link href={href(article)} className={cn('group flex gap-3', className)}>
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-neutral-200">
          {article.featured_image && <img src={article.featured_image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />}
        </div>
        <p className="line-clamp-3 text-sm font-semibold leading-snug group-hover:text-brand">{article.title_hi}</p>
      </Link>
    );
  }
  if (variant === 'horizontal') {
    return (
      <Link href={href(article)} className={cn('group flex gap-3 rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5 transition hover:shadow-md', className)}>
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md bg-neutral-200 sm:h-28 sm:w-40">
          {article.featured_image && <img src={article.featured_image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <span className="text-xs font-bold text-brand">{article.category_name}</span>
          <h3 className="line-clamp-3 text-base font-bold leading-snug group-hover:text-brand">{article.title_hi}</h3>
        </div>
      </Link>
    );
  }
  return (
    <Link href={href(article)} className={cn('group block overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md', className)}>
      <div className="aspect-video overflow-hidden bg-neutral-200">
        {article.featured_image && <img src={article.featured_image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
      </div>
      <div className="p-3">
        <span className="text-xs font-bold text-brand">{article.category_name}</span>
        <h3 className="mt-1 line-clamp-3 text-base font-bold leading-snug group-hover:text-brand">{article.title_hi}</h3>
        <p className="mt-2 text-xs text-neutral-500">{formatDateHi(article.published_at, { short: true })}</p>
      </div>
    </Link>
  );
}
