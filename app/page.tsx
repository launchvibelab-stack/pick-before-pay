import { Header } from "@/components/Header";
import { PromoBanner } from "@/components/PromoBanner";
import { RecentReviews } from "@/components/RecentReviews";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackPageview } from "@/components/TrackPageview";
import { WinningProducts } from "@/components/WinningProducts";
import { getAboutProfile } from "@/lib/about";
import { getBanner } from "@/lib/banner";
import { getPublishedPosts } from "@/lib/posts";
import { siteUrl } from "@/lib/seo";
import type { Post } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 1800;

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
  let error = "";
  const banner = await getBanner().catch(() => null);
  const about = await getAboutProfile().catch(() => null);
  try {
    posts = await getPublishedPosts();
  } catch {
    error = "Supabase is not connected. Add environment variables and run schema.sql.";
  }

  return (
    <>
      <TrackPageview path="/" />
      <Header />
      {banner && <PromoBanner banner={banner} />}
      <main>
        <section id="latest" className="container section home-latest">
          {error && <div className="notice">{error}</div>}
          <RecentReviews posts={posts} />
        </section>

        <WinningProducts products={about?.products || []} />

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
