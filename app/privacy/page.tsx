import { LegalShell } from "@/components/LegalShell";
import { siteUrl } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400;

const UPDATED = "August 31, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PickBeforePay collects, uses, and protects your information.",
  alternates: { canonical: `${siteUrl()}/privacy` }
};

export default function PrivacyPage() {
  return (
    <LegalShell
      path="/privacy"
      eyebrow="Legal"
      title="Privacy Policy"
      lead="We respect your privacy. This policy explains what we collect when you use PickBeforePay and how we use it."
      updated={UPDATED}
    >
      <section>
        <h2>Who we are</h2>
        <p>
          PickBeforePay (<Link href="/">pickbeforepay.com</Link>) publishes independent product reviews.
          For privacy questions, contact us via our <Link href="/contact">Contact</Link> page.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Email address</strong> when you subscribe to our newsletter, banner offers, or exit
            popups. You may optionally provide a name.
          </li>
          <li>
            <strong>Usage data</strong> such as pages viewed and affiliate link clicks (aggregated for
            site analytics).
          </li>
          <li>
            <strong>Technical data</strong> through standard web logs and analytics tools (e.g. browser
            type, approximate location, referral source). Google Analytics may use cookies if enabled on
            our site.
          </li>
        </ul>
        <p>We do not knowingly collect personal information from children under 13.</p>
      </section>

      <section>
        <h2>How we use your information</h2>
        <ul>
          <li>Send the content you requested (e.g. free PDFs, bonus emails, discount codes).</li>
          <li>Improve our reviews and understand which content is useful.</li>
          <li>Operate, secure, and maintain the website.</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section>
        <h2>Email marketing</h2>
        <p>
          If you join our email list, you may receive a short welcome sequence and occasional tips. Every
          marketing email includes an unsubscribe link. You can also unsubscribe at any time on our{" "}
          <Link href="/unsubscribe">unsubscribe page</Link>.
        </p>
      </section>

      <section>
        <h2>Third-party services</h2>
        <p>We use trusted providers to run the site, for example:</p>
        <ul>
          <li>Hosting and infrastructure (e.g. Vercel)</li>
          <li>Database and storage (Supabase)</li>
          <li>Email delivery (Resend)</li>
          <li>Email list management (GetResponse, when configured)</li>
          <li>Analytics (Google Analytics, when configured)</li>
        </ul>
        <p>
          These services process data on our behalf under their own privacy policies. Affiliate and
          product links on our site lead to third-party websites with separate privacy practices.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We may use cookies or similar technologies for analytics and basic site functionality. You can
          control cookies through your browser settings. Blocking cookies may affect some features.
        </p>
      </section>

      <section>
        <h2>Data retention</h2>
        <p>
          We keep subscriber data while you remain on our list or as needed to provide the service.
          Analytics aggregates may be retained longer in summarized form. You can request deletion by
          contacting us.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have rights to access, correct, delete, or restrict use of
          your personal data. To exercise these rights, contact us and we will respond within a reasonable
          time.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top will
          change when we do. Continued use of the site after changes means you accept the updated policy.
        </p>
      </section>
    </LegalShell>
  );
}
