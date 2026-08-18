-- Editor review score for visible rating + Review schema (run in Supabase SQL editor)
alter table public.posts
  add column if not exists editor_score numeric(2,1);

alter table public.posts
  drop constraint if exists posts_editor_score_range;

alter table public.posts
  add constraint posts_editor_score_range
  check (editor_score is null or (editor_score >= 1 and editor_score <= 5));
