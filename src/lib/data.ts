import 'server-only';
import { hasSupabase, createPublicClient } from './supabase/server';
import {
  MOCK_ADS, MOCK_ARTICLES, MOCK_CATEGORIES, MOCK_PORTFOLIO, MOCK_SETTINGS, MOCK_STORIES,
} from './mock-data';
import type { AdSlot, AdSlotType, Article, Category, PortfolioProject, SiteSettings, Story } from './types';


const ARTICLE_SELECT = '*, category:categories(slug,name_hi)';

export function mapArticle(row: any): Article {
  return {
    id: row.id,
    title_hi: row.title_hi,
    slug: row.slug,
    content_hi: row.content_hi ?? { type: 'doc', blocks: [] },
    excerpt_hi: row.excerpt_hi ?? '',
    featured_image: row.featured_image,
    status: row.status,
    author_id: row.author_id,
    author_name: row.author_name || 'दैनिक पत्रिका डेस्क',
    category_id: row.category_id,
    category_slug: row.category?.slug ?? '',
    category_name: row.category?.name_hi ?? '',
    sub_category_id: row.sub_category_id,
    views: Number(row.views ?? 0),
    published_at: row.published_at ?? row.created_at,
    rejection_note: row.rejection_note,
    is_blog: Boolean(row.is_blog),
  };
}

const byDate = (a: Article, b: Article) => +new Date(b.published_at) - +new Date(a.published_at);
const published = (a: Article) => a.status === 'published';

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabase()) return MOCK_CATEGORIES;
  const { data } = await createPublicClient()
    .from('categories').select('*, sub_categories(*)').eq('is_active', true).order('order_index');
  return (data ?? []).map((c: any) => ({
    ...c,
    sub_categories: (c.sub_categories ?? []).filter((s: any) => s.is_active).sort((a: any, b: any) => a.order_index - b.order_index),
  }));
}

export async function getArticles(opts: { categorySlug?: string; subCategoryId?: string; limit?: number; excludeId?: string } = {}): Promise<Article[]> {
  const { categorySlug, subCategoryId, limit = 20, excludeId } = opts;
  if (!hasSupabase()) {
    return MOCK_ARTICLES.filter((a) => published(a) && !a.is_blog)
      .filter((a) => (!categorySlug || a.category_slug === categorySlug) && (!subCategoryId || a.sub_category_id === subCategoryId) && a.id !== excludeId)
      .sort(byDate).slice(0, limit);
  }
  let q = createPublicClient().from('articles')
    .select(categorySlug ? '*, category:categories!inner(slug,name_hi)' : ARTICLE_SELECT)
    .eq('is_blog', false)
    .eq('status', 'published').order('published_at', { ascending: false }).limit(limit);
  if (categorySlug) q = q.eq('category.slug', categorySlug);
  if (subCategoryId) q = q.eq('sub_category_id', subCategoryId);
  if (excludeId) q = q.neq('id', excludeId);
  const { data } = await q;
  return (data ?? []).map(mapArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!hasSupabase()) return MOCK_ARTICLES.find((a) => a.slug === slug && published(a) && !a.is_blog) ?? null;
  const { data } = await createPublicClient().from('articles').select(ARTICLE_SELECT).eq('slug', slug).eq('status', 'published').eq('is_blog', false).maybeSingle();
  return data ? mapArticle(data) : null;
}


export async function getBlogs(limit = 24): Promise<Article[]> {
  if (!hasSupabase()) return MOCK_ARTICLES.filter((a) => published(a) && a.is_blog).sort(byDate).slice(0, limit);
  const { data } = await createPublicClient().from('articles').select(ARTICLE_SELECT)
    .eq('is_blog', true).eq('status', 'published').order('published_at', { ascending: false }).limit(limit);
  return (data ?? []).map(mapArticle);
}

export async function getBlogBySlug(slug: string): Promise<Article | null> {
  if (!hasSupabase()) return MOCK_ARTICLES.find((a) => a.slug === slug && published(a) && a.is_blog) ?? null;
  const { data } = await createPublicClient().from('articles').select(ARTICLE_SELECT)
    .eq('slug', slug).eq('is_blog', true).eq('status', 'published').maybeSingle();
  return data ? mapArticle(data) : null;
}

export async function getTrending(limit = 5): Promise<Article[]> {
  if (!hasSupabase()) return [...MOCK_ARTICLES].filter((a) => published(a) && !a.is_blog).sort((a, b) => b.views - a.views).slice(0, limit);
  const { data } = await createPublicClient().from('articles').select(ARTICLE_SELECT)
    .eq('status', 'published').eq('is_blog', false).order('views', { ascending: false }).limit(limit);
  return (data ?? []).map(mapArticle);
}

export async function searchArticles(query: string, limit = 8): Promise<Article[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (!hasSupabase()) {
    return MOCK_ARTICLES.filter((a) => published(a) && !a.is_blog && (a.title_hi.includes(q) || a.excerpt_hi.includes(q))).slice(0, limit);
  }
  const safe = q.replace(/[%,()]/g, ' ');
  const { data } = await createPublicClient().from('articles').select(ARTICLE_SELECT)
    .eq('status', 'published').eq('is_blog', false).or(`title_hi.ilike.%${safe}%,excerpt_hi.ilike.%${safe}%`)
    .order('published_at', { ascending: false }).limit(limit);
  return (data ?? []).map(mapArticle);
}

export async function getUpNext(current: Article, limit = 6): Promise<Article[]> {
  const all = await getArticles({ limit: 30 });
  const rest = all.filter((a) => a.id !== current.id);
  // पहले उसी श्रेणी की ख़बरें, फिर बाक़ी
  return [...rest.filter((a) => a.category_slug === current.category_slug), ...rest.filter((a) => a.category_slug !== current.category_slug)].slice(0, limit);
}

export async function getAdSlot(type: AdSlotType): Promise<AdSlot | null> {
  if (!hasSupabase()) return MOCK_ADS.find((a) => a.slot_type === type && a.is_enabled) ?? null;
  const { data } = await createPublicClient().from('ad_settings').select('*').eq('slot_type', type).eq('is_enabled', true).limit(1).maybeSingle();
  return (data as AdSlot) ?? null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!hasSupabase()) return MOCK_SETTINGS;
  const { data } = await createPublicClient().from('site_settings').select('*').eq('id', 1).maybeSingle();
  return data ? ({ ...MOCK_SETTINGS, ...data } as SiteSettings) : MOCK_SETTINGS;
}

export async function getPortfolio(): Promise<PortfolioProject[]> {
  if (!hasSupabase()) return MOCK_PORTFOLIO;
  const { data } = await createPublicClient().from('portfolio_projects').select('*').order('order_index');
  return (data as PortfolioProject[]) ?? [];
}

export async function getStories(): Promise<Story[]> {
  return MOCK_STORIES; // वेब स्टोरीज़ फ़िलहाल स्टैटिक हैं; चाहें तो अलग टेबल जोड़ सकते हैं
}

export const toCard = (a: Article) => ({
  id: a.id, title_hi: a.title_hi, slug: a.slug, category_slug: a.category_slug, category_name: a.category_name,
  featured_image: a.featured_image, excerpt_hi: a.excerpt_hi, published_at: a.published_at,
});
