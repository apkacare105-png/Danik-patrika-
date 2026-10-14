import Link from 'next/link';
import { getBlogs } from '@/lib/data';

export const revalidate = 60;

export default async function BlogsPage() {
  const blogs = await getBlogs(24);
  return (
    <div className="space-y-6">
      <div className="border-b-4 border-brand pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">समुदाय की आवाज़</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">दैनिक पत्रिका ब्लॉग</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">पाठकों और लेखकों की अपनी कहानियाँ, विचार और अनुभव। प्रकाशित होने से पहले हर ब्लॉग की संपादकीय समीक्षा की जाती है।</p>
      </div>
      {!blogs.length ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm"><p className="text-lg font-bold">अभी कोई ब्लॉग प्रकाशित नहीं है।</p><p className="mt-1 text-sm text-neutral-500">लॉगिन करके अपना पहला ब्लॉग लिखें।</p><Link href="/dashboard" className="mt-5 inline-flex rounded-md bg-brand px-5 py-2.5 text-sm font-bold text-white">ब्लॉग लिखें</Link></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((b) => (
            <Link key={b.id} href={`/blog/${b.slug}`} className="group overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="aspect-[16/9] bg-neutral-100">{b.featured_image && <img src={b.featured_image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" loading="lazy" />}</div>
              <div className="p-4"><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">BLOG</span><h2 className="mt-2 line-clamp-2 text-xl font-bold leading-snug group-hover:text-brand">{b.title_hi}</h2><p className="mt-2 line-clamp-2 text-sm text-neutral-600">{b.excerpt_hi}</p><p className="mt-4 text-xs text-neutral-500">{b.author_name}</p></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
