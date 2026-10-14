import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ArticleCardData } from '@/lib/types';
import { ArticleCard } from './article-card';

export function NewsBlock({ title, slug, articles }: { title: string; slug: string; articles: ArticleCardData[] }) {
  if (!articles.length) return null;
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-6 w-1.5 rounded bg-brand" />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <Link href={`/category/${slug}`} className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
          सभी देखें <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {articles.slice(0, 3).map((a) => <ArticleCard key={a.id} article={a} />)}
      </div>
    </section>
  );
}
