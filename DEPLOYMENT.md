# Dainik Patrika — Deployment Notes

## 1. Environment variables

Copy `.env.example` to `.env.local` for local development and configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `NEXT_PUBLIC_SITE_URL`
- `GNEWS_API_KEY` (server-side only)
- `CRICKET_DATA_API_KEY` (server-side only; optional)

Never expose `GNEWS_API_KEY` through a `NEXT_PUBLIC_*` variable.
Never expose `CRICKET_DATA_API_KEY` through a `NEXT_PUBLIC_*` variable.
Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`, `NEWS_INGESTION_SECRET`, or any `GV_*` values.

## 2. Supabase

For a new project, run the SQL files in `supabase/migrations` in numerical order. For an existing project, run any migrations not yet applied; `003_rename_auto_category_to_jobs.sql` replaces the Auto category with Jobs.

Run `supabase/migrations/005_epaper_editions.sql` before using e-paper management. It creates the editions table and public PDF bucket, while restricting edition and file changes to admins and super-admins.

## 3. Cricket live scores

Sign up for a free CricketData.org API key and configure it as `CRICKET_DATA_API_KEY` in `.env.local` or your hosting provider. Scores appear under **खेल → क्रिकेट**. The free plan currently advertises 100 API requests per day and may serve data a few minutes behind real time; provider requests are cached for 15 minutes.

## 4. GetViral signed publishing

The existing `/api/receieve` Next.js route accepts GetViral's signed webhook requests as well as the existing `NEWS_INGESTION_SECRET` integration. No separate Express server or PostgreSQL adapter is needed; articles are written to the existing Supabase `articles` and `categories` tables.

1. Apply `supabase/migrations/004_getviral_receiver.sql` to the production Supabase project after the existing migrations. It creates private, durable nonce storage for replay protection.
2. From the private setup bundle, configure `GV_SITE`, `GV_ENDPOINT`, `GV_PLATFORM`, `GV_KEY`, and `GV_SECRET` as server-only environment variables in the hosting provider. Use the exact origins and endpoint from the bundle; the endpoint must be HTTPS and on the `GV_SITE` origin. Do not copy `site-config.cjs` into the repository or expose these values as `NEXT_PUBLIC_*`.
3. Configure the same variables in `.env.local` only if you need to test locally. Keep credentials out of Git and deployment logs. If a bundle credential was exposed, ask the website owner to rotate it and issue a fresh bundle.
4. Deploy, then have the website owner use the platform's **Verify** action and send a test article. The stable `publish_id` is stored as the article's external ID, so retries update the same article instead of creating duplicates.

## 5. Community blogs

A normal authenticated user can open `/dashboard`, write a blog, save a draft, and submit it for review. Admin/staff approval changes the post to `published`. Published community posts are displayed under `/blogs` and `/blog/[slug]` and are clearly labeled as community blogs.

Ordinary users cannot publish directly: database RLS only permits them to create/update/delete their own blog drafts/pending/rejected posts. Publishing remains a staff operation.

## 6. News API

If `GNEWS_API_KEY` is configured, the homepage shows a server-fetched "ताज़ा अपडेट" section from GNews. The API key remains on the server and the feed is cached for 15 minutes. If the key is missing or the provider is unavailable, the rest of the site continues to render.

## 7. Production commands

```bash
npm ci
npm run typecheck
npm run build
npm start
```

Set the same environment variables in the hosting provider before building/deploying.
