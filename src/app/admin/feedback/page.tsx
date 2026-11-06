import { getAllFeedback } from '@/lib/admin-data';
import { FeedbackTable } from '@/components/admin/feedback-table';

export default async function FeedbackPage() {
  const feedback = await getAllFeedback();
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">यूज़र फ़ीडबैक</h2>
      <FeedbackTable initial={feedback} />
    </div>
  );
}
