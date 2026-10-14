import { getAllProfiles, getViewer } from '@/lib/admin-data';
import { RoleTable } from '@/components/admin/role-table';

export default async function UsersPage() {
  const [profiles, viewer] = await Promise.all([getAllProfiles(), getViewer()]);
  return <RoleTable initial={profiles} viewerRole={viewer.role} viewerId={viewer.id} />;
}
