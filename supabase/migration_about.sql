-- Optional SQL mirror for about profile (app primarily stores JSON in Storage bucket site-config/about.json).

create table if not exists public.about_profile (
  id integer primary key default 1 check (id = 1),
  name text not null default '',
  headline text not null default '',
  bio text not null default '',
  avatar_url text,
  facebook_url text not null default '',
  pinterest_url text not null default '',
  telegram_url text not null default '',
  linkedin_url text not null default '',
  youtube_url text not null default '',
  products jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.about_profile add column if not exists linkedin_url text not null default '';
alter table public.about_profile add column if not exists youtube_url text not null default '';

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
