-- =====================================================================
-- Dainik Patrika (दैनिक पत्रिका) — Supabase migration
-- Supabase Dashboard > SQL Editor में पूरा स्क्रिप्ट चलाएँ।
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('super_admin', 'admin', 'author', 'public_visitor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.article_status as enum ('draft', 'pending', 'published', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ad_slot_type as enum ('header', 'sidebar_sticky', 'in_article', 'footer');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,                                   -- सिर्फ़ own/staff देख सकते हैं (RLS)
  role         public.user_role not null default 'public_visitor',
  display_name text not null default '',
  bio          text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name_hi     text not null,
  slug        text not null unique,
  order_index int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.sub_categories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name_hi     text not null,
  slug        text not null unique,
  order_index int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.articles (
  id               uuid primary key default gen_random_uuid(),
  title_hi         text not null,
  slug             text not null unique,
  content_hi       jsonb not null default '{"type":"doc","blocks":[]}'::jsonb,  -- Rich JSON
  excerpt_hi       text not null default '',
  featured_image   text,
  status           public.article_status not null default 'draft',
  author_id        uuid references public.profiles(id) on delete set null,
  author_name      text,                                -- बाइलाइन (trigger से भरता है)
  category_id      uuid references public.categories(id) on delete set null,
  sub_category_id  uuid references public.sub_categories(id) on delete set null,
  views            bigint not null default 0,
  rejection_note   text,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  is_blog          boolean not null default false
);
alter table public.articles add column if not exists is_blog boolean not null default false;
create index if not exists articles_status_pub_idx on public.articles (status, published_at desc);
create index if not exists articles_category_idx   on public.articles (category_id);
create index if not exists articles_author_idx     on public.articles (author_id);
create index if not exists articles_views_idx      on public.articles (views desc);

-- सिंगल-रो key-value स्टोर
create table if not exists public.site_settings (
  id           int primary key default 1 check (id = 1),
  site_name    text not null default 'दैनिक पत्रिका',
  logo_url     text,
  favicon_url  text,
  theme        jsonb not null default '{"accent":"#e2231a","ink":"#111827"}'::jsonb,
  seo          jsonb not null default '{}'::jsonb,       -- title, description, keywords, og_image
  header_nav   jsonb not null default '[]'::jsonb,       -- [{label, href}]
  footer_nav   jsonb not null default '[]'::jsonb,
  static_pages jsonb not null default '[]'::jsonb,       -- [{slug, title, body}]
  updated_at   timestamptz not null default now()
);

create table if not exists public.ad_settings (
  id           uuid primary key default gen_random_uuid(),
  slot_key     text not null unique,
  slot_type    public.ad_slot_type not null,
  ad_code      text not null default '',
  is_enabled   boolean not null default false,
  publisher_id text,
  updated_at   timestamptz not null default now(),
  constraint publisher_id_format check (publisher_id is null or publisher_id = '' or publisher_id ~ '^ca-pub-[0-9]{16}$')
);

create table if not exists public.portfolio_projects (       -- "हमारे कार्य"
  id                  uuid primary key default gen_random_uuid(),
  client_name         text not null,
  project_type        text not null,
  thumbnail_url       text,
  live_url            text,
  description_hi      text not null default '',
  case_study_markdown text not null default '',
  order_index         int not null default 0,
  created_at          timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. HELPER FUNCTIONS (RLS में recursion से बचने के लिए SECURITY DEFINER)
-- ---------------------------------------------------------------------
create or replace function public.get_my_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.get_my_role() = 'super_admin', false)
$$;

create or replace function public.is_staff()      -- admin या super_admin
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.get_my_role() in ('admin', 'super_admin'), false)
$$;

create or replace function public.is_author()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.get_my_role() = 'author', false)
$$;

create or replace function public.can_write_blog()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.get_my_role() in ('public_visitor','author','admin','super_admin'), false)
$$;

-- ---------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------
-- 4a. नया यूज़र -> profile (डिफ़ॉल्ट role: public_visitor)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role, display_name, avatar_url)
  values (
    new.id,
    new.email,
    'public_visitor',
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4b. भूमिका बदलने की सुरक्षा: admin, super_admin/admin भूमिकाएँ नहीं दे सकता
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
declare me public.user_role;
begin
  if new.role is distinct from old.role then
    if auth.uid() is null then return new; end if;     -- SQL editor / service_role
    me := public.get_my_role();
    if me = 'super_admin' then return new; end if;
    if me = 'admin'
       and old.role in ('public_visitor', 'author')
       and new.role in ('public_visitor', 'author') then
      return new;
    end if;
    raise exception 'आपको यह भूमिका बदलने की अनुमति नहीं है';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_role_trg on public.profiles;
create trigger guard_profile_role_trg
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- 4c. updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','articles','site_settings','ad_settings'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- 4d. लेख: बाइलाइन + published_at + लेखक की सीमाएँ
create or replace function public.articles_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.author_id is not null then
    select display_name into new.author_name from public.profiles where id = new.author_id;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  if new.status <> 'rejected' and tg_op = 'UPDATE' and old.status = 'rejected' then
    new.rejection_note := null;
  end if;
  return new;
end $$;

drop trigger if exists articles_before_write_trg on public.articles;
create trigger articles_before_write_trg
  before insert or update on public.articles
  for each row execute function public.articles_before_write();

-- 4e. व्यूज़ गिनने का RPC (anon भी कॉल कर सकता है, सिर्फ़ published लेखों पर)
create or replace function public.increment_article_views(p_slug text)
returns void language sql security definer set search_path = public as $$
  update public.articles set views = views + 1 where slug = p_slug and status = 'published'
$$;
grant execute on function public.increment_article_views(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.sub_categories         enable row level security;
alter table public.articles               enable row level security;
alter table public.site_settings          enable row level security;
alter table public.ad_settings            enable row level security;
alter table public.portfolio_projects     enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- 5a. SUPER ADMIN — सभी टेबल पर पूर्ण अधिकार
do $$ declare t text; begin
  foreach t in array array['profiles','categories','sub_categories','articles','site_settings','ad_settings','portfolio_projects','newsletter_subscribers'] loop
    execute format('drop policy if exists "%1$s_super_all" on public.%1$s', t);
    execute format('create policy "%1$s_super_all" on public.%1$s for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin())', t);
  end loop;
end $$;

-- 5b. PROFILES
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_select_staff on public.profiles;
drop policy if exists profiles_update_own   on public.profiles;
drop policy if exists profiles_update_staff on public.profiles;
create policy profiles_select_own   on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_select_staff on public.profiles for select to authenticated using (public.is_staff());
create policy profiles_update_own   on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Admin अन्य यूज़र की प्रोफ़ाइल/भूमिका बदल सकता है; सीमा guard_profile_role ट्रिगर लगाता है
create policy profiles_update_staff on public.profiles for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- 5c. CATEGORIES / SUB-CATEGORIES
drop policy if exists categories_public_read       on public.categories;
drop policy if exists categories_staff_all         on public.categories;
drop policy if exists sub_categories_public_read   on public.sub_categories;
drop policy if exists sub_categories_staff_all     on public.sub_categories;
create policy categories_public_read     on public.categories     for select to anon, authenticated using (is_active);
create policy categories_staff_all       on public.categories     for all    to authenticated using (public.is_staff()) with check (public.is_staff());
create policy sub_categories_public_read on public.sub_categories for select to anon, authenticated using (is_active);
create policy sub_categories_staff_all   on public.sub_categories for all    to authenticated using (public.is_staff()) with check (public.is_staff());

-- 5d. ARTICLES
drop policy if exists articles_public_read   on public.articles;
drop policy if exists articles_staff_all     on public.articles;
drop policy if exists articles_author_select on public.articles;
drop policy if exists articles_author_insert on public.articles;
drop policy if exists articles_author_update on public.articles;
drop policy if exists articles_author_delete on public.articles;
drop policy if exists articles_author_blog_insert on public.articles;
drop policy if exists articles_blog_owner_update on public.articles;
drop policy if exists articles_blog_owner_delete on public.articles;
drop policy if exists blogs_public_read on public.articles;
create policy articles_public_read on public.articles for select to anon, authenticated
  using (status = 'published' and is_blog = false and (published_at is null or published_at <= now()));
create policy articles_staff_all on public.articles for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
-- Author: अपने लेख हर स्थिति में पढ़ सकता है (rejection feedback देखने के लिए)
create policy articles_author_select on public.articles for select to authenticated
  using (author_id = auth.uid());
-- Author: सिर्फ़ draft/pending बना सकता है
create policy articles_author_insert on public.articles for insert to authenticated
  with check (public.is_author() and author_id = auth.uid() and status in ('draft', 'pending') and is_blog = false);
create policy articles_author_blog_insert on public.articles for insert to authenticated
  with check (public.can_write_blog() and author_id = auth.uid() and status in ('draft', 'pending') and is_blog = true);
-- Staff authors may edit news; all signed-in users may edit only their own community blogs.
create policy articles_author_update on public.articles for update to authenticated
  using (public.is_author() and author_id = auth.uid() and is_blog = false and status in ('draft', 'pending', 'rejected'))
  with check (author_id = auth.uid() and is_blog = false and status in ('draft', 'pending'));
create policy articles_blog_owner_update on public.articles for update to authenticated
  using (public.can_write_blog() and author_id = auth.uid() and is_blog = true and status in ('draft', 'pending', 'rejected'))
  with check (author_id = auth.uid() and is_blog = true and status in ('draft', 'pending'));
create policy articles_author_delete on public.articles for delete to authenticated
  using (public.is_author() and author_id = auth.uid() and is_blog = false and status in ('draft', 'pending'));
create policy articles_blog_owner_delete on public.articles for delete to authenticated
  using (public.can_write_blog() and author_id = auth.uid() and is_blog = true and status in ('draft', 'pending'));

-- 5e. SITE SETTINGS — सब पढ़ सकते हैं; सिर्फ़ super_admin बदल सकता है (admin = read-only)
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);

-- 5f. AD SETTINGS — visitor सिर्फ़ enabled; admin सभी पढ़ सकता है (read-only)
drop policy if exists ad_settings_public_read on public.ad_settings;
drop policy if exists ad_settings_staff_read  on public.ad_settings;
create policy ad_settings_public_read on public.ad_settings for select to anon, authenticated using (is_enabled);
create policy ad_settings_staff_read  on public.ad_settings for select to authenticated using (public.is_staff());

-- 5g. PORTFOLIO
drop policy if exists portfolio_public_read on public.portfolio_projects;
drop policy if exists portfolio_staff_all   on public.portfolio_projects;
create policy portfolio_public_read on public.portfolio_projects for select to anon, authenticated using (true);
create policy portfolio_staff_all   on public.portfolio_projects for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- 5h. NEWSLETTER
drop policy if exists newsletter_insert_any  on public.newsletter_subscribers;
drop policy if exists newsletter_staff_read  on public.newsletter_subscribers;
create policy newsletter_insert_any on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy newsletter_staff_read on public.newsletter_subscribers for select to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------
-- 6. STORAGE (Supabase Storage buckets + नीतियाँ)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('article-images', 'article-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('branding', 'branding', true)             on conflict (id) do nothing;

drop policy if exists "images_public_read"   on storage.objects;
drop policy if exists "images_staff_author_write" on storage.objects;
drop policy if exists "branding_super_write" on storage.objects;
create policy "images_public_read" on storage.objects for select to anon, authenticated
  using (bucket_id in ('article-images', 'branding'));
create policy "images_staff_author_write" on storage.objects for all to authenticated
  using (bucket_id = 'article-images' and public.get_my_role() in ('author', 'admin', 'super_admin'))
  with check (bucket_id = 'article-images' and public.get_my_role() in ('author', 'admin', 'super_admin'));
create policy "branding_super_write" on storage.objects for all to authenticated
  using (bucket_id = 'branding' and public.is_super_admin())
  with check (bucket_id = 'branding' and public.is_super_admin());

-- =====================================================================
-- 7. SEED DATA (डेमो हिंदी सामग्री)
-- =====================================================================
insert into public.categories (name_hi, slug, order_index) values
  ('देश', 'desh', 1), ('दुनिया', 'duniya', 2), ('राज्य', 'rajya', 3), ('खेल', 'khel', 4),
  ('मनोरंजन', 'manoranjan', 5), ('बिजनेस', 'business', 6), ('टेक्नोलॉजी', 'technology', 7),
  ('ऑटो', 'auto', 8), ('लाइफस्टाइल', 'lifestyle', 9), ('धर्म', 'dharm', 10)
on conflict (slug) do nothing;

insert into public.sub_categories (category_id, name_hi, slug, order_index)
select c.id, s.name_hi, s.slug, s.ord
from (values
  ('desh','राजनीति','rajniti',1), ('desh','समाज','samaj',2),
  ('khel','क्रिकेट','cricket',1), ('khel','फुटबॉल','football',2), ('khel','हॉकी','hockey',3), ('khel','एथलेटिक्स','athletics',4),
  ('manoranjan','बॉलीवुड','bollywood',1), ('manoranjan','टीवी','tv',2), ('manoranjan','ओटीटी','ott',3),
  ('business','शेयर बाज़ार','share-bazaar',1), ('business','अर्थव्यवस्था','arthvyavastha',2),
  ('technology','गैजेट्स','gadgets',1), ('technology','एआई','ai',2),
  ('rajya','उत्तर प्रदेश','uttar-pradesh',1), ('rajya','दिल्ली','delhi',2)
) as s(cat, name_hi, slug, ord)
join public.categories c on c.slug = s.cat
on conflict (slug) do nothing;

insert into public.site_settings (id, site_name, theme, seo, header_nav, footer_nav, static_pages)
values (
  1, 'दैनिक पत्रिका',
  '{"accent":"#e2231a","ink":"#111827"}',
  '{"title":"दैनिक पत्रिका | ताज़ा ख़बरें, ब्रेकिंग न्यूज़ हिंदी में","description":"देश, दुनिया, खेल, मनोरंजन और बिजनेस की हर बड़ी ख़बर — सबसे पहले, सबसे सटीक, हिंदी में।","keywords":"हिंदी समाचार, ताज़ा ख़बर, ब्रेकिंग न्यूज़, दैनिक पत्रिका","og_image":""}',
  '[{"label":"होम","href":"/"},{"label":"हमारे कार्य","href":"/hamare-karya"}]',
  '[{"label":"हमारे बारे में","href":"/page/about"},{"label":"गोपनीयता नीति","href":"/page/privacy"},{"label":"संपर्क करें","href":"/page/contact"},{"label":"विज्ञापन दें","href":"/page/advertise"}]',
  '[{"slug":"about","title":"हमारे बारे में","body":"दैनिक पत्रिका एक स्वतंत्र हिंदी डिजिटल समाचार मंच है।"}]'
) on conflict (id) do nothing;

insert into public.ad_settings (slot_key, slot_type, is_enabled, publisher_id, ad_code) values
  ('header-leaderboard', 'header',         true,  '', ''),
  ('sidebar-sticky',     'sidebar_sticky', true,  '', ''),
  ('in-article-1',       'in_article',     true,  '', ''),
  ('footer-banner',      'footer',         false, '', '')
on conflict (slot_key) do nothing;

insert into public.portfolio_projects (client_name, project_type, thumbnail_url, live_url, description_hi, case_study_markdown, order_index) values
  ('भारत भ्रमण ट्रैवल्स', 'ट्रैवल पोर्टल', 'https://picsum.photos/seed/travel/800/500', 'https://example.com',
   'पर्यटन कंपनी के लिए बुकिंग-रेडी हिंदी वेबसाइट।', E'## चुनौती\n\nकंपनी की साइट मोबाइल पर धीमी थी।\n\n## समाधान\n\nNext.js आधारित नया फ्रंटएंड और Supabase बैकएंड।\n\n- लोड समय 70% कम\n- बुकिंग में 2.1 गुना बढ़ोतरी', 1),
  ('शिक्षा सेतु', 'एड-टेक प्लेटफ़ॉर्म', 'https://picsum.photos/seed/edu/800/500', 'https://example.com',
   'ग्रामीण छात्रों के लिए हिंदी माध्यम ऑनलाइन कक्षाएँ।', E'## लक्ष्य\n\nहिंदी माध्यम के छात्रों को सरल डिजिटल कक्षाएँ देना।\n\n> पहले तीन महीनों में 40,000 से अधिक पंजीकरण।', 2),
  ('स्वाद घर', 'रेस्टोरेंट ब्रांडिंग', 'https://picsum.photos/seed/food/800/500', 'https://example.com',
   'रेस्टोरेंट चेन के लिए ब्रांड पहचान और ऑनलाइन ऑर्डरिंग।', E'## परिणाम\n\nऑनलाइन ऑर्डर कुल बिक्री का 35% बने।', 3)
on conflict do nothing;

insert into public.articles (title_hi, slug, content_hi, excerpt_hi, featured_image, status, category_id, published_at, views)
select v.title, v.slug,
  jsonb_build_object('type', 'doc', 'blocks', jsonb_build_array(
    jsonb_build_object('type', 'p',     'text', v.lead),
    jsonb_build_object('type', 'p',     'text', v.p2),
    jsonb_build_object('type', 'h2',    'text', 'पूरा मामला'),
    jsonb_build_object('type', 'p',     'text', 'यह डेमो सामग्री है, जिसे पोर्टल का डिज़ाइन और कार्यक्षमता दिखाने के लिए तैयार किया गया है। असली प्रकाशन में यहाँ संवाददाता की रिपोर्ट दिखाई देगी।'),
    jsonb_build_object('type', 'quote', 'text', 'ख़बर वही, जो सच के साथ सबसे पहले आप तक पहुँचे।'),
    jsonb_build_object('type', 'p',     'text', 'ताज़ा अपडेट के लिए दैनिक पत्रिका से जुड़े रहें।')
  )),
  v.excerpt, 'https://picsum.photos/seed/' || v.slug || '/1200/675', 'published', c.id,
  now() - (v.hrs * interval '1 hour'), v.views
from (values
  ('राजधानी में नई मेट्रो लाइन का उद्घाटन, रोज़ाना 5 लाख यात्रियों को मिलेगी राहत', 'new-metro-line-inauguration', 'desh',
   'राजधानी में नई मेट्रो लाइन आज यात्रियों के लिए खोल दी गई। शुरुआती दिनों में रियायती किराया लागू रहेगा।',
   'अधिकारियों के मुताबिक नई लाइन शहर के पूर्वी और पश्चिमी इलाक़ों को सीधे जोड़ेगी और सड़कों का दबाव कम करेगी।',
   'नई मेट्रो लाइन से सफ़र का समय आधे से भी कम होगा।', 1, 98400),
  ('संसद के शीतकालीन सत्र की तारीख़ तय, कई अहम विधेयकों पर रहेगी नज़र', 'winter-session-dates', 'desh',
   'शीतकालीन सत्र की तारीख़ें घोषित हो गई हैं और सत्र में कई महत्वपूर्ण विधेयक पेश किए जाने की संभावना है।',
   'सर्वदलीय बैठक में सत्र सुचारु रूप से चलाने पर चर्चा होगी।',
   'सत्र में कई अहम विधेयकों पर चर्चा संभव।', 3, 41200),
  ('वैश्विक जलवायु सम्मेलन में कार्बन उत्सर्जन घटाने पर बनी नई सहमति', 'global-climate-summit-agreement', 'duniya',
   'जलवायु सम्मेलन में कई देशों ने उत्सर्जन घटाने के नए लक्ष्यों पर सहमति जताई।',
   'विशेषज्ञों ने इसे सही दिशा में कदम बताया, पर क्रियान्वयन पर सवाल बने हुए हैं।',
   'कई देशों ने उत्सर्जन घटाने के नए लक्ष्य तय किए।', 5, 30500),
  ('रोमांचक मुक़ाबले में भारत ने जीता फाइनल, आख़िरी ओवर तक चली साँसें थमी', 'india-wins-final', 'khel',
   'फाइनल मुक़ाबला आख़िरी ओवर तक खिंचा और भारतीय टीम ने शानदार जीत दर्ज की।',
   'कप्तान ने जीत का श्रेय पूरी टीम की मेहनत को दिया।',
   'आख़िरी ओवर तक चले मुक़ाबले में भारतीय टीम विजयी।', 2, 152000),
  ('इस हफ़्ते की सबसे चर्चित फ़िल्म ने पहले दिन किया रिकॉर्ड कारोबार', 'film-box-office-day-one', 'manoranjan',
   'रिलीज़ के पहले ही दिन फ़िल्म ने बॉक्स ऑफ़िस पर शानदार शुरुआत की।',
   'समीक्षकों और दर्शकों दोनों की प्रतिक्रियाएँ सकारात्मक रही हैं।',
   'पहले दिन की कमाई ने बनाया नया रिकॉर्ड।', 4, 87300),
  ('सेंसेक्स-निफ्टी में तेज़ी, निवेशकों की संपत्ति में बड़ा उछाल', 'markets-rally', 'business',
   'शेयर बाज़ार में आज ज़बरदस्त तेज़ी दिखी और प्रमुख सूचकांक बढ़त के साथ बंद हुए।',
   'बैंकिंग और आईटी शेयरों में सबसे ज़्यादा ख़रीदारी देखी गई।',
   'बाज़ार में तेज़ी से निवेशकों की संपत्ति बढ़ी।', 6, 64100),
  ('AI से बदल रही है पढ़ाई, स्कूलों में शुरू हुए स्मार्ट क्लासरूम', 'ai-smart-classrooms', 'technology',
   'कई स्कूलों ने एआई आधारित स्मार्ट क्लासरूम शुरू किए हैं, जहाँ हर बच्चे की गति के अनुसार पढ़ाई होती है।',
   'शिक्षकों का कहना है कि इससे कमज़ोर विषयों पर काम करना आसान हुआ है।',
   'एआई से हर बच्चे को मिल रही अपनी गति से पढ़ाई।', 7, 22800),
  ('सर्दियों में सेहत का ख़्याल: आसान तरीके जो बढ़ाएँगे आपकी इम्युनिटी', 'winter-health-tips', 'lifestyle',
   'सर्दियों में संतुलित खान-पान, पर्याप्त नींद और हल्की कसरत सेहत के लिए ज़रूरी है।',
   'यह सामान्य जानकारी है, किसी भी समस्या में डॉक्टर से सलाह लें।',
   'संतुलित आहार और नींद से बनी रहेगी सेहत।', 9, 18900)
) as v(title, slug, cat, lead, p2, excerpt, hrs, views)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- =====================================================================
-- पहले Super Admin को बनाने के लिए: साइन-अप के बाद यह चलाएँ (ईमेल बदलें)
--   update public.profiles set role = 'super_admin' where email = 'you@example.com';
-- =====================================================================


-- =====================================================================
-- 8. COMMUNITY BLOGS
-- Ordinary registered users can create blog posts. Admin/staff approval is required.
-- Blogs reuse the articles table so the existing editor, image storage and moderation flow stay consistent.
-- =====================================================================
create index if not exists articles_blog_status_idx on public.articles (is_blog, status, published_at desc);

-- Public readers can view approved blogs.
drop policy if exists blogs_public_read on public.articles;
create policy blogs_public_read on public.articles for select to anon, authenticated
  using (is_blog = true and status = 'published' and (published_at is null or published_at <= now()));

-- Ensure only staff can publish; the existing staff policy permits approval actions.
