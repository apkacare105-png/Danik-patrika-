import type { Metadata } from 'next';
import { requireRole } from '@/lib/admin-data';
import { PanelTopBar } from '@/components/dashboard/panel-top-bar';
import { AdminNav } from '@/components/admin/admin-nav';

export const metadata: Metadata = { title: 'एडमिन पैनल' };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const v = await requireRole(['admin', 'super_admin']);
  return (
    <div className="min-h-screen bg-neutral-100">
      <PanelTopBar title="कंट्रोल पैनल" name={v.name} role={v.role} />
      <div className="mx-auto grid max-w-[1500px] gap-4 p-3 sm:p-4 lg:grid-cols-[230px_1fr]">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
