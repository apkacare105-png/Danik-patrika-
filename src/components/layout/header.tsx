import { getArticles, getCategories, getSiteSettings } from '@/lib/data';
import { AdSlot } from '../ad-slot';
import { HeaderClient } from './header-client';
import { BreakingTicker } from './breaking-ticker';
import { MOCK_TOTAL_VIEWS } from '@/lib/mock-data';

export async function Header() {
  const [categories, settings, latest] = await Promise.all([getCategories(), getSiteSettings(), getArticles({ limit: 30 })]);

  // मेगा-मेन्यू के लिए हर श्रेणी की 3 ताज़ा ख़बरें
  const menuStories: Record<string, { title_hi: string; slug: string; category_slug: string; featured_image: string | null }[]> = {};
  for (const c of categories) {
    menuStories[c.slug] = latest
      .filter((a) => a.category_slug === c.slug)
      .slice(0, 3)
      .map((a) => ({ title_hi: a.title_hi, slug: a.slug, category_slug: a.category_slug, featured_image: a.featured_image }));
  }

  return (
    <>
      <HeaderClient
        siteName={settings.site_name}
        logoUrl={settings.logo_url}
        categories={categories}
        menuStories={menuStories}
        extraNav={settings.header_nav}
        totalDemoViews={MOCK_TOTAL_VIEWS}
      />
      <BreakingTicker items={latest.slice(0, 8).map((a) => ({ title: a.title_hi, href: `/news/${a.category_slug}/${a.slug}` }))} />
      <div className="mx-auto mt-4 max-w-7xl px-3">
        <AdSlot placement="header" />
      </div>
    </>
  );
}
