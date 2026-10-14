import type { Article } from '@/lib/types';
import { AdSlot } from '../ad-slot';
import { Newsletter } from './newsletter';
import { TrendingList } from './trending-list';

export function Sidebar({ trending }: { trending: Article[] }) {
  return (
    <aside className="space-y-5" aria-label="साइडबार">
      <Newsletter />
      <TrendingList items={trending} />
      <div className="sticky top-32">
        <AdSlot placement="sidebar_sticky" />
      </div>
    </aside>
  );
}
