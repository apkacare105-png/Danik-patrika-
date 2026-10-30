import { getViewer, getMyArticles, getAllCategories } from '@/lib/admin-data';
import { hasSupabase } from '@/lib/supabase/server';
import { isAgentConfigured } from '@/lib/agent/run';
import { AuthorDashboard } from '@/components/dashboard/author-dashboard';
import { AiAssistant } from '@/components/dashboard/ai-assistant';

export default async function DashboardPage() {
  const viewer = await getViewer();
  const [articles, categories] = await Promise.all([getMyArticles(viewer.id), getAllCategories()]);
  const showAssistant = hasSupabase() && isAgentConfigured() && viewer.role !== 'public_visitor';
  return (
    <>
      <AuthorDashboard articles={articles} categories={categories.filter((c) => c.is_active)} role={viewer.role} />
      {showAssistant && <AiAssistant />}
    </>
  );
}
