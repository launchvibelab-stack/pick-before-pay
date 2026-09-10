-- Optional custom CTA button text for homepage promo banner
alter table public.banners
  add column if not exists cta_label text not null default '';
