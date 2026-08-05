-- Scheduled publishing (run in Supabase SQL editor)
alter table public.posts
  add column if not exists scheduled_at timestamptz;

create index if not exists posts_scheduled_at_idx
  on public.posts (scheduled_at)
  where scheduled_at is not null and published = false;
