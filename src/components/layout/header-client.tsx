'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Search, UserRound } from 'lucide-react';
import type { Category, NavLink } from '@/lib/types';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SearchModal } from './search-modal';

type MenuStory = { title_hi: string; slug: string; category_slug: string; featured_image: string | null };

const dateFmt = new Intl.DateTimeFormat('hi-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('hi-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

export function HeaderClient({
  siteName, logoUrl, categories, menuStories, extraNav,
}: {
  siteName: string; logoUrl: string | null; categories: Category[]; menuStories: Record<string, MenuStory[]>; extraNav: NavLink[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const active = categories.find((c) => c.slug === open);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* लाइव तारीख़/घड़ी बार */}
      <div className="border-b bg-neutral-50 text-xs text-neutral-600">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-3" suppressHydrationWarning>
            <span>{now ? dateFmt.format(now) : ' '}</span>
            <span className="hidden font-semibold tabular-nums text-brand sm:inline">{now ? timeFmt.format(now) : ''}</span>
          </div>
          <nav className="flex items-center gap-4">
            {extraNav.map((n) => (
              <Link key={n.href + n.label} href={n.href} className="hover:text-brand">{n.label}</Link>
            ))}
            <Link href="/login" className="flex items-center gap-1 font-semibold hover:text-brand">
              <UserRound className="h-3.5 w-3.5" /> लॉगिन
            </Link>
          </nav>
        </div>
      </div>

      {/* लोगो + सर्च */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3">
        <button className="rounded-md p-2 hover:bg-neutral-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="मेन्यू खोलें">
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/" className="flex items-center gap-2" aria-label={`${siteName} होम`}>
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-10 w-auto" />
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand font-display text-2xl text-white">ड</span>
              <span className="font-display text-2xl leading-none sm:text-3xl">
                {siteName}
                <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">Dainik Patrika</span>
              </span>
            </>
          )}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-full border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 transition hover:border-brand hover:bg-white sm:w-72"
            aria-label="खोजें"
          >
            <Search className="h-4 w-4" />
            <span className="hidden flex-1 text-left sm:inline">ख़बरें खोजें…</span>
            <kbd className="hidden rounded border bg-white px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
          </button>
        </div>
      </div>

      {/* श्रेणी नेविगेशन + मेगा-मेन्यू */}
      <div className="relative border-t bg-neutral-900 text-white" onMouseLeave={() => setOpen(null)}>
        <nav className="mx-auto hidden max-w-7xl items-center overflow-x-auto px-3 scrollbar-hide lg:flex" aria-label="मुख्य नेविगेशन">
          <Link href="/blogs" className="whitespace-nowrap px-3 py-3 text-sm font-bold hover:bg-brand">ब्लॉग</Link>
          <Link href="/" className="whitespace-nowrap px-3 py-3 text-sm font-bold hover:bg-brand" onMouseEnter={() => setOpen(null)}>होम</Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              onMouseEnter={() => setOpen(c.slug)}
              onFocus={() => setOpen(c.slug)}
              className={`flex items-center gap-1 whitespace-nowrap px-3 py-3 text-sm font-bold transition-colors ${open === c.slug ? 'bg-brand' : 'hover:bg-white/10'}`}
              aria-expanded={open === c.slug}
            >
              {c.name_hi}
              {(c.sub_categories.length > 0 || (menuStories[c.slug]?.length ?? 0) > 0) && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
            </Link>
          ))}
        </nav>

        <AnimatePresence>
          {active && (
            <motion.div
              key={active.slug}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full hidden border-t-4 border-brand bg-white text-neutral-900 shadow-2xl lg:block"
            >
              <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr] gap-6 px-3 py-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-400">उप-श्रेणियाँ</p>
                  <ul className="space-y-1">
                    <li><Link href={`/category/${active.slug}`} className="block rounded px-2 py-1.5 text-sm font-semibold hover:bg-neutral-100 hover:text-brand" onClick={() => setOpen(null)}>सभी {active.name_hi} ख़बरें</Link></li>
                    {active.sub_categories.map((s) => (
                      <li key={s.id}>
                        <Link href={`/category/${active.slug}?sub=${s.slug}`} className="block rounded px-2 py-1.5 text-sm hover:bg-neutral-100 hover:text-brand" onClick={() => setOpen(null)}>
                          {s.name_hi}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(menuStories[active.slug] ?? []).map((s) => (
                    <Link key={s.slug} href={`/news/${s.category_slug}/${s.slug}`} className="group" onClick={() => setOpen(null)}>
                      <div className="aspect-video overflow-hidden rounded-md bg-neutral-200">
                        {s.featured_image && <img src={s.featured_image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-brand">{s.title_hi}</p>
                    </Link>
                  ))}
                  {(menuStories[active.slug] ?? []).length === 0 && <p className="col-span-3 text-sm text-neutral-400">इस श्रेणी में अभी कोई ख़बर नहीं है।</p>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* मोबाइल मेन्यू */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetTitle>{siteName}</SheetTitle>
          <nav className="flex flex-col" aria-label="मोबाइल नेविगेशन">
            <SheetClose asChild><Link href="/" className="border-b py-3 font-semibold">होम</Link></SheetClose><SheetClose asChild><Link href="/blogs" className="border-b py-3 font-semibold">कम्युनिटी ब्लॉग</Link></SheetClose>
            {categories.map((c) => (
              <div key={c.id} className="border-b py-2">
                <SheetClose asChild><Link href={`/category/${c.slug}`} className="block py-1 font-semibold">{c.name_hi}</Link></SheetClose>
                {c.sub_categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1 pt-1">
                    {c.sub_categories.map((s) => (
                      <SheetClose asChild key={s.id}>
                        <Link href={`/category/${c.slug}?sub=${s.slug}`} className="rounded-full bg-neutral-100 px-3 py-1 text-xs">{s.name_hi}</Link>
                      </SheetClose>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {extraNav.map((n) => (
              <SheetClose asChild key={n.label}><Link href={n.href} className="border-b py-3">{n.label}</Link></SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
