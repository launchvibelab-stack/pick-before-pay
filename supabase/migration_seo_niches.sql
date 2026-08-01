-- Run this on an existing ReviewLab database to add niches + SEO fields.

create table if not exists public.niches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.posts add column if not exists niche_id uuid references public.niches(id) on delete set null;
alter table public.posts add column if not exists focus_keyword text not null default '';
alter table public.posts add column if not exists affiliate_url text;
alter table public.posts add column if not exists meta_title text not null default '';
alter table public.posts add column if not exists meta_description text not null default '';
alter table public.posts add column if not exists indexed_at timestamptz;
alter table public.posts add column if not exists index_status text;

alter table public.niches enable row level security;

drop policy if exists "Public can read niches" on public.niches;
create policy "Public can read niches"
on public.niches for select
to anon
using (true);
