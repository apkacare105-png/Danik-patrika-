import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getArticleBySlug, getTrending, getUpNext, toCard } from '@/lib/data';
import { ArticleView } from '@/components/article/article-view';
import { NextArticle } from '@/components/article/next-article';
import { AdSlot } from '@/components/ad-slot';
import { TrendingList } from '@/components/home/trending-list';
import { Newsletter } from '@/components/home/newsletter';

export const revalidate = 60;

type Props = { params: { category: string; slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticleBySlug(params.slug);
  if (!a) return { title: 'ख़बर नहीं मिली' };
  return {
    title: a.title_hi,
    description: a.excerpt_hi,
    openGraph: { type: 'article', title: a.title_hi, description: a.excerpt_hi, images: a.featured_image ? [a.featured_image] : undefined, publishedTime: a.published_at },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();
  if (article.category_slug !== params.category) permanentRedirect(`/news/${article.category_slug}/${article.slug}`);

  const [trending, upNext] = await Promise.all([getTrending(5), getUpNext(article, 6)]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-8">
        <ArticleView article={article} adNode={<AdSlot placement="in_article" />} />
        <NextArticle items={upNext.map(toCard)} />
      </div>
      <aside className="space-y-5">
        <Newsletter />
        <TrendingList items={trending} />
        <div className="sticky top-32"><AdSlot placement="sidebar_sticky" /></div>
      </aside>
    </div>
  );
}
