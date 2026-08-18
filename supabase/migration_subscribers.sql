-- Email drip subscribers (Resend). Run in Supabase SQL editor.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  unsubscribe_token text not null unique,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  drip_step integer not null default 0,
  last_drip_at timestamptz,
  created_at timestamptz not null default now(),
  constraint subscribers_drip_step_range check (drip_step >= 0 and drip_step <= 5)
);

create index if not exists subscribers_active_drip_idx
  on public.subscribers (drip_step, subscribed_at)
  where unsubscribed_at is null;

alter table public.subscribers enable row level security;
-- No public policies: service role only (admin client).
