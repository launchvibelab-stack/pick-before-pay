-- Button label on /launch email form (e.g. Get My 20% Launch Code)
alter table public.launches
  add column if not exists cta_label text not null default '';
