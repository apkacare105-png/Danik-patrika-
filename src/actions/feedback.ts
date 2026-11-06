'use server';

import { revalidatePath } from 'next/cache';
import { createClient, hasSupabase } from '@/lib/supabase/server';
import type { ActionResult, FeedbackCategory, FeedbackStatus } from '@/lib/types';

const CATEGORIES: FeedbackCategory[] = ['general', 'bug', 'suggestion', 'content', 'other'];
const STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'resolved'];

export async function submitFeedback(input: { category: FeedbackCategory; rating: number | null; message: string }): Promise<ActionResult> {
  const message = input.message.trim();
  if (message.length < 5) return { ok: false, message: 'कृपया कम से कम 5 अक्षर का फ़ीडबैक लिखें।' };
  if (message.length > 2000) return { ok: false, message: 'फ़ीडबैक 2000 अक्षर से छोटा रखें।' };
  if (!CATEGORIES.includes(input.category)) return { ok: false, message: 'अमान्य श्रेणी।' };
  const rating = input.rating == null ? null : Math.round(input.rating);
  if (rating !== null && (rating < 1 || rating > 5)) return { ok: false, message: 'रेटिंग 1 से 5 के बीच होनी चाहिए।' };
  if (!hasSupabase()) return { ok: true, message: 'आपका फ़ीडबैक भेज दिया गया। धन्यवाद! (डेमो मोड)' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'फ़ीडबैक भेजने के लिए कृपया लॉगिन करें।' };

  const { error } = await supabase.from('user_feedback').insert({ user_id: user.id, category: input.category, rating, message });
  if (error) return { ok: false, message: 'फ़ीडबैक भेजा नहीं जा सका, कृपया दोबारा प्रयास करें।' };
  revalidatePath('/account');
  revalidatePath('/admin/feedback');
  return { ok: true, message: 'आपका फ़ीडबैक भेज दिया गया। धन्यवाद!' };
}

export async function setFeedbackStatus(id: string, status: FeedbackStatus): Promise<ActionResult> {
  if (!STATUSES.includes(status)) return { ok: false, message: 'अमान्य स्थिति।' };
  if (!hasSupabase()) return { ok: true, message: 'स्थिति बदली गई। (डेमो मोड)' };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'कृपया पहले लॉगिन करें।' };
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin' && me?.role !== 'super_admin') return { ok: false, message: 'आपको यह अनुमति नहीं है।' };

  const { error } = await supabase.from('user_feedback').update({ status }).eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/admin/feedback');
  return { ok: true, message: 'स्थिति बदली गई।' };
}
