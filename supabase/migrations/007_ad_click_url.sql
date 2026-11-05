alter table public.ad_settings
  add column if not exists click_url text;

alter table public.ad_settings
  drop constraint if exists ad_settings_click_url_format;

alter table public.ad_settings
  add constraint ad_settings_click_url_format
  check (click_url is null or click_url = '' or click_url ~* '^https?://[^[:space:]]+$');
