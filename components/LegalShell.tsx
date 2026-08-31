import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackPageview } from "@/components/TrackPageview";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  path: string;
  eyebrow: string;
  title: string;
  lead?: string;
  updated?: string;
  children: ReactNode;
};

export function LegalShell({ path, eyebrow, title, lead, updated, children }: Props) {
  return (
    <>
      <TrackPageview path={path} />
      <Header />
      <main className="container legal-page">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {lead && <p className="legal-lead">{lead}</p>}
        {updated && <p className="legal-updated">Last updated: {updated}</p>}
        <div className="legal-body">{children}</div>
        <p className="about-back">
          <Link href="/">← Back to reviews</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
