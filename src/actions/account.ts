'use server';

import { revalidatePath } from 'next/cache';
import { createClient, hasSupabase } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';

/** अपना नाम, बायो और (वैकल्पिक) प्रोफ़ाइल तस्वीर का URL अपडेट करें। */
export async function updateMyProfile(input: { display_name: string; bio: string; avatar_url?: string | null }): Promise<ActionResult> {
  const display_name = input.display_name.trim();
  const bio = input.bio.trim();
  if (display_name.length < 2) return { ok: false, message: 'नाम कम से कम 2 अक्षर का होना चाहिए।' };
  if (display_name.length > 80) return { ok: false, message: 'नाम 80 अक्षर से छोटा रखें।' };
  if (bio.length > 500) return { ok: false, message: 'बायो 500 अक्षर से छोटा रखें।' };
  if (!hasSupabase()) return { ok: true, message: 'प्रोफ़ाइल सहेजी गई। (डेमो मोड)' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'कृपया पहले लॉगिन करें।' };

  const update: Record<string, unknown> = { display_name, bio: bio || null };
  if (input.avatar_url !== undefined) {
    const url = input.avatar_url;
    // सिर्फ़ अपने फ़ोल्डर की तस्वीर स्वीकार करें
    if (url && !url.includes(`/profile-avatars/${user.id}/`)) return { ok: false, message: 'अमान्य प्रोफ़ाइल तस्वीर।' };
    update.avatar_url = url;
  }

  const { error } = await supabase.from('profiles').update(update).eq('id', user.id);
  if (error) return { ok: false, message: 'प्रोफ़ाइल सहेजी नहीं जा सकी: ' + error.message };

  revalidatePath('/account');
  return { ok: true, message: 'प्रोफ़ाइल सहेज ली गई।' };
}
