'use server';

import { createClient, hasSupabase } from '@/lib/supabase/server';
import { searchArticles } from '@/lib/data';
import type { ActionResult } from '@/lib/types';

export async function searchArticlesAction(q: string) {
  const rows = await searchArticles(q, 6);
  return rows.map((a) => ({
    id: a.id, title_hi: a.title_hi, slug: a.slug, category_slug: a.category_slug,
    category_name: a.category_name, featured_image: a.featured_image,
  }));
}

export async function subscribeNewsletter(email: string): Promise<ActionResult> {
  const value = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return { ok: false, message: 'कृपया सही ईमेल पता दर्ज करें।' };
  if (!hasSupabase()) return { ok: true, message: 'धन्यवाद! आप सफलतापूर्वक सब्सक्राइब हो गए हैं। (डेमो मोड)' };
  const { error } = await createClient().from('newsletter_subscribers').insert({ email: value });
  if (error?.code === '23505') return { ok: true, message: 'यह ईमेल पहले से सब्सक्राइब है। धन्यवाद!' };
  if (error) return { ok: false, message: 'कुछ गड़बड़ हुई, कृपया दोबारा प्रयास करें।' };
  return { ok: true, message: 'धन्यवाद! आप सफलतापूर्वक सब्सक्राइब हो गए हैं।' };
}

export async function incrementViews(slug: string): Promise<void> {
  if (!hasSupabase()) return;
  await createClient().rpc('increment_article_views', { p_slug: slug });
}

export async function signOut(): Promise<void> {
  if (!hasSupabase()) return;
  await createClient().auth.signOut();
}
