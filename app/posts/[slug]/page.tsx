import { Header } from "@/components/Header";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackPageview } from "@/components/TrackPageview";
import { extractFaqs } from "@/lib/content";
import { getPostBySlug } from "@/lib/posts";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt;
  const url = `${siteUrl()}/posts/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: post.cover_url ? [{ url: post.cover_url }] : undefined
    },
    twitter: {
      card: post.cover_url ? "summary_large_image" : "summary",
      title,
      description,
      images: post.cover_url ? [post.cover_url] : undefined
    }
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const url = `${siteUrl()}/posts/${post.slug}`;
  const faqs = extractFaqs(post.content);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.cover_url ? [post.cover_url] : undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.focus_keyword || undefined,
    articleSection: post.category || undefined
  };
  const faqLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer }
          }))
        }
      : null;

  return (
    <>
      <TrackPageview path={`/posts/${post.slug}`} postId={post.id} />
      <Header />
      <main className="container article-wrap">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
        {faqLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
        )}
        <div className="article-meta">
          <span className="category-pill">{post.category}</span>
          <span>{new Date(post.created_at).toLocaleDateString("en-US")}</span>
          {post.focus_keyword && <span>Keyword: {post.focus_keyword}</span>}
        </div>
        <h1>{post.title}</h1>
        <p className="article-excerpt">{post.excerpt}</p>
        {post.cover_url && <img className="article-cover" src={post.cover_url} alt={post.title} />}
        <article>
          <MarkdownContent content={post.content} affiliateUrl={post.affiliate_url} postId={post.id} />
        </article>
        {post.affiliate_url && (
          <div className="sticky-cta">
            <a
              href={`/api/go/${post.id}`}
              className="cta-btn cta-btn-lg"
              rel="nofollow sponsored noopener"
              target="_blank"
            >
              Get started — exclusive bonuses via our link
            </a>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
