'use server';

import { revalidatePath } from 'next/cache';
import { createClient, hasSupabase } from '@/lib/supabase/server';
import type { ActionResult, AdSlot, PortfolioProject, Role, SiteSettings } from '@/lib/types';

const DEMO = ' (डेमो मोड)';

async function run(
  demoMsg: string,
  okMsg: string,
  fn: (sb: ReturnType<typeof createClient>) => PromiseLike<{ error: { message: string } | null }>,
  paths: string[] = [],
): Promise<ActionResult> {
  if (!hasSupabase()) return { ok: true, message: demoMsg + DEMO };
  const { error } = await fn(createClient());
  if (error) return { ok: false, message: error.message };
  paths.forEach((p) => revalidatePath(p));
  return { ok: true, message: okMsg };
}

export async function approveArticle(id: string) {
  return run('लेख स्वीकार कर प्रकाशित किया गया।', 'लेख स्वीकार कर प्रकाशित किया गया।',
    (sb) => sb.from('articles').update({ status: 'published', published_at: new Date().toISOString(), rejection_note: null }).eq('id', id),
    ['/', '/admin/approvals']);
}

export async function rejectArticle(id: string, note: string) {
  if (!note.trim()) return { ok: false, message: 'अस्वीकार करने के लिए फ़ीडबैक लिखना ज़रूरी है।' };
  return run('लेख अस्वीकार कर दिया गया।', 'लेख अस्वीकार कर दिया गया और लेखक को फ़ीडबैक भेजा गया।',
    (sb) => sb.from('articles').update({ status: 'rejected', rejection_note: note.trim() }).eq('id', id), ['/admin/approvals']);
}

export async function updateUserRole(userId: string, role: Role) {
  return run('भूमिका अपडेट की गई।', 'भूमिका सफलतापूर्वक अपडेट की गई।',
    (sb) => sb.from('profiles').update({ role }).eq('id', userId), ['/admin/users']);
}

export async function saveCategoryOrder(items: { id: string; order_index: number; is_active: boolean }[]) {
  return run('श्रेणियों का क्रम सहेजा गया।', 'श्रेणियों का क्रम सहेजा गया।', async (sb) => {
    for (const it of items) {
      const { error } = await sb.from('categories').update({ order_index: it.order_index, is_active: it.is_active }).eq('id', it.id);
      if (error) return { error };
    }
    return { error: null };
  }, ['/', '/admin/categories']);
}

export async function saveAdSlot(slot: Pick<AdSlot, 'id' | 'ad_code' | 'is_enabled' | 'publisher_id'>) {
  const pub = slot.publisher_id?.trim() ?? '';
  if (pub && !/^ca-pub-\d{16}$/.test(pub)) return { ok: false, message: 'पब्लिशर ID का फ़ॉर्मैट ca-pub-XXXXXXXXXXXXXXXX (16 अंक) होना चाहिए।' };
  return run('विज्ञापन स्लॉट सहेजा गया।', 'विज्ञापन स्लॉट सहेजा गया।',
    (sb) => sb.from('ad_settings').update({ ad_code: slot.ad_code, is_enabled: slot.is_enabled, publisher_id: pub }).eq('id', slot.id), ['/', '/admin/ads']);
}

export async function saveSiteSettings(s: SiteSettings) {
  return run('साइट सेटिंग्स सहेजी गईं।', 'साइट सेटिंग्स सहेजी गईं।',
    (sb) => sb.from('site_settings').upsert({
      id: 1, site_name: s.site_name, logo_url: s.logo_url, favicon_url: s.favicon_url, theme: s.theme, seo: s.seo,
      header_nav: s.header_nav, footer_nav: s.footer_nav, static_pages: s.static_pages,
    }), ['/', '/admin/settings']);
}

export async function savePortfolioProject(p: PortfolioProject) {
  const isNew = p.id.startsWith('new-');
  const { id, ...rest } = p;
  return run('प्रोजेक्ट सहेजा गया।', 'प्रोजेक्ट सहेजा गया।',
    (sb) => (isNew ? sb.from('portfolio_projects').insert(rest) : sb.from('portfolio_projects').update(rest).eq('id', id)),
    ['/hamare-karya', '/admin/portfolio']);
}

export async function deletePortfolioProject(id: string) {
  return run('प्रोजेक्ट हटाया गया।', 'प्रोजेक्ट हटाया गया।',
    (sb) => sb.from('portfolio_projects').delete().eq('id', id), ['/hamare-karya', '/admin/portfolio']);
}
