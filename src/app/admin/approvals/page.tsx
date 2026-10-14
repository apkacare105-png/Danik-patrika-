import { getPendingArticles } from '@/lib/admin-data';
import { ApprovalQueue } from '@/components/admin/approval-queue';

export default async function ApprovalsPage() {
  return <ApprovalQueue initial={await getPendingArticles()} />;
}
