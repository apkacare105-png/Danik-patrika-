import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticles, getCategories, getTrending, toCard } from '@/lib/data';
import { ArticleCard } from '@/components/home/article-card';
import { Sidebar } from '@/components/home/sidebar';

export const revalidate = 60;

type Props = { params: { slug: string }; searchParams: { sub?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = (await getCategories()).find((x) => x.slug === params.slug);
  return { title: c ? `${c.name_hi} की ताज़ा ख़बरें` : 'श्रेणी' };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === params.slug);
  if (!cat) notFound();
  const sub = cat.sub_categories.find((s) => s.slug === searchParams.sub);

  const [articles, trending] = await Promise.all([
    getArticles({ categorySlug: cat.slug, subCategoryId: sub?.id, limit: 30 }),
    getTrending(5),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-8 w-1.5 rounded bg-brand" />
          <h1 className="text-3xl font-bold">{cat.name_hi}{sub ? ` · ${sub.name_hi}` : ''}</h1>
        </div>

        {cat.sub_categories.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <Link href={`/category/${cat.slug}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${!sub ? 'bg-brand text-white' : 'bg-white ring-1 ring-black/10 hover:bg-neutral-100'}`}>सभी</Link>
            {cat.sub_categories.map((s) => (
              <Link key={s.id} href={`/category/${cat.slug}?sub=${s.slug}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${sub?.id === s.id ? 'bg-brand text-white' : 'bg-white ring-1 ring-black/10 hover:bg-neutral-100'}`}>
                {s.name_hi}
              </Link>
            ))}
          </div>
        )}

        {articles.length === 0 ? (
          <p className="rounded-xl bg-white p-10 text-center text-neutral-500">इस श्रेणी में अभी कोई ख़बर नहीं है।</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.id} article={toCard(a)} />)}
          </div>
        )}
      </div>
      <Sidebar trending={trending} />
    </div>
  );
}
