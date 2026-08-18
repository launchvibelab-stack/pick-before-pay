import { getNiches } from "@/lib/niches";
import { getAllPublishedSlugs } from "@/lib/posts";
import { siteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  let posts: { slug: string; updated_at: string }[] = [];
  let niches: { slug: string }[] = [];

  try {
    [posts, niches] = await Promise.all([getAllPublishedSlugs(), getNiches()]);
  } catch {
    return [{ url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
  }

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...niches.map((n) => ({
      url: `${base}/niche/${n.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...posts.map((p) => ({
      url: `${base}/posts/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
