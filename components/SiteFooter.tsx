import Link from "next/link";
import { SubscribeForm } from "@/components/SubscribeForm";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-subscribe">
          <div>
            <h2 className="footer-sub-title">Free Buyer’s Scorecard</h2>
            <p>
              Get the PDF in your inbox now - score any tool or course before you buy. Short tips after;
              unsubscribe anytime.
            </p>
          </div>
          <SubscribeForm compact />
        </div>

        <nav className="footer-nav" aria-label="Site">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>

        <p className="footer-copy">
          © {year} PickBeforePay · pickbeforepay.com
        </p>
        <div className="footer-disclaimer">
          <p>
            <strong>Affiliate disclosure.</strong> Some links on PickBeforePay are affiliate links. We
            may earn a commission if you purchase through them, at no extra cost to you. This does not
            change our review process or editorial opinions.
          </p>
          <p>
            <strong>Disclaimer.</strong> Content is for general information only, not professional advice.
            Product details and offers can change. See our{" "}
            <Link href="/terms">Terms of Use</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link> for full details.
          </p>
        </div>
      </div>
    </footer>
  );
}
