import { LegalShell } from "@/components/LegalShell";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400;

const CONTACT_EMAIL = "nhanscope@gmail.com";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with PickBeforePay for questions, corrections, or partnership inquiries.",
  alternates: { canonical: `${siteUrl()}/contact` }
};

export default function ContactPage() {
  return (
    <LegalShell
      path="/contact"
      eyebrow="Contact"
      title="Get in touch"
      lead="Questions about a review, a broken link, or working together? We read every message."
    >
      <section className="contact-card">
        <h2>Email</h2>
        <p>
          The fastest way to reach us:
        </p>
        <p>
          {/* Plain text on purpose: Cloudflare Email Obfuscation rewrites mailto: to a 404 /cdn-cgi link */}
          <span className="contact-email">{CONTACT_EMAIL}</span>
        </p>
        <p className="muted-line">
          We usually reply within 2–3 business days.
        </p>
      </section>

      <section>
        <h2>What to include</h2>
        <ul>
          <li>The review URL or product name, if your message is about a specific post.</li>
          <li>Clear details so we can help on the first reply.</li>
          <li>For refund or product support, contact the vendor directly — we cannot access your orders.</li>
        </ul>
      </section>

      <section>
        <h2>Email list</h2>
        <p>
          To stop marketing emails, use the unsubscribe link in any message or visit our{" "}
          <Link href="/unsubscribe">unsubscribe page</Link>. That is faster than emailing us.
        </p>
      </section>

      <section>
        <h2>More about us</h2>
        <p>
          Learn who runs PickBeforePay and what we review on the <Link href="/about">About</Link> page.
        </p>
      </section>
    </LegalShell>
  );
}
