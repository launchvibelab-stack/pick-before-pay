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
            <strong>Disclaimer.</strong> Content on this site is for general information and educational
            purposes only. It is not financial, investment, legal, or professional advice. Product
            details, pricing, features, and offers can change without notice. Always verify information
            on the vendor’s official page before buying.
          </p>
          <p>
            <strong>No guarantees.</strong> Results mentioned in reviews or marketing materials are not
            typical and are not guaranteed. Your outcomes depend on your skills, effort, market
            conditions, and other factors outside our control. We are not responsible for third-party
            products, services, websites, or any losses arising from decisions you make based on our
            content.
          </p>
          <p>
            By using this website, you agree that PickBeforePay and its operators are not liable for
            any damages related to the use of this site or products reviewed here.
          </p>
        </div>
      </div>
    </footer>
  );
}
