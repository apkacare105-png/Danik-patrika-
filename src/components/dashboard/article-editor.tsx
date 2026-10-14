'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Bold, Check, Heading2, ImagePlus, List, Loader2, Monitor, Quote, Send, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ArticleStatus, Category } from '@/lib/types';
import { countWords, markdownToBlocks, readingMinutes } from '@/lib/content';
import { saveDraft, submitForReview } from '@/actions/author';
import { createClient, hasSupabaseClient } from '@/lib/supabase/client';
import { ContentRenderer } from '@/components/article/content-renderer';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { formatDateHi } from '@/lib/utils';

export type EditorState = {
  id?: string; title_hi: string; excerpt_hi: string; content_md: string; featured_image: string | null;
  category_id: string; sub_category_id: string | null; status: ArticleStatus; rejection_note?: string | null; is_blog?: boolean;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function ArticleEditor({
  initial, categories, onSaved,
}: { initial: EditorState; categories: Category[]; onSaved: (id: string, s: EditorState) => void }) {
  const [s, setS] = useState<EditorState>(initial);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRun = useRef(true);
  const idRef = useRef<string | undefined>(initial.id);
  const dirty = useRef(false);

  const locked = s.status === 'pending' || s.status === 'published';
  const words = countWords(s.content_md);
  const cat = categories.find((c) => c.id === s.category_id);
  const patch = (p: Partial<EditorState>) => { dirty.current = true; setS((prev) => ({ ...prev, ...p })); };

  // ऑटो-सेव (डिबाउंस 1.5 सेकंड)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (!dirty.current || locked) return;
    setSaveState('saving');
    const t = setTimeout(async () => {
      const r = await saveDraft({ ...s, id: idRef.current });
      if (r.ok) {
        idRef.current = r.id;
        setSaveState('saved');
        if (r.id) onSaved(r.id, { ...s, status: 'draft' });
      } else {
        setSaveState('error');
        toast.error(r.message);
      }
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.title_hi, s.excerpt_hi, s.content_md, s.featured_image, s.category_id, s.sub_category_id]);

  const wrap = (before: string, after = before) => {
    const el = textRef.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const sel = value.slice(a, b) || 'पाठ';
    patch({ content_md: value.slice(0, a) + before + sel + after + value.slice(b) });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + sel.length); });
  };
  const linePrefix = (prefix: string) => {
    const el = textRef.current; if (!el) return;
    const { selectionStart: a, value } = el;
    const needsGap = value.length > 0 && !value.slice(0, a).endsWith('\n\n');
    patch({ content_md: value.slice(0, a) + (needsGap ? (value.slice(0, a).endsWith('\n') ? '\n' : '\n\n') : '') + prefix + value.slice(a) });
    requestAnimationFrame(() => el.focus());
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('कृपया केवल इमेज फ़ाइल चुनें।');
    if (file.size > 5 * 1024 * 1024) return toast.error('इमेज 5 MB से छोटी होनी चाहिए।');
    if (!hasSupabaseClient()) { patch({ featured_image: URL.createObjectURL(file) }); return toast.success('इमेज जोड़ी गई (डेमो मोड)'); }
    setUploading(true);
    try {
      const sb = createClient();
      const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const { error } = await sb.storage.from('article-images').upload(path, file, { cacheControl: '3600' });
      if (error) throw error;
      patch({ featured_image: sb.storage.from('article-images').getPublicUrl(path).data.publicUrl });
      toast.success('इमेज अपलोड हो गई');
    } catch {
      toast.error('इमेज अपलोड नहीं हो सकी।');
    } finally { setUploading(false); }
  };

  const submit = () => startSubmit(async () => {
    const r = await submitForReview({ ...s, id: idRef.current });
    if (r.ok) {
      idRef.current = r.id;
      setS((p) => ({ ...p, status: 'pending' }));
      setSaveState('saved');
      if (r.id) onSaved(r.id, { ...s, status: 'pending' });
      toast.success(r.message);
    } else toast.error(r.message);
  });

  const blocks = markdownToBlocks(s.content_md);

  const indicator =
    saveState === 'saving' ? <span className="flex items-center gap-1.5 text-amber-600"><Loader2 className="h-4 w-4 animate-spin" /> सहेजा जा रहा है...</span>
    : saveState === 'saved' ? <span className="flex items-center gap-1.5 text-emerald-600"><Check className="h-4 w-4" /> सभी बदलाव सहेजे गए</span>
    : saveState === 'error' ? <span className="text-red-600">सहेजा नहीं जा सका</span>
    : <span className="text-neutral-400">बदलाव अपने-आप सहेजे जाएँगे</span>;

  return (
    <div className="rounded-xl bg-white shadow-sm">
      {/* टूलबार */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3 text-sm" aria-live="polite">{initial.is_blog && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">कम्युनिटी ब्लॉग</span>}{indicator}</div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <Switch checked={preview} onCheckedChange={setPreview} aria-label="लाइव प्रीव्यू" /> लाइव प्रीव्यू
          </label>
          <Button onClick={submit} disabled={submitting || locked || !s.title_hi.trim()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {s.status === 'pending' ? 'समीक्षा में है' : 'समीक्षा के लिए भेजें'}
          </Button>
        </div>
      </div>

      {s.status === 'rejected' && s.rejection_note && (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-bold">संपादक का फ़ीडबैक</p>
          <p>{s.rejection_note}</p>
        </div>
      )}
      {locked && <p className="m-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">यह लेख {s.status === 'pending' ? 'समीक्षा में' : 'प्रकाशित'} है, इसलिए संपादन बंद है।</p>}

      <div className={`grid gap-6 p-4 ${preview ? 'xl:grid-cols-2' : ''}`}>
        {/* संपादन पैनल */}
        <div className="min-w-0 space-y-4">
          <div>
            <Label htmlFor="title">{s.is_blog ? 'ब्लॉग का शीर्षक' : 'शीर्षक'}</Label>
            <Input id="title" value={s.title_hi} disabled={locked} onChange={(e) => patch({ title_hi: e.target.value })} placeholder={s.is_blog ? 'अपने ब्लॉग का आकर्षक शीर्षक लिखें' : 'ख़बर का आकर्षक शीर्षक लिखें'} className="h-12 font-display text-xl" />
          </div>
          <div>
            <Label htmlFor="excerpt">संक्षिप्त सार</Label>
            <Textarea id="excerpt" rows={2} value={s.excerpt_hi} disabled={locked} onChange={(e) => patch({ excerpt_hi: e.target.value })} placeholder="1-2 पंक्तियों में ख़बर का सार" maxLength={220} />
            <p className="mt-1 text-right text-xs text-neutral-400">{s.excerpt_hi.length}/220</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="cat">श्रेणी</Label>
              <Select id="cat" value={s.category_id} disabled={locked} onChange={(e) => patch({ category_id: e.target.value, sub_category_id: null })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_hi}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="sub">उप-श्रेणी</Label>
              <Select id="sub" value={s.sub_category_id ?? ''} disabled={locked || !cat?.sub_categories.length} onChange={(e) => patch({ sub_category_id: e.target.value || null })}>
                <option value="">— चुनें —</option>
                {cat?.sub_categories.map((c) => <option key={c.id} value={c.id}>{c.name_hi}</option>)}
              </Select>
            </div>
          </div>

          {/* फ़ीचर इमेज ड्रॉपज़ोन */}
          <div>
            <Label>फ़ीचर इमेज</Label>
            {s.featured_image ? (
              <div className="relative overflow-hidden rounded-lg">
                <img src={s.featured_image} alt="फ़ीचर इमेज" className="aspect-video w-full object-cover" />
                {!locked && (
                  <Button variant="destructive" size="sm" className="absolute right-2 top-2" onClick={() => patch({ featured_image: null })}>
                    <Trash2 className="h-4 w-4" /> हटाएँ
                  </Button>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); if (!locked) handleFile(e.dataTransfer.files?.[0]); }}
                onClick={() => !locked && fileRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !locked && fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition ${dragging ? 'border-brand bg-red-50' : 'border-neutral-300 hover:border-brand'}`}
              >
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-brand" /> : <ImagePlus className="h-8 w-8 text-neutral-400" />}
                <p className="text-sm font-semibold">{uploading ? 'अपलोड हो रही है…' : 'इमेज यहाँ खींचकर छोड़ें या क्लिक करके चुनें'}</p>
                <p className="text-xs text-neutral-500">JPG, PNG या WebP · अधिकतम 5 MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>

          {/* रिच टेक्स्ट */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="body">{s.is_blog ? 'ब्लॉग का मुख्य पाठ' : 'ख़बर का मुख्य पाठ'}</Label>
              <span className="text-xs text-neutral-500">{words} शब्द · लगभग {readingMinutes(words)} मिनट</span>
            </div>
            <div className="flex flex-wrap gap-1 rounded-t-md border border-b-0 bg-neutral-50 p-1.5">
              {[
                { l: 'बोल्ड', i: Bold, f: () => wrap('**') },
                { l: 'उप-शीर्षक', i: Heading2, f: () => linePrefix('## ') },
                { l: 'उद्धरण', i: Quote, f: () => linePrefix('> ') },
                { l: 'सूची', i: List, f: () => linePrefix('- ') },
              ].map((b) => (
                <Button key={b.l} type="button" variant="ghost" size="sm" disabled={locked} onClick={b.f} title={b.l} aria-label={b.l}><b.i className="h-4 w-4" /> <span className="hidden sm:inline">{b.l}</span></Button>
              ))}
            </div>
            <Textarea
              id="body" ref={textRef} rows={18} value={s.content_md} disabled={locked}
              onChange={(e) => patch({ content_md: e.target.value })}
              placeholder={s.is_blog ? 'यहाँ अपना ब्लॉग लिखें…\n\nनया पैराग्राफ़ शुरू करने के लिए एक ख़ाली लाइन छोड़ें।' : 'यहाँ ख़बर लिखें…\n\nनया पैराग्राफ़ शुरू करने के लिए एक ख़ाली लाइन छोड़ें।'}
              className="rounded-t-none font-sans text-base leading-8"
            />
          </div>
        </div>

        {/* लाइव प्रीव्यू */}
        {preview && (
          <div className="min-w-0 rounded-xl bg-neutral-100 p-3 xl:sticky xl:top-20 xl:self-start">
            <div className="mb-3 flex justify-center gap-1">
              <Button size="sm" variant={device === 'mobile' ? 'dark' : 'outline'} onClick={() => setDevice('mobile')}><Smartphone className="h-4 w-4" /> मोबाइल</Button>
              <Button size="sm" variant={device === 'desktop' ? 'dark' : 'outline'} onClick={() => setDevice('desktop')}><Monitor className="h-4 w-4" /> डेस्कटॉप</Button>
            </div>
            <div className={`mx-auto overflow-hidden bg-white shadow-xl transition-all ${device === 'mobile' ? 'max-w-[375px] rounded-[2rem] border-[10px] border-neutral-900' : 'max-w-full rounded-lg border'}`}>
              <div className="max-h-[75vh] overflow-y-auto p-4">
                <p className="text-xs font-bold text-brand">{cat?.name_hi ?? 'श्रेणी'}</p>
                <h2 className={`mt-1 font-bold leading-tight ${device === 'mobile' ? 'text-2xl' : 'text-4xl'}`}>{s.title_hi || 'ख़बर का शीर्षक यहाँ दिखेगा'}</h2>
                <p className="mt-2 text-neutral-600">{s.excerpt_hi}</p>
                <p className="mt-2 text-xs text-neutral-500">आप · {formatDateHi(new Date())}</p>
                {s.featured_image && <img src={s.featured_image} alt="" className="mt-3 aspect-video w-full rounded-lg object-cover" />}
                <div className="mt-4 text-[15px]">
                  {blocks.length ? <ContentRenderer blocks={blocks} /> : <p className="text-neutral-400">पाठ लिखते ही यहाँ प्रीव्यू दिखेगा…</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
