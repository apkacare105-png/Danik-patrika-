import Link from 'next/link';
import { getAllAdSlots, getAllCategories, getAllProfiles, getPendingArticles } from '@/lib/admin-data';

export default async function AdminHome() {
  const [pending, profiles, cats, ads] = await Promise.all([getPendingArticles(), getAllProfiles(), getAllCategories(), getAllAdSlots()]);
  const cards = [
    { href: '/admin/approvals', label: 'समीक्षा के इंतज़ार में', value: pending.length, note: 'लेख' },
    { href: '/admin/users', label: 'कुल यूज़र', value: profiles.length, note: `${profiles.filter((p) => p.role === 'author').length} लेखक` },
    { href: '/admin/categories', label: 'सक्रिय श्रेणियाँ', value: cats.filter((c) => c.is_active).length, note: `कुल ${cats.length}` },
    { href: '/admin/ads', label: 'चालू विज्ञापन स्लॉट', value: ads.filter((a) => a.is_enabled).length, note: `कुल ${ads.length}` },
  ];
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">नमस्ते! आज का सार</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm text-neutral-500">{c.label}</p>
            <p className="mt-1 font-display text-5xl text-brand">{c.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{c.note}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
