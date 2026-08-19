import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackPageview } from "@/components/TrackPageview";
import { getAboutProfile } from "@/lib/about";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getAboutProfile();
  const title = `About ${profile.name}`;
  const description = profile.headline || profile.bio.slice(0, 155);
  const url = `${siteUrl()}/about`;
  const image = profile.avatar_url || "/logo.png";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      siteName: "PickBeforePay",
      images: [{ url: image }]
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image]
    }
  };
}

export default async function AboutPage() {
  const profile = await getAboutProfile();
  const socials = [
    { label: "Facebook", href: profile.facebook_url },
    { label: "Pinterest", href: profile.pinterest_url },
    { label: "Telegram", href: profile.telegram_url },
    { label: "LinkedIn", href: profile.linkedin_url },
    { label: "YouTube", href: profile.youtube_url }
  ].filter((s) => s.href);

  return (
    <>
      <TrackPageview path="/about" />
      <Header />
      <main className="container about-page">
        <div className="about-hero">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              width={112}
              height={112}
              className="about-avatar"
            />
          ) : (
            <div className="about-avatar about-avatar-fallback" aria-hidden>
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <span className="eyebrow">About</span>
            <h1>{profile.name}</h1>
            {profile.headline && <p className="about-headline">{profile.headline}</p>}
          </div>
        </div>

        {profile.bio && (
          <div className="about-bio">
            {profile.bio.split(/\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {socials.length > 0 && (
          <section className="about-section">
            <h2>Connect</h2>
            <div className="about-socials">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="about-social">
                  {s.label}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="about-section">
          <h2>My products</h2>
          {profile.profile_image_url && (
            <div className="about-profile-img-wrap">
              <Image
                src={profile.profile_image_url}
                alt={profile.name}
                width={1200}
                height={675}
                className="about-profile-img"
                sizes="(max-width: 720px) 100vw, 720px"
              />
            </div>
          )}
          {profile.products.length === 0 ? (
            <p className="muted-line">Products will appear here once added in the admin About editor.</p>
          ) : (
            <div className="about-products-grid">
              {profile.products.map((p) => (
                <a key={p.url + p.title} href={p.url} className="about-product-tile" target="_blank" rel="noopener noreferrer" title={p.description || p.title}>
                  <span className="about-product-tile-name">{p.title}</span>
                  <span className="about-product-tile-arrow" aria-hidden>↗</span>
                </a>
              ))}
            </div>
          )}
        </section>

        <p className="about-back">
          <Link href="/">← Back to reviews</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
