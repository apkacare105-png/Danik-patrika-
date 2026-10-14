'use client';

import { useState, useTransition } from 'react';
import { Lock, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { NavLink, SiteSettings } from '@/lib/types';
import { hexToRgb } from '@/lib/utils';
import { saveSiteSettings } from '@/actions/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SWATCHES = ['#e2231a', '#c2410c', '#0369a1', '#15803d', '#7e22ce', '#be123c'];

function NavEditor({ items, onChange, disabled }: { items: NavLink[]; onChange: (v: NavLink[]) => void; disabled: boolean }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it.label} disabled={disabled} placeholder="नाम" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          <Input value={it.href} disabled={disabled} placeholder="/लिंक" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} />
          <Button variant="ghost" size="icon" disabled={disabled} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="हटाएँ"><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...items, { label: '', href: '/' }])}><Plus className="h-4 w-4" /> लिंक जोड़ें</Button>
    </div>
  );
}

export function SettingsPanel({ initial, readOnly }: { initial: SiteSettings; readOnly: boolean }) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const accent = hexToRgb(s.theme.accent);

  const save = () => start(async () => {
    const r = await saveSiteSettings(s);
    r.ok ? toast.success(r.message) : toast.error(r.message);
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">CMS सेटिंग्स</h2>
          {readOnly ? <Badge variant="warning"><Lock className="mr-1 h-3 w-3" /> सिर्फ़ देखने की अनुमति</Badge> : <Button onClick={save} disabled={pending}><Save className="h-4 w-4" /> {pending ? 'सहेजा जा रहा है…' : 'सभी बदलाव सहेजें'}</Button>}
        </div>
        <Tabs defaultValue="brand">
          <TabsList><TabsTrigger value="brand">ब्रांड</TabsTrigger><TabsTrigger value="seo">SEO</TabsTrigger><TabsTrigger value="theme">थीम</TabsTrigger><TabsTrigger value="nav">नेविगेशन</TabsTrigger><TabsTrigger value="pages">स्थिर पेज</TabsTrigger></TabsList>

          <TabsContent value="brand" className="space-y-3">
            <div><Label htmlFor="sn">साइट का नाम</Label><Input id="sn" disabled={readOnly} value={s.site_name} onChange={(e) => set('site_name', e.target.value)} /></div>
            <div><Label htmlFor="lg">लोगो URL</Label><Input id="lg" disabled={readOnly} value={s.logo_url ?? ''} placeholder="https://…/logo.png" onChange={(e) => set('logo_url', e.target.value || null)} /></div>
            <div><Label htmlFor="fv">फ़ेविकॉन URL</Label><Input id="fv" disabled={readOnly} value={s.favicon_url ?? ''} placeholder="https://…/favicon.ico" onChange={(e) => set('favicon_url', e.target.value || null)} /></div>
            <p className="text-xs text-neutral-500">फ़ाइल अपलोड के लिए Supabase Storage के “branding” बकेट का सार्वजनिक URL यहाँ चिपकाएँ।</p>
          </TabsContent>

          <TabsContent value="seo" className="space-y-3">
            <div><Label htmlFor="st">मेटा शीर्षक</Label><Input id="st" disabled={readOnly} value={s.seo.title} onChange={(e) => set('seo', { ...s.seo, title: e.target.value })} /><p className="mt-1 text-xs text-neutral-400">{s.seo.title.length}/60 अक्षर सुझाए गए</p></div>
            <div><Label htmlFor="sd">मेटा विवरण</Label><Textarea id="sd" rows={3} disabled={readOnly} value={s.seo.description} onChange={(e) => set('seo', { ...s.seo, description: e.target.value })} /><p className="mt-1 text-xs text-neutral-400">{s.seo.description.length}/160 अक्षर सुझाए गए</p></div>
            <div><Label htmlFor="sk">कीवर्ड (कॉमा से अलग करें)</Label><Input id="sk" disabled={readOnly} value={s.seo.keywords} onChange={(e) => set('seo', { ...s.seo, keywords: e.target.value })} /></div>
            <div><Label htmlFor="so">OG इमेज URL</Label><Input id="so" disabled={readOnly} value={s.seo.og_image} onChange={(e) => set('seo', { ...s.seo, og_image: e.target.value })} /></div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <div>
              <Label>मुख्य (ऐक्सेंट) रंग</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input type="color" disabled={readOnly} value={s.theme.accent} onChange={(e) => set('theme', { ...s.theme, accent: e.target.value })} className="h-10 w-14 cursor-pointer rounded border" aria-label="ऐक्सेंट रंग" />
                <Input className="w-32" disabled={readOnly} value={s.theme.accent} onChange={(e) => set('theme', { ...s.theme, accent: e.target.value })} />
                {SWATCHES.map((c) => <button key={c} disabled={readOnly} onClick={() => set('theme', { ...s.theme, accent: c })} style={{ background: c }} className="h-8 w-8 rounded-full ring-offset-2 hover:ring-2" aria-label={`रंग ${c}`} />)}
              </div>
            </div>
            <div>
              <Label>पाठ का रंग</Label>
              <div className="flex items-center gap-2">
                <input type="color" disabled={readOnly} value={s.theme.ink} onChange={(e) => set('theme', { ...s.theme, ink: e.target.value })} className="h-10 w-14 cursor-pointer rounded border" aria-label="पाठ रंग" />
                <Input className="w-32" disabled={readOnly} value={s.theme.ink} onChange={(e) => set('theme', { ...s.theme, ink: e.target.value })} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nav" className="space-y-5">
            <div><p className="mb-2 font-bold">हेडर लिंक</p><NavEditor items={s.header_nav} disabled={readOnly} onChange={(v) => set('header_nav', v)} /></div>
            <div><p className="mb-2 font-bold">फ़ुटर लिंक</p><NavEditor items={s.footer_nav} disabled={readOnly} onChange={(v) => set('footer_nav', v)} /></div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-3">
            {s.static_pages.map((p, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex gap-2">
                  <Input disabled={readOnly} value={p.title} placeholder="पेज का शीर्षक" onChange={(e) => set('static_pages', s.static_pages.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Input disabled={readOnly} value={p.slug} placeholder="slug" className="w-40" onChange={(e) => set('static_pages', s.static_pages.map((x, j) => (j === i ? { ...x, slug: e.target.value.replace(/[^a-z0-9-]/gi, '') } : x)))} />
                  <Button variant="ghost" size="icon" disabled={readOnly} onClick={() => set('static_pages', s.static_pages.filter((_, j) => j !== i))} aria-label="पेज हटाएँ"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <Textarea disabled={readOnly} rows={3} value={p.body} onChange={(e) => set('static_pages', s.static_pages.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
              </div>
            ))}
            <Button variant="outline" size="sm" disabled={readOnly} onClick={() => set('static_pages', [...s.static_pages, { slug: '', title: '', body: '' }])}><Plus className="h-4 w-4" /> नया पेज</Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* लाइव थीम प्रीव्यू */}
      <div className="xl:sticky xl:top-4 xl:self-start">
        <div className="rounded-xl bg-white p-4 shadow-sm" style={{ ['--brand-rgb' as string]: accent, ['--ink-rgb' as string]: hexToRgb(s.theme.ink, '17 24 39') }}>
          <p className="mb-2 text-sm font-bold text-neutral-500">लाइव प्रीव्यू</p>
          <div className="overflow-hidden rounded-lg border">
            <div className="flex items-center gap-2 border-b p-3">
              {s.logo_url ? <img src={s.logo_url} alt="" className="h-8" /> : <span className="flex h-8 w-8 items-center justify-center rounded bg-brand font-display text-white">{s.site_name.slice(0, 1)}</span>}
              <span className="font-display text-xl text-ink">{s.site_name}</span>
            </div>
            <div className="flex bg-neutral-900 text-xs font-bold text-white"><span className="bg-brand px-3 py-2">देश</span><span className="px-3 py-2">खेल</span><span className="px-3 py-2">बिजनेस</span></div>
            <div className="space-y-2 p-3">
              <span className="inline-block rounded bg-brand px-2 py-0.5 text-xs font-bold text-white">ब्रेकिंग</span>
              <p className="font-display text-lg leading-snug text-ink">ख़बर का नमूना शीर्षक यहाँ दिखेगा</p>
              <button className="rounded bg-brand px-3 py-1.5 text-sm font-semibold text-white">पूरी ख़बर पढ़ें</button>
              <p className="text-xs text-neutral-500">{s.seo.title}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
