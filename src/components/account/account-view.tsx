'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Eye, FileText, LayoutDashboard, LogOut, PenLine, XCircle, Camera } from 'lucide-react';
import { ROLE_LABEL, STATUS_LABEL, type ArticleStatus, type Profile } from '@/lib/types';
import type { Feedback } from '@/lib/types';
import type { AccountArticle, AccountStats } from '@/lib/account-data';
import { updateMyProfile } from '@/actions/account';
import { signOut } from '@/actions/public';
import { createClient, hasSupabaseClient } from '@/lib/supabase/client';
import { FeedbackTab } from './feedback-tab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_VARIANT: Record<ArticleStatus, 'secondary' | 'warning' | 'success' | 'danger'> = {
  draft: 'secondary', pending: 'warning', published: 'success', rejected: 'danger',
};

const dateFmt = new Intl.DateTimeFormat('hi-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('hi-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
const numFmt = new Intl.NumberFormat('hi-IN');

function articleHref(a: AccountArticle): string | null {
  if (a.status !== 'published') return null;
  return a.is_blog ? `/blog/${a.slug}` : `/news/${a.category_slug}/${a.slug}`;
}

type ActivityEvent = { key: string; at: string; icon: React.ReactNode; text: string; article: AccountArticle };

/** लेखों की स्थिति से गतिविधि की टाइमलाइन बनाता है (नई से पुरानी)। */
function buildActivity(articles: AccountArticle[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const a of articles) {
    const kind = a.is_blog ? 'ब्लॉग' : 'लेख';
    events.push({ key: `${a.id}-created`, at: a.created_at, icon: <FileText className="h-4 w-4" />, text: `आपने नया ${kind} शुरू किया`, article: a });
    if (a.status === 'pending') {
      events.push({ key: `${a.id}-pending`, at: a.updated_at, icon: <Clock className="h-4 w-4 text-amber-600" />, text: `${kind} समीक्षा के लिए भेजा गया`, article: a });
    } else if (a.status === 'rejected') {
      events.push({ key: `${a.id}-rejected`, at: a.updated_at, icon: <XCircle className="h-4 w-4 text-red-600" />, text: `${kind} अस्वीकृत हुआ`, article: a });
    } else if (a.status === 'published') {
      events.push({ key: `${a.id}-published`, at: a.published_at || a.updated_at, icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, text: `${kind} प्रकाशित हुआ`, article: a });
    } else if (+new Date(a.updated_at) - +new Date(a.created_at) > 60_000) {
      events.push({ key: `${a.id}-edited`, at: a.updated_at, icon: <PenLine className="h-4 w-4" />, text: `${kind} का ड्राफ़्ट सहेजा गया`, article: a });
    }
  }
  return events.sort((x, y) => +new Date(y.at) - +new Date(x.at));
}

function Avatar({ src, name, size }: { src?: string | null; name: string; size: number }) {
  const style = { width: size, height: size };
  if (src) return <img src={src} alt={name} style={style} className="rounded-full object-cover ring-4 ring-white" />;
  return (
    <span style={{ ...style, fontSize: size / 2.4 }} className="flex items-center justify-center rounded-full bg-brand font-display text-white ring-4 ring-white">
      {name.trim().charAt(0).toUpperCase() || 'ड'}
    </span>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">{icon}{label}</div>
      <p className="mt-2 text-3xl font-bold tabular-nums">{numFmt.format(value)}</p>
    </div>
  );
}

export function AccountView({ profile, articles, stats, feedback }: { profile: Profile; articles: AccountArticle[]; stats: AccountStats; feedback: Feedback[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'blog' | 'news'>('all');
  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activity = useMemo(() => buildActivity(articles), [articles]);
  const list = useMemo(
    () => articles.filter((a) => (filter === 'all' ? true : filter === 'blog' ? a.is_blog : !a.is_blog)),
    [articles, filter],
  );
  const canWriteNews = profile.role !== 'public_visitor';

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return toast.error('सिर्फ़ JPG, PNG, WEBP या GIF तस्वीर चुनें।');
    if (file.size > 5 * 1024 * 1024) return toast.error('तस्वीर 5 MB से छोटी होनी चाहिए।');
    if (!hasSupabaseClient()) return toast.error('डेमो मोड में तस्वीर अपलोड उपलब्ध नहीं है।');
    setBusy(true);
    try {
      const client = createClient();
      const path = `${profile.id}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
      const { error } = await client.storage.from('profile-avatars').upload(path, file, { cacheControl: '3600', contentType: file.type });
      if (error) throw error;
      const url = client.storage.from('profile-avatars').getPublicUrl(path).data.publicUrl;
      const res = await updateMyProfile({ display_name: name, bio, avatar_url: url });
      if (!res.ok) throw new Error(res.message);
      await client.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
      toast.success('प्रोफ़ाइल तस्वीर बदल गई।');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'तस्वीर अपलोड नहीं हो सकी।');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await updateMyProfile({ display_name: name, bio });
    setBusy(false);
    res.ok ? toast.success(res.message) : toast.error(res.message);
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* प्रोफ़ाइल हेडर */}
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-brand to-neutral-900" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end">
          <div className="-mt-12"><Avatar src={avatarUrl} name={name || profile.display_name} size={96} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold">{profile.display_name}</h1>
              <Badge variant="info">{ROLE_LABEL[profile.role]}</Badge>
            </div>
            <p className="truncate text-sm text-neutral-500">{profile.email}</p>
            <p className="mt-1 text-xs text-neutral-500">सदस्य बने: {dateFmt.format(new Date(profile.created_at))}</p>
            {profile.bio && <p className="mt-2 max-w-2xl text-sm text-neutral-700">{profile.bio}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/dashboard"><LayoutDashboard className="h-4 w-4" /> लिखें / डैशबोर्ड</Link></Button>
            <Button
              variant="outline"
              onClick={async () => { await signOut(); router.push('/login'); router.refresh(); }}
            >
              <LogOut className="h-4 w-4" /> लॉग आउट
            </Button>
          </div>
        </div>
      </section>

      {/* आँकड़े */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="कुल पोस्ट" value={stats.total} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="प्रकाशित" value={stats.published} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
        <StatCard label="समीक्षा में" value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-600" />} />
        <StatCard label="कुल व्यूज़" value={stats.views} icon={<Eye className="h-4 w-4 text-sky-600" />} />
      </section>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">मेरी गतिविधि</TabsTrigger>
          <TabsTrigger value="posts">मेरे ब्लॉग और लेख ({stats.total})</TabsTrigger>
          <TabsTrigger value="profile">प्रोफ़ाइल बदलें</TabsTrigger>
          <TabsTrigger value="feedback">फ़ीडबैक</TabsTrigger>
        </TabsList>

        {/* गतिविधि */}
        <TabsContent value="activity">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            {!activity.length ? (
              <p className="py-8 text-center text-sm text-neutral-500">अभी कोई गतिविधि नहीं है। अपना पहला ब्लॉग लिखकर शुरुआत करें।</p>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-neutral-200 pl-6">
                {activity.slice(0, 30).map((ev) => {
                  const href = articleHref(ev.article);
                  return (
                    <li key={ev.key} className="relative">
                      <span className="absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-neutral-200 bg-white">{ev.icon}</span>
                      <p className="text-sm font-semibold">{ev.text}</p>
                      <p className="text-sm text-neutral-600">
                        {href ? <Link href={href} className="hover:text-brand hover:underline">{ev.article.title_hi}</Link> : ev.article.title_hi}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">{dateTimeFmt.format(new Date(ev.at))}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </TabsContent>

        {/* ब्लॉग / लेख */}
        <TabsContent value="posts">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {([['all', `सभी (${stats.total})`], ['blog', `ब्लॉग (${stats.blogs})`], ...(canWriteNews ? [['news', `ख़बरें (${stats.news})`]] : [])] as [typeof filter, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${filter === key ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                >
                  {label}
                </button>
              ))}
              <Button asChild size="sm" className="ml-auto"><Link href="/dashboard"><PenLine className="h-4 w-4" /> नया ब्लॉग लिखें</Link></Button>
            </div>

            {!list.length ? (
              <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
                <p className="font-bold">यहाँ अभी कुछ नहीं है।</p>
                <p className="mt-1 text-sm text-neutral-500">डैशबोर्ड से अपना पहला ब्लॉग लिखें।</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((a) => {
                  const href = articleHref(a);
                  const body = (
                    <>
                      <div className="aspect-[16/9] bg-neutral-100">
                        {a.featured_image && <img src={a.featured_image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                          {a.is_blog && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BLOG</span>}
                        </div>
                        <h3 className="mt-2 line-clamp-2 font-bold leading-snug">{a.title_hi}</h3>
                        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                          <span>{dateFmt.format(new Date(a.updated_at))}</span>
                          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{numFmt.format(a.views)}</span>
                        </div>
                        {a.status === 'rejected' && a.rejection_note && (
                          <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-800">संपादक की टिप्पणी: {a.rejection_note}</p>
                        )}
                      </div>
                    </>
                  );
                  const cls = 'overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';
                  return href
                    ? <Link key={a.id} href={href} className={cls}>{body}</Link>
                    : <Link key={a.id} href="/dashboard" className={cls} title="डैशबोर्ड में संपादित करें">{body}</Link>;
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="feedback"><FeedbackTab initial={feedback} /></TabsContent>

        {/* प्रोफ़ाइल संपादन */}
        <TabsContent value="profile">
          <form onSubmit={save} className="grid max-w-2xl gap-5 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar src={avatarUrl} name={name || profile.display_name} size={72} />
              <div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                  <Camera className="h-4 w-4" /> तस्वीर बदलें
                </Button>
                <p className="mt-1 text-xs text-neutral-500">JPG, PNG, WEBP या GIF · अधिकतम 5 MB</p>
              </div>
            </div>
            <div>
              <label htmlFor="acc-name" className="mb-1 block text-sm font-semibold">नाम</label>
              <Input id="acc-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} disabled={busy} required />
            </div>
            <div>
              <label htmlFor="acc-email" className="mb-1 block text-sm font-semibold">ईमेल</label>
              <Input id="acc-email" value={profile.email} readOnly disabled />
            </div>
            <div>
              <label htmlFor="acc-bio" className="mb-1 block text-sm font-semibold">अपने बारे में</label>
              <textarea
                id="acc-bio"
                value={bio}
                maxLength={500}
                rows={4}
                onChange={(e) => setBio(e.target.value)}
                disabled={busy}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <p className="text-right text-xs text-neutral-400">{bio.length}/500</p>
            </div>
            <div><Button type="submit" disabled={busy}>{busy ? 'सहेजा जा रहा है…' : 'सहेजें'}</Button></div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
