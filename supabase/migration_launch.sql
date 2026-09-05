-- Prelaunch /launch page config (separate from homepage promo banner)
create table if not exists public.launches (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  product_name text not null default '',
  headline text not null default '',
  description text not null default '',
  cta_note text not null default '',
  cta_label text not null default '',
  body_md text not null default '',
  proof_md text not null default '',
  image_url text,
  expires_at timestamptz,
  discount_code text,
  cta_url text,
  review_url text,
  label_variant text not null default 'early_access',
  countdown_label text not null default 'ends_in',
  updated_at timestamptz not null default now()
);

insert into public.launches (id) values (1) on conflict (id) do nothing;

alter table public.launches enable row level security;

drop policy if exists "Public can read launch" on public.launches;
create policy "Public can read launch"
  on public.launches for select
  to anon
  using (true);
