import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { SiteFooter } from "@/components/SiteFooter";
import { getNicheBySlug } from "@/lib/niches";
import { getPublishedPosts } from "@/lib/posts";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const niche = await getNicheBySlug(slug);
  if (!niche) return { title: "Niche not found" };
  const url = `${siteUrl()}/niche/${niche.slug}`;
  const description = niche.description || `Reviews in the ${niche.name} niche.`;
  return {
    title: `${niche.name} reviews`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${niche.name} reviews`,
      description,
      url,
      type: "website",
      siteName: "PickBeforePay",
      images: [{ url: "/logo.png" }]
    },
    twitter: {
      card: "summary",
      title: `${niche.name} reviews`,
      description,
      images: ["/logo.png"]
    }
  };
}

export default async function NichePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const niche = await getNicheBySlug(slug);
  if (!niche) notFound();
  const posts = await getPublishedPosts(niche.id);

  return (
    <>
      <Header />
      <main className="container section" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <span className="eyebrow">Niche</span>
          <h1>{niche.name}</h1>
          {niche.description && (
            <p style={{ color: "var(--muted)", maxWidth: 640, marginTop: 12, lineHeight: 1.6 }}>
              {niche.description}
            </p>
          )}
        </div>
        {posts.length > 0 ? (
          <div className="post-grid">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <div className="empty">No published reviews in this niche yet.</div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
