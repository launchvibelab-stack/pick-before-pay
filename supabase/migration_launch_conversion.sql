-- Prelaunch conversion fields: outcome headline, CTA note, proof block
alter table public.launches
  add column if not exists headline text not null default '',
  add column if not exists cta_note text not null default '',
  add column if not exists proof_md text not null default '';
