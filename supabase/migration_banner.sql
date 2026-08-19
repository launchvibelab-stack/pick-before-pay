-- Promo banner for homepage (run in Supabase SQL editor)
create table if not exists public.banners (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  product_name text not null default '',
  description text not null default '',
  image_url text,
  expires_at timestamptz,
  discount_code text,
  cta_url text,
  updated_at timestamptz not null default now()
);

insert into public.banners (id) values (1) on conflict (id) do nothing;

alter table public.banners enable row level security;

drop policy if exists "Public can read banner" on public.banners;
create policy "Public can read banner"
  on public.banners for select
  to anon
  using (true);
