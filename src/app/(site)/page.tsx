import { getArticles, getCategories, getStories, getTrending, toCard } from '@/lib/data';
import { HeroGrid } from '@/components/home/hero-grid';
import { CategoryTabs } from '@/components/home/category-tabs';
import { WebStories } from '@/components/home/web-stories';
import { Sidebar } from '@/components/home/sidebar';
import { NewsBlock } from '@/components/home/news-block';
import { ArticleCard } from '@/components/home/article-card';
import { FreshNews } from '@/components/home/fresh-news';
import { getFreshNews } from '@/lib/gnews';

export const revalidate = 60;

const TAB_SLUGS = ['khel', 'manoranjan', 'business', 'technology', 'health', 'education', 'food'];
const BLOCK_SLUGS = ['desh', 'duniya', 'health', 'education', 'food'];

export default async function HomePage() {
  const [all, categories, trending, stories, freshNews] = await Promise.all([
    getArticles({ limit: 40 }), getCategories(), getTrending(5), getStories(), getFreshNews(8),
  ]);
  if (all.length === 0) {
    return <p className="py-20 text-center text-neutral-500">अभी कोई ख़बर प्रकाशित नहीं हुई है।</p>;
  }

  const [lead, ...rest] = all;
  const side = rest.slice(0, 3);
  const latest = rest.slice(3, 9);

  const tabs = TAB_SLUGS.map((slug) => {
    const c = categories.find((x) => x.slug === slug);
    return c ? { slug, name: c.name_hi, articles: all.filter((a) => a.category_slug === slug).slice(0, 5).map(toCard) } : null;
  }).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const blocks = BLOCK_SLUGS.map((slug) => {
    const c = categories.find((x) => x.slug === slug);
    return c ? { slug, name: c.name_hi, articles: all.filter((a) => a.category_slug === slug).map(toCard) } : null;
  }).filter((b): b is NonNullable<typeof b> => Boolean(b));

  return (
    <div className="space-y-8">
      <HeroGrid lead={lead} side={side} />
      <WebStories stories={stories} />
      <FreshNews items={freshNews} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <section aria-label="ताज़ा ख़बरें">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-6 w-1.5 rounded bg-brand" />
              <h2 className="text-xl font-bold">ताज़ा ख़बरें</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {latest.map((a) => <ArticleCard key={a.id} article={toCard(a)} variant="horizontal" />)}
            </div>
          </section>

          {tabs.length > 0 && <CategoryTabs tabs={tabs} />}
          {blocks.map((b) => <NewsBlock key={b.slug} title={b.name} slug={b.slug} articles={b.articles} />)}
        </div>
        <Sidebar trending={trending} />
      </div>
    </div>
  );
}
