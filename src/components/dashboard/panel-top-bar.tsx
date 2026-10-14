'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, LogOut } from 'lucide-react';
import { signOut } from '@/actions/public';
import { ROLE_LABEL, type Role } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export function PanelTopBar({ title, name, role }: { title: string; name: string; role: Role }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-display text-xl text-white" aria-label="होम">ड</Link>
        <h1 className="font-display text-xl">{title}</h1>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden sm:inline">{name}</span>
        <Badge variant="info">{ROLE_LABEL[role]}</Badge>
        <Link href="/" target="_blank" className="hidden items-center gap-1 text-neutral-600 hover:text-brand sm:flex">साइट देखें <ExternalLink className="h-3.5 w-3.5" /></Link>
        <button
          onClick={async () => { await signOut(); router.push('/login'); router.refresh(); }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-neutral-600 hover:bg-neutral-100"
          aria-label="लॉग आउट"
        >
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">लॉग आउट</span>
        </button>
      </div>
    </div>
  );
}
