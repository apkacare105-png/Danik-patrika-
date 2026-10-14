import { getAllAdSlots, getViewer } from '@/lib/admin-data';
import { AdControlCenter } from '@/components/admin/ad-control-center';

export default async function AdsPage() {
  const [slots, viewer] = await Promise.all([getAllAdSlots(), getViewer()]);
  return <AdControlCenter initial={slots} readOnly={viewer.role !== 'super_admin'} />;
}
