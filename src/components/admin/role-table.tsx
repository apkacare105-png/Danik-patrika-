'use client';

import { useMemo, useState, useTransition } from 'react';
import { ArrowUpCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABEL, type Profile, type Role } from '@/lib/types';
import { formatDateHi } from '@/lib/utils';
import { updateUserRole } from '@/actions/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const ROLES: Role[] = ['public_visitor', 'author', 'admin', 'super_admin'];
const VARIANT: Record<Role, 'secondary' | 'info' | 'warning' | 'danger'> = {
  public_visitor: 'secondary', author: 'info', admin: 'warning', super_admin: 'danger',
};

export function RoleTable({ initial, viewerRole, viewerId }: { initial: Profile[]; viewerRole: Role; viewerId: string }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Role | 'all'>('all');
  const [target, setTarget] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState<Role>('author');
  const [pending, start] = useTransition();

  // Admin सिर्फ़ पाठक <-> लेखक बदल सकता है; सुपर एडमिन सब कुछ
  const assignable = (r: Role) => viewerRole === 'super_admin' || r === 'public_visitor' || r === 'author';
  const canEdit = (p: Profile) => p.id !== viewerId && (viewerRole === 'super_admin' || p.role === 'public_visitor' || p.role === 'author');

  const filtered = useMemo(
    () => rows.filter((r) => (filter === 'all' || r.role === filter) && (r.display_name + r.email).toLowerCase().includes(q.toLowerCase())),
    [rows, q, filter],
  );

  const open = (p: Profile) => { setTarget(p); setNewRole(p.role === 'public_visitor' ? 'author' : p.role); };

  const confirm = () => {
    if (!target) return;
    start(async () => {
      const r = await updateUserRole(target.id, newRole);
      if (r.ok) {
        setRows((prev) => prev.map((x) => (x.id === target.id ? { ...x, role: newRole } : x)));
        toast.success(`${target.display_name} अब “${ROLE_LABEL[newRole]}” हैं।`);
        setTarget(null);
      } else toast.error(r.message);
    });
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-xl font-bold">यूज़र और भूमिकाएँ</h2>
      <p className="mb-4 text-sm text-neutral-500">
        {viewerRole === 'admin' ? 'एडमिन के रूप में आप सिर्फ़ पाठक को लेखक बना सकते हैं (या उल्टा)।' : 'सुपर एडमिन के रूप में आप किसी भी भूमिका में बदलाव कर सकते हैं।'}
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="नाम या ईमेल से खोजें…" className="pl-9" aria-label="यूज़र खोजें" />
        </div>
        <div className="flex flex-wrap gap-1">
          {(['all', ...ROLES] as const).map((r) => (
            <button key={r} onClick={() => setFilter(r)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === r ? 'bg-neutral-900 text-white' : 'bg-neutral-100 hover:bg-neutral-200'}`}>
              {r === 'all' ? 'सभी' : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b text-xs uppercase text-neutral-500">
            <tr><th className="py-2">यूज़र</th><th>भूमिका</th><th>जुड़ने की तारीख़</th><th className="text-right">कार्रवाई</th></tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">{p.display_name.slice(0, 1)}</span>
                    <div><p className="font-semibold">{p.display_name}</p><p className="text-xs text-neutral-500">{p.email}</p></div>
                  </div>
                </td>
                <td><Badge variant={VARIANT[p.role]}>{ROLE_LABEL[p.role]}</Badge></td>
                <td className="text-neutral-600">{formatDateHi(p.created_at)}</td>
                <td className="text-right">
                  <Button size="sm" variant="outline" disabled={!canEdit(p)} onClick={() => open(p)}>
                    <ArrowUpCircle className="h-4 w-4" /> भूमिका बदलें
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-neutral-500">कोई यूज़र नहीं मिला।</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogTitle>भूमिका बदलें</DialogTitle>
          <DialogDescription>{target?.display_name} ({target?.email}) की नई भूमिका चुनें।</DialogDescription>
          <div className="mt-4 space-y-2" role="radiogroup">
            {ROLES.map((r) => (
              <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${newRole === r ? 'border-brand bg-red-50' : ''} ${!assignable(r) ? 'cursor-not-allowed opacity-40' : ''}`}>
                <input type="radio" name="role" className="accent-[rgb(var(--brand-rgb))]" checked={newRole === r} disabled={!assignable(r)} onChange={() => setNewRole(r)} />
                <span className="font-semibold">{ROLE_LABEL[r]}</span>
                {!assignable(r) && <span className="ml-auto text-xs">केवल सुपर एडमिन</span>}
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTarget(null)}>रद्द करें</Button>
            <Button onClick={confirm} disabled={pending || newRole === target?.role}>{pending ? 'सहेजा जा रहा है…' : 'पुष्टि करें'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
