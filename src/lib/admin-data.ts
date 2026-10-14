import 'server-only';
import { redirect } from 'next/navigation';
import { createClient, hasSupabase } from './supabase/server';
import { mapArticle } from './data';
import {
  MOCK_ADS, MOCK_AUTHOR_ARTICLES, MOCK_CATEGORIES, MOCK_PENDING, MOCK_PORTFOLIO, MOCK_PROFILES, MOCK_SETTINGS,
} from './mock-data';
import type { AdSlot, Article, Category, PortfolioProject, Profile, Role, SiteSettings } from './types';


/** वर्तमान यूज़र और भूमिका। डेमो मोड में 'super_admin' माना जाता है। */
export async function getViewer(): Promise<{ id: string; name: string; role: Role }> {
  if (!hasSupabase()) return { id: 'demo', name: 'डेमो यूज़र', role: 'super_admin' };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data } = await supabase.from('profiles').select('role, display_name').eq('id', user.id).maybeSingle();
  return { id: user.id, name: data?.display_name || user.email || 'यूज़र', role: (data?.role as Role) ?? 'public_visitor' };
}

export async function requireRole(allowed: Role[]) {
  const v = await getViewer();
  if (!allowed.includes(v.role)) redirect('/login?error=forbidden');
  return v;
}

export async function getAllProfiles(): Promise<Profile[]> {
  if (!hasSupabase()) return MOCK_PROFILES;
  const { data } = await createClient().from('profiles').select('*').order('created_at', { ascending: false });
  return (data as Profile[]) ?? [];
}

export async function getPendingArticles(): Promise<Article[]> {
  if (!hasSupabase()) return MOCK_PENDING;
  const { data } = await createClient().from('articles').select('*, category:categories(slug,name_hi)')
    .eq('status', 'pending').order('updated_at', { ascending: true });
  return (data ?? []).map(mapArticle);
}

export async function getMyArticles(userId: string): Promise<Article[]> {
  if (!hasSupabase()) return MOCK_AUTHOR_ARTICLES;
  const { data } = await createClient().from('articles').select('*, category:categories(slug,name_hi)')
    .eq('author_id', userId).order('updated_at', { ascending: false });
  return (data ?? []).map(mapArticle);
}

export async function getAllCategories(): Promise<Category[]> {
  if (!hasSupabase()) return MOCK_CATEGORIES;
  const { data } = await createClient().from('categories').select('*, sub_categories(*)').order('order_index');
  return (data ?? []).map((c: any) => ({ ...c, sub_categories: (c.sub_categories ?? []).sort((a: any, b: any) => a.order_index - b.order_index) }));
}

export async function getAllAdSlots(): Promise<AdSlot[]> {
  if (!hasSupabase()) return MOCK_ADS;
  const { data } = await createClient().from('ad_settings').select('*').order('slot_key');
  return (data as AdSlot[]) ?? [];
}

export async function getAdminSettings(): Promise<SiteSettings> {
  if (!hasSupabase()) return MOCK_SETTINGS;
  const { data } = await createClient().from('site_settings').select('*').eq('id', 1).maybeSingle();
  return data ? ({ ...MOCK_SETTINGS, ...data } as SiteSettings) : MOCK_SETTINGS;
}

export async function getAdminPortfolio(): Promise<PortfolioProject[]> {
  if (!hasSupabase()) return MOCK_PORTFOLIO;
  const { data } = await createClient().from('portfolio_projects').select('*').order('order_index');
  return (data as PortfolioProject[]) ?? [];
}
