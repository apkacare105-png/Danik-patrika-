import 'server-only';

export type GNewsItem = {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
};

type GNewsResponse = { articles?: GNewsItem[] };

export async function getFreshNews(limit = 8): Promise<GNewsItem[]> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return [];
  try {
    const url = new URL('https://gnews.io/api/v4/top-headlines');
    url.searchParams.set('lang', 'hi');
    url.searchParams.set('country', 'in');
    url.searchParams.set('max', String(Math.min(limit, 10)));
    url.searchParams.set('apikey', key);
    const res = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const json = (await res.json()) as GNewsResponse;
    return (json.articles ?? []).filter((a) => a.title && a.url).slice(0, limit);
  } catch {
    return [];
  }
}
