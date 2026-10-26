update public.categories
set name_hi = 'नौकरी',
    slug = 'naukri',
    order_index = 8
where slug = 'auto'
  and not exists (
    select 1
    from public.categories
    where slug = 'naukri'
  );

update public.categories
set name_hi = 'नौकरी',
    order_index = 8
where slug = 'naukri'; 
