-- Add every Indian state and union territory to the existing state category.
insert into public.sub_categories (category_id, name_hi, slug, order_index)
select c.id, s.name_hi, s.slug, s.order_index
from public.categories c
join (values
  ('उत्तर प्रदेश', 'uttar-pradesh', 1),
  ('दिल्ली', 'delhi', 2),
  ('मध्य प्रदेश', 'madhya-pradesh', 3),
  ('बिहार', 'bihar', 4),
  ('राजस्थान', 'rajasthan', 5),
  ('हरियाणा', 'haryana', 6),
  ('छत्तीसगढ़', 'chhattisgarh', 7),
  ('झारखंड', 'jharkhand', 8),
  ('उत्तराखंड', 'uttarakhand', 9),
  ('हिमाचल प्रदेश', 'himachal-pradesh', 10) 

) as s(name_hi, slug, order_index) on true
where c.slug = 'rajya'
on conflict (slug) do update set
  category_id = excluded.category_id,
  name_hi = excluded.name_hi,
  order_index = excluded.order_index,
  is_active = true;
