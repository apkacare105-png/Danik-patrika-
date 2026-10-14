import { getAdminSettings, getViewer } from '@/lib/admin-data';
import { SettingsPanel } from '@/components/admin/settings-panel';

export default async function SettingsPage() {
  const [settings, viewer] = await Promise.all([getAdminSettings(), getViewer()]);
  return <SettingsPanel initial={settings} readOnly={viewer.role !== 'super_admin'} />;
}
