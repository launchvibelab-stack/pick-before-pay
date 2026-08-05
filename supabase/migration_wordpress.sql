-- WordPress.com satellite post tracking (run in Supabase SQL editor)
alter table public.posts
  add column if not exists wordpress_posted_at timestamptz;

alter table public.posts
  add column if not exists wordpress_post_url text;
