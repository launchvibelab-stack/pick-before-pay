# PickBeforePay — Niche SEO Review CMS

Production site: **https://pickbeforepay.com**

English niche-review site with technical SEO automation and Sinbyte indexing on publish.

## Features
- Public home, niche archives, and post pages
- Admin CMS: niches CRUD, create/edit/delete posts
- Focus keyword, affiliate URL, cover upload
- Auto slug, meta title/description, affiliate CTA, same-niche internal links
- Sitemap, robots.txt, Open Graph, Article JSON-LD
- Sinbyte indexing API on publish

## Local setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL Editor (or `supabase/migration_seo_niches.sql` if upgrading an existing DB).
3. Copy `.env.example` to `.env.local` and fill in values, including `SINBYTE_API_KEY`.
4. Run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`; admin at `/admin`.

## Env vars
- `NEXT_PUBLIC_SITE_URL` — `https://pickbeforepay.com` (canonical URL for sitemap + Sinbyte)
- `SUPABASE_URL` / `SUPABASE_SECRET_KEY`
- `ADMIN_PASSWORD` / `AUTH_SECRET`
- `SINBYTE_API_KEY` — from Sinbyte Quick Submit (indexes via `POST https://app.sinbyte.com/api/indexing/`)

## Deploy (Vercel)
1. Push to GitHub and import in Vercel.
2. Add the env vars above.
3. Deploy.

## Security
- Never expose `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD`, `AUTH_SECRET`, or `SINBYTE_API_KEY` as `NEXT_PUBLIC_*`.
