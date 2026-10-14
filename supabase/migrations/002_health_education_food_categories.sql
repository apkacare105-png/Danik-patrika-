-- Dainik Patrika: additional editorial categories
-- Safe to run after 001_daily_insights.sql; inserts are idempotent.

insert into public.categories (name_hi, slug, order_index) values
  ('स्वास्थ्य', 'health', 11),
  ('शिक्षा', 'education', 12),
  ('खाना', 'food', 13)
on conflict (slug) do update set
  name_hi = excluded.name_hi,
  order_index = excluded.order_index,
  is_active = true;

insert into public.sub_categories (category_id, name_hi, slug, order_index)
select c.id, s.name_hi, s.slug, s.order_index
from public.categories c
join (values
  ('health', 'वेलनेस', 'wellness', 1),
  ('health', 'मेडिकल', 'medical', 2),
  ('education', 'स्कूल', 'school', 1),
  ('education', 'करियर', 'career', 2),
  ('food', 'रेसिपी', 'recipes', 1),
  ('food', 'फूड न्यूज़', 'food-news', 2)
) as s(category_slug, name_hi, slug, order_index) on s.category_slug = c.slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  name_hi = excluded.name_hi,
  order_index = excluded.order_index,
  is_active = true;
