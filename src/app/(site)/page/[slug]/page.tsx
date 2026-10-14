import { notFound } from 'next/navigation';
import { getSiteSettings } from '@/lib/data';
import { markdownToBlocks } from '@/lib/content';
import { ContentRenderer } from '@/components/article/content-renderer';

export const revalidate = 60;

export default async function StaticPage({ params }: { params: { slug: string } }) {
  const s = await getSiteSettings();
  const page = s.static_pages.find((p) => p.slug === params.slug);
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm sm:p-10">
      <h1 className="mb-4 text-3xl font-bold">{page.title}</h1>
      <ContentRenderer blocks={markdownToBlocks(page.body)} />
    </div>
  );
}
