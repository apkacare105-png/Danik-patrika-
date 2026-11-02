import { EpaperManager } from '@/components/admin/epaper-manager';
import { getAdminEpaperEditions } from '@/lib/admin-data';
import { createPublicClient, hasSupabase } from '@/lib/supabase/server';

export default async function AdminEpaperPage() {
  const editions = await getAdminEpaperEditions();
  const supabase = hasSupabase() ? createPublicClient() : null;
  const initial = editions.map((edition) => ({
    ...edition,
    pdf_url: supabase?.storage.from('epapers').getPublicUrl(edition.pdf_path).data.publicUrl ?? '',
  }));
  return <EpaperManager initial={initial} configured={hasSupabase()} />;
}
