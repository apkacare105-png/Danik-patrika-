import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const hasSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** लॉगिन-सत्र वाला क्लाइंट (Server Actions, डैशबोर्ड, एडमिन) — RLS यूज़र की भूमिका पर लागू होती है */
export function createClient() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* Server Component से कुकी सेट नहीं होती — middleware संभालता है */
        }
      },
    },
  });
}

/** सार्वजनिक पठन (ISR-अनुकूल, कुकी नहीं पढ़ता) */
export function createPublicClient() {
  return createJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
