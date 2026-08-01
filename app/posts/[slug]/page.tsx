import { Header } from "@/components/Header";
import { getPostBySlug } from "@/lib/posts";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

export const dynamic = "force-dynamic";
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
  const jsonLd = {
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

  return (
    <>
      <Header />
      <main className="container article-wrap">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="article-meta">
          <span className="category-pill">{post.category}</span>
          <span>{new Date(post.created_at).toLocaleDateString("en-US")}</span>
          {post.focus_keyword && <span>Keyword: {post.focus_keyword}</span>}
        </div>
        <h1>{post.title}</h1>
        <p className="article-excerpt">{post.excerpt}</p>
        {post.cover_url && <img className="article-cover" src={post.cover_url} alt={post.title} />}
        <article className="prose">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>
      </main>
      <footer>
        <div className="container">© {new Date().getFullYear()} PickBeforePay · pickbeforepay.com</div>
      </footer>
    </>
  );
}
