-- First-publish subscriber email tracking (run in Supabase SQL editor)
alter table public.posts
  add column if not exists newsletter_sent_at timestamptz;
