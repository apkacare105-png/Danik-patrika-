create table if not exists public.user_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category    text not null default 'general' check (category in ('general', 'bug', 'suggestion', 'content', 'other')),
  rating      smallint check (rating between 1 and 5),
  message     text not null check (char_length(message) between 5 and 2000),
  status      text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists user_feedback_user_idx on public.user_feedback (user_id, created_at desc);
create index if not exists user_feedback_status_idx on public.user_feedback (status, created_at desc);

alter table public.user_feedback enable row level security;

drop policy if exists user_feedback_own_select on public.user_feedback;
drop policy if exists user_feedback_own_insert on public.user_feedback;
drop policy if exists user_feedback_staff_all on public.user_feedback;

-- यूज़र अपना फ़ीडबैक देख और भेज सकता है (नया फ़ीडबैक हमेशा status = 'new')
create policy user_feedback_own_select on public.user_feedback
  for select to authenticated using (user_id = auth.uid());

create policy user_feedback_own_insert on public.user_feedback
  for insert to authenticated with check (user_id = auth.uid() and status = 'new');

create policy user_feedback_staff_all on public.user_feedback
  for all to authenticated
  using (public.get_my_role() in ('admin', 'super_admin'))
  with check (public.get_my_role() in ('admin', 'super_admin'));

drop trigger if exists touch_user_feedback on public.user_feedback;
create trigger touch_user_feedback before update on public.user_feedback
  for each row execute function public.touch_updated_at();
