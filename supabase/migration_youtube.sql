-- Optional YouTube video on a review (run in Supabase SQL editor)
alter table public.posts
  add column if not exists youtube_url text;
