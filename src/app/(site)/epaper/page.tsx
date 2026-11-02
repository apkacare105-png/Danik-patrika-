import type { Metadata } from 'next';
import { getEpaperEditions } from '@/lib/data';
import { createPublicClient, hasSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'ई-पेपर' };
export const dynamic = 'force-dynamic';

export default async function EpaperPage() {
  const editions = await getEpaperEditions();
  const supabase = hasSupabase() ? createPublicClient() : null;

  return (
    <div className="space-y-6">
      <div className="border-b-4 border-brand pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">दैनिक पत्रिका</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">ई-पेपर</h1>
        <p className="mt-2 text-neutral-600">दैनिक पत्रिका के नवीनतम और पुराने अंक पढ़ें।</p>
      </div>
      {editions.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-bold">अभी कोई ई-पेपर उपलब्ध नहीं है।</p>
          <p className="mt-1 text-sm text-neutral-500">नए अंक जल्द यहाँ उपलब्ध होंगे।</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editions.map((edition) => {
            const pdfUrl = supabase?.storage.from('epapers').getPublicUrl(edition.pdf_path).data.publicUrl;
            return (
              <article key={edition.id} className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-brand">अंक {edition.issue_number}</p>
                <h2 className="mt-2 text-xl font-bold">{edition.title}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {new Intl.DateTimeFormat('hi-IN', { dateStyle: 'long' }).format(new Date(`${edition.published_on}T00:00:00`))}
                </p>
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-bold text-white hover:brightness-90">
                    ई-पेपर पढ़ें
                  </a>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
