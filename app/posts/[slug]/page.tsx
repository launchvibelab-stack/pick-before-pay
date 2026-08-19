import { Header } from "@/components/Header";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackPageview } from "@/components/TrackPageview";
import { StillDecidingWidget } from "@/components/StillDecidingWidget";
import { VerdictBar } from "@/components/VerdictBar";
import { YouTubeLite } from "@/components/YouTubeLite";
import { extractFaqs } from "@/lib/content";
import { injectInlineCtas } from "@/lib/inlineCta";
import { getAllPublishedSlugs, getPostBySlug } from "@/lib/posts";
import { formatEditorScore, scoreStars } from "@/lib/rating";
import { siteUrl } from "@/lib/seo";
import { parseYouTubeRef, youtubeThumbUrl, youtubeWatchUrl } from "@/lib/youtube";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const rows = await getAllPublishedSlugs();
    return rows.slice(0, 100).map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt;
  const url = `${siteUrl()}/posts/${post.slug}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
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
  const score =
    typeof post.editor_score === "number" && post.editor_score >= 1 && post.editor_score <= 5
      ? Number(post.editor_score)
      : null;
  const productName = (post.focus_keyword || post.title).trim();
  const youtube = parseYouTubeRef(post.youtube_url);

  // Extract up to 3 short sentences from excerpt for StillDecidingWidget
  const excerptReasons = post.excerpt
    ? post.excerpt
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20 && s.length < 120)
        .slice(0, 3)
    : [];

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

  // Product + nested editor Review (honest single score). No fake AggregateRating.
  const productReviewLd =
    score != null
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: productName,
          description: post.meta_description || post.excerpt || post.title,
          image: post.cover_url ? [post.cover_url] : undefined,
          url,
          review: {
            "@type": "Review",
            name: post.title,
            url,
            datePublished: post.created_at,
            dateModified: post.updated_at,
            author: {
              "@type": "Organization",
              name: "PickBeforePay",
              url: siteUrl()
            },
            reviewBody: post.excerpt || post.meta_description || post.title,
            reviewRating: {
              "@type": "Rating",
              ratingValue: formatEditorScore(score),
              bestRating: "5",
              worstRating: "1"
            }
          }
        }
      : null;

  const videoLd =
    youtube != null
      ? {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: post.title,
          description: post.meta_description || post.excerpt || post.title,
          thumbnailUrl: [youtubeThumbUrl(youtube.id)],
          uploadDate: post.created_at,
          embedUrl: `https://www.youtube-nocookie.com/embed/${youtube.id}`,
          contentUrl: youtubeWatchUrl(youtube)
        }
      : null;

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
        {productReviewLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productReviewLd) }}
          />
        )}
        {faqLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
        )}
        {videoLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }} />
        )}
        <div className="article-meta">
          <span className="category-pill">{post.category}</span>
          <span>
            {post.updated_at && post.updated_at !== post.created_at
              ? `Updated ${new Date(post.updated_at).toLocaleDateString("en-US")}`
              : new Date(post.created_at).toLocaleDateString("en-US")}
          </span>
          {post.focus_keyword && <span>Keyword: {post.focus_keyword}</span>}
        </div>
        <h1>{post.title}</h1>
        {score != null && (
          <div className="editor-rating" aria-label={`Editor score ${formatEditorScore(score)} out of 5`}>
            <span className="editor-rating-stars" aria-hidden>
              {scoreStars(score)}
            </span>
            <span className="editor-rating-score">
              {formatEditorScore(score)}
              <span className="editor-rating-max">/5</span>
            </span>
            <span className="editor-rating-label">Editor score</span>
          </div>
        )}
        <p className="article-excerpt">{post.excerpt}</p>
        {post.cover_url && (
          <div className="article-cover-wrap">
            <Image
              className="article-cover"
              src={post.cover_url}
              alt={post.title}
              width={1200}
              height={630}
              sizes="(max-width: 720px) 100vw, 720px"
              priority
            />
          </div>
        )}
        {post.youtube_url && <YouTubeLite url={post.youtube_url} title={post.title} />}
        <article>
          <MarkdownContent
            content={injectInlineCtas(post.content, post.affiliate_url)}
            affiliateUrl={post.affiliate_url}
            postId={post.id}
          />
        </article>
      </main>
      <VerdictBar
        productName={productName}
        score={score}
        stars={score != null ? scoreStars(score) : ""}
        formattedScore={score != null ? formatEditorScore(score) : ""}
        affiliateUrl={post.affiliate_url ?? null}
        postId={post.id}
      />
      <StillDecidingWidget
        productName={productName}
        affiliateUrl={post.affiliate_url ?? null}
        postId={post.id}
        reasons={excerptReasons}
      />
      <SiteFooter />
    </>
  );
}
