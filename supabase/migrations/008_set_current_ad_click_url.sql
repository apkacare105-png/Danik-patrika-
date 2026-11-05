-- One-time URL for the banner currently shown in all ad placements.
-- Future ad and link changes remain editable per slot by the super admin.
update public.ad_settings
set click_url = 'https://share.google/oj7xwYLKHooG2sLNI'
where click_url is null or click_url = '';
