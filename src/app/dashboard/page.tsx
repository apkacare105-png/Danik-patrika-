import { getViewer, getMyArticles, getAllCategories } from '@/lib/admin-data';
import { AuthorDashboard } from '@/components/dashboard/author-dashboard';

export default async function DashboardPage() {
  const viewer = await getViewer();
  const [articles, categories] = await Promise.all([getMyArticles(viewer.id), getAllCategories()]);
  return <AuthorDashboard articles={articles} categories={categories.filter((c) => c.is_active)} role={viewer.role} />;
}
