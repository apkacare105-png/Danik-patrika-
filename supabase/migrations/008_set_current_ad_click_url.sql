-- One-time URL for the banner currently shown in all ad placements.
-- Future ad and link changes remain editable per slot by the super admin.
-- Safe to run repeatedly if the column/table already exists.
do $$
begin
  if to_regclass('public.ad_settings') is not null then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'ad_settings'
        and column_name = 'click_url'
    ) then
      update public.ad_settings
      set click_url = 'https://share.google/oj7xwYLKHooG2sLNI'
      where click_url is null or click_url = '';
    end if;
  end if;
end $$;
