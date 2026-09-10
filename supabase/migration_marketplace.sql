-- Optional marketplace label on reviews (Warrior+Plus, JVZoo, Launchpad, ClickBank, or custom)
alter table public.posts
  add column if not exists marketplace text not null default '';
