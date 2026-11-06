import 'server-only';
import { redirect } from 'next/navigation';
import { createClient, hasSupabase } from './supabase/server';
import { mapArticle } from './data';
import { MOCK_AUTHOR_ARTICLES } from './mock-data';
import type { Article, Feedback, Profile } from '@/lib/types';

export type AccountArticle = Article & { created_at: string; updated_at: string };

export type AccountStats = {
  total: number;
  blogs: number;
  news: number;
  published: number;
  pending: number;
  draft: number;
  rejected: number;
  views: number;
};

export type AccountData = {
  profile: Profile;
  articles: AccountArticle[];
  stats: AccountStats;
  feedback: Feedback[];
};

function computeStats(articles: AccountArticle[]): AccountStats {
  const count = (f: (a: AccountArticle) => boolean) => articles.filter(f).length;
  return {
    total: articles.length,
    blogs: count((a) => Boolean(a.is_blog)),
    news: count((a) => !a.is_blog),
    published: count((a) => a.status === 'published'),
    pending: count((a) => a.status === 'pending'),
    draft: count((a) => a.status === 'draft'),
    rejected: count((a) => a.status === 'rejected'),
    views: articles.reduce((sum, a) => sum + a.views, 0),
  };
}

/** लॉगिन किए यूज़र का प्रोफ़ाइल + उसकी सारी पोस्ट/ब्लॉग। लॉगिन न हो तो /login पर भेजता है। */
export async function getAccountData(): Promise<AccountData> {
  if (!hasSupabase()) {
    const now = new Date().toISOString();
    const articles = MOCK_AUTHOR_ARTICLES.map((a) => ({ ...a, created_at: a.published_at ?? now, updated_at: a.published_at ?? now }));
    return {
      profile: { id: 'demo', display_name: 'डेमो यूज़र', email: 'demo@example.com', role: 'super_admin', bio: null, avatar_url: null, created_at: now },
      articles,
      stats: computeStats(articles),
      feedback: [],
    };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  const [{ data: profileRow }, { data: rows }, { data: fbRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('articles').select('*, category:categories(slug,name_hi)').eq('author_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('user_feedback').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);

  const profile: Profile = {
    id: user.id,
    display_name: profileRow?.display_name || user.email || 'यूज़र',
    email: profileRow?.email || user.email || '',
    role: profileRow?.role ?? 'public_visitor',
    bio: profileRow?.bio ?? null,
    avatar_url: profileRow?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null,
    created_at: profileRow?.created_at ?? user.created_at,
  };

  const articles: AccountArticle[] = (rows ?? []).map((row: any) => ({
    ...mapArticle(row),
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  }));

  return { profile, articles, stats: computeStats(articles), feedback: (fbRows ?? []) as Feedback[] };
}
