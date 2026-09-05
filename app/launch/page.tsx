import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { Header } from "@/components/Header";
import { LaunchOffer } from "@/components/LaunchOffer";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackPageview } from "@/components/TrackPageview";
import { getBanner } from "@/lib/banner";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const banner = await getBanner().catch(() => null);
  const name = banner?.product_name?.trim() || "Exclusive launch";
  const title = `${name} — Prelaunch offer`;
  const description =
    banner?.description?.trim() ||
    "Get your exclusive discount or bonus before this launch offer ends.";
  const url = `${siteUrl()}/launch`;
  const image = banner?.image_url || "/logo.png";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "PickBeforePay",
      images: [{ url: image }]
    },
    twitter: {
      card: banner?.image_url ? "summary_large_image" : "summary",
      title,
      description,
      images: [image]
    }
  };
}

export default async function LaunchPage() {
  const banner = await getBanner().catch(() => null);

  return (
    <>
      <TrackPageview path="/launch" />
      <Header />
      <main className="launch-page">
        <div className="container launch-wrap">
          {banner ? (
            <LaunchOffer banner={banner} />
          ) : (
            <div className="launch-ended">
              <h1>No active launch</h1>
              <p>Check back soon, or browse our reviews.</p>
              <Link href="/" className="primary-btn">
                Browse reviews
              </Link>
            </div>
          )}
          <p className="launch-back">
            <Link href="/">← Back to PickBeforePay</Link>
          </p>
        </div>
      </main>
      {banner && <ExitIntentPopup banner={banner} />}
      <SiteFooter />
    </>
  );
}
