-- Analytics: daily pageviews + affiliate clicks per path/post (retain 90 days).

create table if not exists public.analytics_daily (
  day date not null,
  path text not null,
  post_id uuid references public.posts(id) on delete cascade,
  pageviews integer not null default 0,
  affiliate_clicks integer not null default 0,
  primary key (day, path)
);

create index if not exists analytics_daily_day_idx on public.analytics_daily (day);
create index if not exists analytics_daily_post_idx on public.analytics_daily (post_id);

alter table public.analytics_daily enable row level security;

-- No anon policies: only service role (CMS / tracking API) reads & writes.

create or replace function public.cleanup_analytics_older_than_90_days()
returns integer
language plpgsql
security definer
as $$
declare
  deleted integer;
begin
  delete from public.analytics_daily
  where day < (current_date - interval '90 days');
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;
