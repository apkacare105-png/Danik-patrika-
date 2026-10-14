'use server';

import { revalidatePath } from 'next/cache';
import { createClient, hasSupabase } from '@/lib/supabase/server';
import { markdownToBlocks } from '@/lib/content';
import type { ActionResult, ArticleInput } from '@/lib/types';

async function persist(input: ArticleInput, status: 'draft' | 'pending'): Promise<ActionResult> {
  if (!input.title_hi.trim() && status === 'pending') return { ok: false, message: 'भेजने से पहले शीर्षक लिखना ज़रूरी है।' };
  if (!hasSupabase()) {
    return {
      ok: true, id: input.id ?? `demo-${Date.now()}`,
      message: status === 'pending' ? 'लेख समीक्षा के लिए भेज दिया गया। (डेमो मोड)' : 'सभी बदलाव सहेजे गए।',
    };
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'कृपया पहले लॉगिन करें।' };

  const row = {
    title_hi: input.title_hi.trim() || 'बिना शीर्षक का ड्राफ़्ट',
    excerpt_hi: input.excerpt_hi,
    content_hi: { type: 'doc', blocks: markdownToBlocks(input.content_md), md: input.content_md },
    featured_image: input.featured_image,
    category_id: input.category_id || null,
    sub_category_id: input.sub_category_id || null,
    status,
    is_blog: Boolean(input.is_blog),
  };

  if (input.id && !input.id.startsWith('demo-')) {
    const { error } = await supabase.from('articles').update(row).eq('id', input.id);
    if (error) return { ok: false, message: 'सहेजना विफल रहा: ' + error.message };
    revalidatePath('/dashboard');
    return { ok: true, id: input.id, message: status === 'pending' ? 'लेख समीक्षा के लिए भेज दिया गया।' : 'सभी बदलाव सहेजे गए।' };
  }

  const slug = `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase.from('articles').insert({ ...row, slug, author_id: user.id }).select('id').single();
  if (error) return { ok: false, message: 'सहेजना विफल रहा: ' + error.message };
  revalidatePath('/dashboard');
  return { ok: true, id: data.id, message: status === 'pending' ? 'लेख समीक्षा के लिए भेज दिया गया।' : 'ड्राफ़्ट सहेजा गया।' };
}

export async function saveDraft(input: ArticleInput) {
  return persist(input, 'draft');
}

export async function submitForReview(input: ArticleInput) {
  return persist(input, 'pending');
}

export async function deleteMyArticle(id: string): Promise<ActionResult> {
  if (!hasSupabase()) return { ok: true, message: 'लेख हटा दिया गया। (डेमो मोड)' };
  const { error } = await createClient().from('articles').delete().eq('id', id);
  if (error) return { ok: false, message: 'लेख हटाया नहीं जा सका।' };
  revalidatePath('/dashboard');
  return { ok: true, message: 'लेख हटा दिया गया।' };
}
