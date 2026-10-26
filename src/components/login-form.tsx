'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getPendingAvatar, removePendingAvatar, savePendingAvatar } from '@/lib/pending-avatar';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function LoginForm({ demo, next, forbidden }: { demo: boolean; next: string; forbidden: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  if (demo) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-bold">डेमो मोड</h1>
        <p className="mt-2 text-sm text-neutral-600">Supabase की कुंजियाँ सेट नहीं हैं, इसलिए लॉगिन बंद है और सभी पैनल खुले हैं। <code>.env.local</code> में कुंजियाँ जोड़कर असली लॉगिन चालू करें।</p>
        <div className="mt-5 grid gap-2">
          <Button asChild><Link href="/dashboard">लेखक डैशबोर्ड खोलें</Link></Button>
          <Button asChild variant="dark"><Link href="/admin">एडमिन पैनल खोलें</Link></Button>
        </div>
      </div>
    );
  }

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const client = createClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error('ईमेल या पासवर्ड ग़लत है।');
    try {
      const pendingAvatar = await getPendingAvatar(email);
      if (pendingAvatar && data.user) {
        const extension = pendingAvatar.type.split('/')[1];
        const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage.from('profile-avatars').upload(path, pendingAvatar, {
          cacheControl: '3600',
          contentType: pendingAvatar.type,
        });
        if (uploadError) throw uploadError;
        const avatarUrl = client.storage.from('profile-avatars').getPublicUrl(path).data.publicUrl;
        const { error: profileError } = await client.from('profiles').update({ avatar_url: avatarUrl }).eq('id', data.user.id);
        if (profileError) throw profileError;
        const { error: metadataError } = await client.auth.updateUser({ data: { avatar_url: avatarUrl } });
        if (metadataError) throw metadataError;
        await removePendingAvatar(email);
      }
      toast.success('लॉगिन सफल रहा!');
    } catch {
      toast.error('लॉगिन सफल रहा, लेकिन प्रोफ़ाइल तस्वीर अपलोड नहीं हो सकी। अगली बार लॉगिन करके फिर कोशिश करें।');
    }
    router.push(next);
    router.refresh();
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let accountCreated = false;
    try {
      if (avatar) await savePendingAvatar(email, avatar);
      const client = createClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) {
        if (avatar) await removePendingAvatar(email);
        return toast.error(error.message);
      }
      accountCreated = true;
      if (avatar && data.session && data.user) {
        const extension = avatar.type.split('/')[1];
        const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage.from('profile-avatars').upload(path, avatar, {
          cacheControl: '3600',
          contentType: avatar.type,
        });
        if (uploadError) throw uploadError;
        const avatarUrl = client.storage.from('profile-avatars').getPublicUrl(path).data.publicUrl;
        const { error: profileError } = await client.from('profiles').update({ avatar_url: avatarUrl }).eq('id', data.user.id);
        if (profileError) throw profileError;
        const { error: metadataError } = await client.auth.updateUser({ data: { avatar_url: avatarUrl } });
        if (metadataError) throw metadataError;
        await removePendingAvatar(email);
      }
      toast.success(avatar && !data.session
        ? 'खाता बन गया! ईमेल पुष्टि करने और पहली बार लॉगिन करने के बाद प्रोफ़ाइल तस्वीर अपलोड होगी।'
        : 'खाता बन गया! अगर ईमेल पुष्टि ज़रूरी है तो अपना इनबॉक्स देखें।');
    } catch {
      toast.error(accountCreated
        ? 'खाता बन गया, लेकिन प्रोफ़ाइल तस्वीर अपलोड नहीं हो सकी। लॉगिन के बाद फिर कोशिश करें।'
        : 'खाता नहीं बन सका या तस्वीर तैयार नहीं हो सकी। कृपया दोबारा प्रयास करें।');
    } finally {
      setBusy(false);
    }
  };

  const selectAvatar = (file?: File) => {
    if (!file) {
      setAvatar(null);
      return;
    }
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatar(null);
      return toast.error('JPG, PNG, WebP या GIF तस्वीर चुनें।');
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatar(null);
      return toast.error('तस्वीर 5 MB से छोटी होनी चाहिए।');
    }
    setAvatar(file);
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h1 className="mb-1 text-2xl font-bold">दैनिक पत्रिका में प्रवेश</h1>
      {forbidden && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">इस पेज के लिए आपके पास अनुमति नहीं है।</p>}
      <Tabs defaultValue="login">
        <TabsList className="w-full"><TabsTrigger value="login" className="flex-1">लॉगिन</TabsTrigger><TabsTrigger value="signup" className="flex-1">नया खाता</TabsTrigger></TabsList>
        <TabsContent value="login">
          <form onSubmit={login} className="space-y-3">
            <div><Label htmlFor="e1">ईमेल</Label><Input id="e1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="p1">पासवर्ड</Label><Input id="p1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button className="w-full" disabled={busy}>{busy ? 'कृपया प्रतीक्षा करें…' : 'लॉगिन करें'}</Button>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={signup} className="space-y-3">
            <div><Label htmlFor="n2">आपका नाम</Label><Input id="n2" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label htmlFor="e2">ईमेल</Label><Input id="e2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="p2">पासवर्ड (कम से कम 6 अक्षर)</Label><Input id="p2" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div>
              <Label htmlFor="avatar">प्रोफ़ाइल तस्वीर (वैकल्पिक)</Label>
              <Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={(e) => selectAvatar(e.target.files?.[0])} />
              <p className="mt-1 text-xs text-neutral-500">JPG, PNG, WebP या GIF · अधिकतम 5 MB</p>
              {avatar && <p className="mt-1 truncate text-xs text-neutral-600">{avatar.name}</p>}
            </div>
            <Button className="w-full" disabled={busy}>{busy ? 'कृपया प्रतीक्षा करें…' : 'खाता बनाएँ'}</Button>
            <p className="text-xs text-neutral-500">नए खाते की भूमिका “पाठक” होती है; एडमिन इसे “लेखक” बना सकते हैं।</p>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
