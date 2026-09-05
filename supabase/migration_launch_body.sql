-- Long-form prelaunch body for /launch (markdown)
alter table public.launches
  add column if not exists body_md text not null default '';
