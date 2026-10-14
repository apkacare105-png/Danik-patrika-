# Dainik Patrika — Deployment Notes

## 1. Environment variables

Copy `.env.example` to `.env.local` for local development and configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `GNEWS_API_KEY` (server-side only)

Never expose `GNEWS_API_KEY` through a `NEXT_PUBLIC_*` variable.

## 2. Supabase

Run `supabase/migrations/001_daily_insights.sql` in the Supabase SQL editor/database migration flow. The migration includes the `articles.is_blog` field and RLS policies required for community blogs.

## 3. Community blogs

A normal authenticated user can open `/dashboard`, write a blog, save a draft, and submit it for review. Admin/staff approval changes the post to `published`. Published community posts are displayed under `/blogs` and `/blog/[slug]` and are clearly labeled as community blogs.

Ordinary users cannot publish directly: database RLS only permits them to create/update/delete their own blog drafts/pending/rejected posts. Publishing remains a staff operation.

## 4. News API

If `GNEWS_API_KEY` is configured, the homepage shows a server-fetched "ताज़ा अपडेट" section from GNews. The API key remains on the server and the feed is cached for 15 minutes. If the key is missing or the provider is unavailable, the rest of the site continues to render.

## 5. Production commands

```bash
npm ci
npm run typecheck
npm run build
npm start
```

Set the same environment variables in the hosting provider before building/deploying.
