'use client';

import { useState, useTransition } from 'react';
import { Check, Inbox, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Article } from '@/lib/types';
import { formatDateHi } from '@/lib/utils';
import { approveArticle, rejectArticle } from '@/actions/admin';
import { ContentRenderer } from '@/components/article/content-renderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

/** बाईं ओर कतार + त्वरित बटन, दाईं ओर लेख का प्रीव्यू */
export function ApprovalQueue({ initial }: { initial: Article[] }) {
  const [items, setItems] = useState(initial);
  const [selId, setSelId] = useState(initial[0]?.id);
  const [drawer, setDrawer] = useState(false);
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();

  const sel = items.find((i) => i.id === selId) ?? items[0];

  const remove = (id: string) => {
    const rest = items.filter((i) => i.id !== id);
    setItems(rest);
    setSelId(rest[0]?.id);
  };

  const approve = (a: Article) => start(async () => {
    const r = await approveArticle(a.id);
    if (r.ok) { toast.success(`“${a.title_hi.slice(0, 30)}…” प्रकाशित हो गया।`); remove(a.id); } else toast.error(r.message);
  });

  const reject = () => {
    if (!sel) return;
    start(async () => {
      const r = await rejectArticle(sel.id, note);
      if (r.ok) { toast.success(r.message); setDrawer(false); setNote(''); remove(sel.id); } else toast.error(r.message);
    });
  };

  if (!items.length) {
    return (
      <div className="flex flex-col items-center rounded-xl bg-white p-16 text-center shadow-sm">
        <Inbox className="h-12 w-12 text-neutral-300" />
        <p className="mt-3 text-lg font-bold">कतार ख़ाली है</p>
        <p className="text-sm text-neutral-500">सभी लेखों की समीक्षा हो चुकी है।</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[400px_1fr]">
      <div className="space-y-2">
        <h2 className="px-1 text-xl font-bold">अप्रूवल क्यू <span className="text-brand">({items.length})</span></h2>
        {items.map((a) => (
          <div key={a.id} className={`rounded-xl border bg-white p-3 shadow-sm transition ${sel?.id === a.id ? 'border-brand ring-1 ring-brand' : ''}`}>
            <button className="block w-full text-left" onClick={() => setSelId(a.id)}>
              <div className="flex gap-3">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-neutral-200">
                  {a.featured_image && <img src={a.featured_image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-bold">{a.title_hi}</p>
                  <p className="mt-1 text-xs text-neutral-500">{a.is_blog ? 'कम्युनिटी ब्लॉग' : 'समाचार'} · {a.author_name} · {a.category_name}</p>
                </div>
              </div>
            </button>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="success" className="flex-1" disabled={pending} onClick={() => approve(a)}><Check className="h-4 w-4" /> स्वीकार करें</Button>
              <Button size="sm" variant="destructive" className="flex-1" disabled={pending} onClick={() => { setSelId(a.id); setDrawer(true); }}><X className="h-4 w-4" /> अस्वीकार करें</Button>
            </div>
          </div>
        ))}
      </div>

      <article className="min-w-0 rounded-xl bg-white p-5 shadow-sm sm:p-8 xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto">
        {sel && (
          <>
            <p className="text-xs font-bold text-brand">{sel.is_blog ? 'कम्युनिटी ब्लॉग' : 'समाचार'} · {sel.category_name}</p>
            <h2 className="mt-1 text-3xl font-bold leading-tight">{sel.title_hi}</h2>
            <p className="mt-2 text-neutral-600">{sel.excerpt_hi}</p>
            <p className="mt-2 text-sm text-neutral-500">{sel.author_name} · {formatDateHi(sel.published_at)}</p>
            {sel.featured_image && <img src={sel.featured_image} alt="" className="mt-4 aspect-video w-full rounded-lg object-cover" />}
            <div className="mt-5"><ContentRenderer blocks={sel.content_hi.blocks} /></div>
          </>
        )}
      </article>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent>
          <SheetTitle>अस्वीकार करने का कारण</SheetTitle>
          <SheetDescription className="text-sm text-neutral-500">लेखक को स्पष्ट फ़ीडबैक दें ताकि वह लेख सुधारकर दोबारा भेज सके।</SheetDescription>
          <p className="rounded bg-neutral-100 p-2 text-sm font-semibold">{sel?.title_hi}</p>
          <Textarea rows={8} value={note} onChange={(e) => setNote(e.target.value)} placeholder="जैसे: स्रोतों का उल्लेख जोड़ें, शीर्षक छोटा करें…" />
          <div className="flex flex-wrap gap-2">
            {['स्रोत जोड़ें', 'तथ्य जाँचें', 'शीर्षक सुधारें', 'भाषा सुधारें'].map((t) => (
              <button key={t} onClick={() => setNote((n) => (n ? `${n}\n${t}।` : `${t}।`))} className="rounded-full bg-neutral-100 px-3 py-1 text-xs hover:bg-neutral-200">+ {t}</button>
            ))}
          </div>
          <Button variant="destructive" onClick={reject} disabled={pending}>अस्वीकार करें और फ़ीडबैक भेजें</Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
