import { Header } from "@/components/Header";
import { PromoBanner } from "@/components/PromoBanner";
import { RecentReviews } from "@/components/RecentReviews";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackPageview } from "@/components/TrackPageview";
import { getBanner } from "@/lib/banner";
import { getNiches } from "@/lib/niches";
import { getPublishedPosts } from "@/lib/posts";
import { siteUrl } from "@/lib/seo";
import type { Niche, Post } from "@/lib/types";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

const HOME_TITLE = "PickBeforePay - Honest product reviews";
const HOME_DESC =
  "In-depth niche reviews to help you choose the right tools and products before you buy.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESC,
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESC,
    url: siteUrl(),
    type: "website",
    siteName: "PickBeforePay",
    images: [{ url: "/logo.png" }]
  },
  twitter: {
    card: "summary",
    title: HOME_TITLE,
    description: HOME_DESC,
    images: ["/logo.png"]
  }
};

export default async function Home() {
  let posts: Post[] = [];
  let niches: Niche[] = [];
  let error = "";
  const banner = await getBanner().catch(() => null);
  try {
    [posts, niches] = await Promise.all([getPublishedPosts(), getNiches()]);
  } catch {
    error = "Supabase is not connected. Add environment variables and run schema.sql.";
  }

  return (
    <>
      <TrackPageview path="/" />
      <Header />
      {banner && <PromoBanner banner={banner} />}
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-inner">
              <div className="hero-brand">
                <Image
                  src="/logo-mark.png"
                  alt=""
                  width={28}
                  height={28}
                  className="hero-brand-logo"
                  priority
                  sizes="28px"
                />
                PickBeforePay
              </div>
              <h1>
                Reviews that help you
                <br />
                <em>pick before you pay.</em>
              </h1>
              <p className="hero-lead">
                Clear niche reviews, practical comparisons, and no hype - so you buy with confidence.
              </p>
              <div className="hero-actions">
                <a href="#latest" className="primary-btn">
                  Browse reviews
                </a>
                <a href="#niches" className="btn-ghost">
                  Explore niches
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="niches" className="container section">
          <div className="section-head">
            <span className="eyebrow">Niches</span>
            <h2>Choose a focus. Dig deeper.</h2>
          </div>
          {niches.length > 0 ? (
            <div className="categories">
              {niches.map((n, i) => (
                <Link className="category-card" key={n.id} href={`/niche/${n.slug}`}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{n.name}</h3>
                  <p>{n.description || "Reviews, comparisons, and practical guides."}</p>
                </Link>
              ))}
            </div>
          ) : (
            !error && <div className="empty">No niches yet. Add niches from the admin panel.</div>
          )}
        </section>

        <section id="latest" className="container section" style={{ paddingTop: 0 }}>
          {error && <div className="notice">{error}</div>}
          <RecentReviews posts={posts} />
        </section>

        <section id="about" className="about">
          <div className="container">
            <span className="eyebrow">About</span>
            <h2>
              Built for decisions,
              <br />
              not distraction.
            </h2>
            <p>
              PickBeforePay focuses on real usage, who a product is for, and whether it is worth the
              money - before you commit.
            </p>
            <p style={{ marginTop: 18 }}>
              <Link href="/about" className="primary-btn">
                Meet the reviewer →
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
