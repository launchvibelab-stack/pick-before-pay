-- Optional review link + countdown label for homepage promo banner
alter table public.banners
  add column if not exists review_url text,
  add column if not exists countdown_label text not null default 'ends_in';

update public.banners
set countdown_label = 'ends_in'
where countdown_label not in ('ends_in', 'launches_in', 'offer_ends');
