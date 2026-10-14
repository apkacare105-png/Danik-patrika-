# दैनिक पत्रिका (Dainik Patrika) — हिंदी न्यूज़ पोर्टल

Next.js 14 (App Router, RSC, Server Actions) + Tailwind + shadcn/ui-शैली कंपोनेंट + Framer Motion + Supabase।

## तुरंत चलाएँ (डेमो मोड)

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` न होने पर पोर्टल **डेमो मोड** में चलता है: मॉक हिंदी ख़बरें, बिना लॉगिन के `/dashboard` और `/admin` खुले, और सभी बदलाव सिर्फ़ टोस्ट में दिखते हैं (कहीं सहेजे नहीं जाते)।

## असली Supabase से जोड़ें

1. Supabase में नया प्रोजेक्ट बनाएँ → **SQL Editor** में `supabase/migrations/001_daily_insights.sql` पूरा चलाएँ (स्कीमा, RLS, ट्रिगर, स्टोरेज और डेमो डेटा)।
2. `.env.example` को `.env.local` में कॉपी करके `NEXT_PUBLIC_SUPABASE_URL` और `NEXT_PUBLIC_SUPABASE_ANON_KEY` भरें।
3. साइट पर `/login` से साइन-अप करें, फिर SQL Editor में पहला सुपर एडमिन बनाएँ:
   ```sql
   update public.profiles set role = 'super_admin' where email = 'आपका@ईमेल.com';
   ```
4. `/admin/users` से बाक़ी लोगों को “लेखक” या “एडमिन” बनाएँ।

## भूमिकाएँ और अनुमतियाँ

| भूमिका | अधिकार |
|---|---|
| सुपर एडमिन | सभी टेबल पर पूर्ण CRUD, साइट/विज्ञापन सेटिंग्स, किसी को भी कोई भूमिका |
| एडमिन | लेख, श्रेणियाँ, पोर्टफ़ोलियो पर CRUD; साइट/विज्ञापन सेटिंग्स सिर्फ़ पढ़ना; सिर्फ़ पाठक↔लेखक बदल सकता है (DB ट्रिगर से लागू) |
| लेखक | अपने लेख बनाना/बदलना/हटाना (सिर्फ़ draft/pending स्थिति में); publish नहीं कर सकता |
| पाठक | प्रकाशित लेख, सक्रिय श्रेणियाँ, साइट सेटिंग्स, चालू विज्ञापन, पोर्टफ़ोलियो पढ़ना |

सुरक्षा **डेटाबेस में RLS से** लागू है; UI की जाँचें सिर्फ़ सुविधा के लिए हैं।

## मुख्य रूट

- `/` होम · `/category/[slug]` · `/news/[category]/[slug]` · `/hamare-karya` · `/login`
- `/dashboard` — लेखक एडिटर (ऑटो-सेव, लाइव प्रीव्यू, इमेज अपलोड)
- `/admin` — अवलोकन · `/admin/approvals` · `/admin/users` · `/admin/categories` · `/admin/ads` · `/admin/settings` · `/admin/portfolio`

## ध्यान रखें

- फ़ॉन्ट `next/font/google` से बिल्ड के समय डाउनलोड होते हैं (इंटरनेट चाहिए)।
- सारी ख़बरें और नाम **काल्पनिक डेमो सामग्री** हैं; इन्हें अपनी सामग्री से बदलें।
- AdSense: `/admin/ads` में पब्लिशर ID (`ca-pub-` + 16 अंक) और `<ins class="adsbygoogle">` कोड डालें।
- वेब स्टोरीज़ अभी `src/lib/mock-data.ts` से आती हैं; चाहें तो इन्हें Supabase टेबल पर ले जाएँ।
- ZIP दोबारा बनाने के लिए: `npm run zip`।


## Community blogs
Registered users can use `/dashboard` to write a community blog. Blogs are stored with `is_blog = true`, remain in draft/pending/rejected states until review, and are published by admin approval at `/blog/[slug]`. Run the updated Supabase migration before enabling this workflow in production.
