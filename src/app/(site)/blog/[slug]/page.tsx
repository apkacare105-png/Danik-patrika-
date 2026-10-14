import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogBySlug, getBlogs } from '@/lib/data';
import { ContentRenderer } from '@/components/article/content-renderer';
import { formatDateHi } from '@/lib/utils';

type Props = { params: { slug: string } };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blog = await getBlogBySlug(params.slug);
  if (!blog) return { title: 'ब्लॉग नहीं मिला' };
  return { title: blog.title_hi, description: blog.excerpt_hi, openGraph: { type: 'article', title: blog.title_hi, description: blog.excerpt_hi, images: blog.featured_image ? [blog.featured_image] : undefined } };
}

export default async function BlogPage({ params }: Props) {
  const blog = await getBlogBySlug(params.slug);
  if (!blog) notFound();
  const related = (await getBlogs(4)).filter((b) => b.id !== blog.id);
  return (
    <div className="mx-auto max-w-4xl">
      <article className="rounded-xl border bg-white px-4 py-6 shadow-sm sm:px-10 sm:py-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">COMMUNITY BLOG</span><span className="text-neutral-500">पाठक द्वारा लिखा गया</span></div>
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{blog.title_hi}</h1>
        <p className="mt-4 text-lg leading-8 text-neutral-600">{blog.excerpt_hi}</p>
        <div className="mt-5 border-y py-3 text-sm text-neutral-500">{blog.author_name} · {formatDateHi(blog.published_at)}</div>
        {blog.featured_image && <img src={blog.featured_image} alt="" className="mt-6 aspect-video w-full rounded-lg object-cover" />}
        <div className="article-body mt-8 text-[18px]"><ContentRenderer blocks={blog.content_hi.blocks} /></div>
      </article>
      {related.length > 0 && <section className="mt-8"><h2 className="mb-4 border-l-4 border-brand pl-3 text-2xl font-bold">और ब्लॉग पढ़ें</h2><div className="grid gap-4 sm:grid-cols-3">{related.slice(0,3).map((b)=><a key={b.id} href={`/blog/${b.slug}`} className="rounded-lg border bg-white p-4 font-bold hover:text-brand">{b.title_hi}</a>)}</div></section>}
    </div>
  );
}
