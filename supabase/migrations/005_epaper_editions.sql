create table if not exists public.epaper_editions (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  issue_number  text not null,
  published_on  date not null,
  pdf_path      text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.epaper_editions enable row level security;

drop policy if exists epaper_editions_public_read on public.epaper_editions;
drop policy if exists epaper_editions_staff_all on public.epaper_editions;

create policy epaper_editions_public_read on public.epaper_editions
  for select to anon, authenticated using (true);

create policy epaper_editions_staff_all on public.epaper_editions
  for all to authenticated
  using (public.get_my_role() in ('admin', 'super_admin'))
  with check (public.get_my_role() in ('admin', 'super_admin'));

drop trigger if exists touch_epaper_editions on public.epaper_editions;
create trigger touch_epaper_editions before update on public.epaper_editions
  for each row execute function public.touch_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('epapers', 'epapers', true, 52428800, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists epapers_public_read on storage.objects;
drop policy if exists epapers_staff_write on storage.objects;

create policy epapers_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'epapers');

create policy epapers_staff_write on storage.objects for all to authenticated
  using (bucket_id = 'epapers' and public.get_my_role() in ('admin', 'super_admin'))
  with check (bucket_id = 'epapers' and public.get_my_role() in ('admin', 'super_admin'));
