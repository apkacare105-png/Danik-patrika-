'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderKanban, Gauge, LayoutList, Megaphone, Settings, ShieldCheck, Users } from 'lucide-react';

const ITEMS = [
  { href: '/admin', label: 'अवलोकन', icon: Gauge },
  { href: '/admin/approvals', label: 'अप्रूवल क्यू', icon: ShieldCheck },
  { href: '/admin/users', label: 'यूज़र और भूमिकाएँ', icon: Users },
  { href: '/admin/categories', label: 'श्रेणी प्रबंधक', icon: LayoutList },
  { href: '/admin/ads', label: 'विज्ञापन केंद्र', icon: Megaphone },
  { href: '/admin/settings', label: 'CMS सेटिंग्स', icon: Settings },
  { href: '/admin/portfolio', label: 'हमारे कार्य', icon: FolderKanban },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl bg-white p-2 shadow-sm scrollbar-hide lg:sticky lg:top-4 lg:flex-col lg:self-start" aria-label="एडमिन मेन्यू">
      {ITEMS.map((it) => {
        const active = it.href === '/admin' ? path === '/admin' : path.startsWith(it.href);
        return (
          <Link
            key={it.href} href={it.href}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-brand text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
          >
            <it.icon className="h-4 w-4" /> {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
