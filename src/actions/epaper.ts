'use server';

import { revalidatePath } from 'next/cache';
import { createClient, hasSupabase } from '@/lib/supabase/server';
import type { ActionResult, EpaperEdition } from '@/lib/types';

async function getEpaperAdminClient() {
  if (!hasSupabase()) return { ok: false as const, error: 'ई-पेपर प्रबंधन के लिए Supabase कॉन्फ़िगर करना ज़रूरी है।' };
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) return { ok: false as const, error: userError.message };
  if (!user) return { ok: false as const, error: 'कृपया पहले लॉगिन करें।' };

  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profileError) return { ok: false as const, error: profileError.message };
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return { ok: false as const, error: 'ई-पेपर प्रबंधित करने की अनुमति केवल एडमिन को है।' };
  }
  return { ok: true as const, supabase };
}

export async function saveEpaperEdition(input: Pick<EpaperEdition, 'title' | 'issue_number' | 'published_on' | 'pdf_path'> & { id?: string }): Promise<ActionResult> {
  const title = input.title.trim();
  const issueNumber = input.issue_number.trim();
  if (!title || !issueNumber || !/^\d{4}-\d{2}-\d{2}$/.test(input.published_on)) {
    return { ok: false, message: 'शीर्षक, अंक संख्या और सही प्रकाशन तारीख़ भरें।' };
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i.test(input.pdf_path)) {
    return { ok: false, message: 'कृपया मान्य PDF फ़ाइल चुनें।' };
  }

  const auth = await getEpaperAdminClient();
  if (!auth.ok) return { ok: false, message: auth.error };

  const row = { title, issue_number: issueNumber, published_on: input.published_on, pdf_path: input.pdf_path };
  const query = input.id
    ? auth.supabase.from('epaper_editions').update(row).eq('id', input.id).select('id').maybeSingle()
    : auth.supabase.from('epaper_editions').insert(row).select('id').single();
  const { data, error } = await query;
  if (error) return { ok: false, message: `ई-पेपर सहेजा नहीं जा सका: ${error.message}` };
  if (!data) return { ok: false, message: 'ई-पेपर नहीं मिला या उसे बदलने की अनुमति नहीं है।' };
  revalidatePath('/epaper');
  revalidatePath('/admin/epaper');
  return { ok: true, id: data.id, message: input.id ? 'ई-पेपर अपडेट हो गया।' : 'ई-पेपर जोड़ दिया गया।' };
}

export async function deleteEpaperEdition(id: string): Promise<ActionResult & { pdf_path?: string }> {
  const auth = await getEpaperAdminClient();
  if (!auth.ok) return { ok: false, message: auth.error };
  const { data, error } = await auth.supabase.from('epaper_editions').delete().eq('id', id).select('pdf_path').maybeSingle();
  if (error) return { ok: false, message: `ई-पेपर हटाया नहीं जा सका: ${error.message}` };
  if (!data) return { ok: false, message: 'ई-पेपर नहीं मिला या उसे हटाने की अनुमति नहीं है।' };
  revalidatePath('/epaper');
  revalidatePath('/admin/epaper');
  return { ok: true, pdf_path: data.pdf_path, message: 'ई-पेपर हटा दिया गया।' };
}
