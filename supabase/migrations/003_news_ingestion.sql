alter table public.articles
  add column if not exists source_url text,
  add column if not exists source_name text,
  add column if not exists external_id text,
  add column if not exists ingestion_payload jsonb;

create unique index if not exists articles_source_url_unique
  on public.articles (source_url)
  where source_url is not null;

create unique index if not exists articles_external_id_unique
  on public.articles (external_id) 
  where external_id is not null;