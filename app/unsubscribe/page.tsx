import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { UnsubscribeClient } from "@/components/UnsubscribeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false }
};

export default async function UnsubscribePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <Header />
      <main className="container article-wrap" style={{ maxWidth: 560, paddingTop: 48, paddingBottom: 64 }}>
        <UnsubscribeClient token={token || ""} />
      </main>
      <SiteFooter />
    </>
  );
}
