import type { Metadata } from 'next';
import { requireRole } from '@/lib/admin-data';
import { PanelTopBar } from '@/components/dashboard/panel-top-bar';

export const metadata: Metadata = { title: 'लेखन डैशबोर्ड' };
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const v = await requireRole(['public_visitor', 'author', 'admin', 'super_admin']);
  return (
    <div className="min-h-screen bg-neutral-100">
      <PanelTopBar title="लेखन डैशबोर्ड" name={v.name} role={v.role} />
      <div className="mx-auto max-w-[1500px] p-3 sm:p-4">{children}</div>
    </div>
  );
}
