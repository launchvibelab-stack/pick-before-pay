create extension if not exists pgcrypto;

create table if not exists public.niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  category text not null default '',
  niche_id uuid references public.niches(id) on delete set null,
  focus_keyword text not null default '',
  affiliate_url text,
  meta_title text not null default '',
  meta_description text not null default '',
  cover_url text,
  published boolean not null default false,
  indexed_at timestamptz,
  index_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.niches enable row level security;
alter table public.posts enable row level security;

drop policy if exists "Public can read niches" on public.niches;
create policy "Public can read niches"
on public.niches for select
to anon
using (true);

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
on public.posts for select
to anon
using (published = true);

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

-- Analytics (also in migration_analytics.sql)
create table if not exists public.analytics_daily (
  day date not null,
  path text not null,
  post_id uuid references public.posts(id) on delete cascade,
  pageviews integer not null default 0,
  affiliate_clicks integer not null default 0,
  primary key (day, path)
);

create index if not exists analytics_daily_day_idx on public.analytics_daily (day);
create index if not exists analytics_daily_post_idx on public.analytics_daily (post_id);

alter table public.analytics_daily enable row level security;

-- About profile (also in migration_about.sql)
create table if not exists public.about_profile (
  id integer primary key default 1 check (id = 1),
  name text not null default '',
  headline text not null default '',
  bio text not null default '',
  avatar_url text,
  facebook_url text not null default '',
  pinterest_url text not null default '',
  telegram_url text not null default '',
  products jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.about_profile (id, name, headline, bio)
values (
  1,
  'PickBeforePay',
  'Honest product reviews before you buy',
  'I research niche digital products and share clear, practical reviews so you can decide with confidence.'
)
on conflict (id) do nothing;

alter table public.about_profile enable row level security;

drop policy if exists "Public can read about profile" on public.about_profile;
create policy "Public can read about profile"
on public.about_profile for select
to anon
using (true);

