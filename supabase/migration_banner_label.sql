-- Add label variant for homepage promo banner
alter table public.banners
  add column if not exists label_variant text not null default 'exclusive_readers';

-- Normalize existing / invalid rows to allowed values
update public.banners
set label_variant = 'exclusive_readers'
where label_variant not in ('featured_launch', 'partner_spotlight', 'exclusive_readers');
