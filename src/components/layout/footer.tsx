import Link from 'next/link';
import { getCategories, getSiteSettings } from '@/lib/data';
import { AdSlot } from '../ad-slot';

export async function Footer() {
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()]);
  return (
    <footer className="mt-12 bg-neutral-900 text-neutral-300">
      <div className="mx-auto max-w-7xl px-3 pt-6">
        <AdSlot placement="footer" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-3 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl text-white">{settings.site_name}</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-neutral-400">{settings.seo.description}</p>
        </div>
        <div>
          <p className="mb-3 font-bold text-white">श्रेणियाँ</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}><Link href={`/category/${c.slug}`} className="hover:text-white">{c.name_hi}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 font-bold text-white">जानकारी</p>
          <ul className="space-y-2 text-sm">
            {settings.footer_nav.map((n) => (
              <li key={n.label}><Link href={n.href} className="hover:text-white">{n.label}</Link></li>
            ))}
            <li><Link href="/hamare-karya" className="hover:text-white">हमारे कार्य</Link></li>
            <li><Link href="/blogs" className="hover:text-white">कम्युनिटी ब्लॉग</Link></li><li><Link href="/dashboard" className="hover:text-white">ब्लॉग लिखें</Link></li>
            <li><Link href="/admin" className="hover:text-white">एडमिन पैनल</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} {settings.site_name}। सर्वाधिकार सुरक्षित।
      </div>
    </footer>
  );
}
