import { LegalShell } from "@/components/LegalShell";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400;

const UPDATED = "August 31, 2026";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using PickBeforePay.",
  alternates: { canonical: `${siteUrl()}/terms` }
};

export default function TermsPage() {
  return (
    <LegalShell
      path="/terms"
      eyebrow="Legal"
      title="Terms of Use"
      lead="By using PickBeforePay, you agree to these terms. Please read them carefully."
      updated={UPDATED}
    >
      <section>
        <h2>About this site</h2>
        <p>
          PickBeforePay provides product reviews, comparisons, and educational content to help you
          research purchases before you buy. We are not the seller of products reviewed on this site unless
          clearly stated.
        </p>
      </section>

      <section>
        <h2>Not professional advice</h2>
        <p>
          Our content is for general information and education only. It is not financial, investment,
          legal, tax, or professional advice. Always verify pricing, features, refund policies, and
          license terms on the vendor&apos;s official website before purchasing.
        </p>
      </section>

      <section>
        <h2>Affiliate disclosure</h2>
        <p>
          Some links on PickBeforePay are affiliate links. If you buy through them, we may earn a
          commission at no extra cost to you. This does not change our editorial process. See also our{" "}
          <Link href="/about">About</Link> page for more context on how we review products.
        </p>
      </section>

      <section>
        <h2>Accuracy of information</h2>
        <p>
          We aim to keep reviews accurate and up to date, but product details, prices, bonuses, and offers
          can change without notice. We do not guarantee that all information is complete, current, or
          error-free.
        </p>
      </section>

      <section>
        <h2>No guarantees</h2>
        <p>
          Results mentioned in reviews, ads, or vendor materials are not typical and are not guaranteed.
          Your outcomes depend on your skills, effort, market conditions, and other factors outside our
          control.
        </p>
      </section>

      <section>
        <h2>Third-party products and links</h2>
        <p>
          We are not responsible for third-party websites, products, support, billing, or refund
          policies. Any transaction you make is directly with the vendor. Use third-party sites at your
          own risk.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          Site content, branding, and original text are owned by PickBeforePay or used with permission.
          You may not copy, scrape, or republish substantial portions without written permission. Short
          quotes with a link back are fine for commentary or reference.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the site for unlawful purposes or to harm others.</li>
          <li>Attempt to breach security, scrape aggressively, or disrupt service.</li>
          <li>Submit false information through forms or abuse email signup.</li>
        </ul>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, PickBeforePay and its operators are not liable for any
          indirect, incidental, or consequential damages arising from your use of this site or from
          products or services you purchase based on our content.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms at any time. Continued use of the site after changes constitutes
          acceptance of the revised terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Visit our <Link href="/contact">Contact</Link> page or read our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
