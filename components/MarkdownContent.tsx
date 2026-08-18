import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  affiliateUrl?: string | null;
  postId?: string;
};

function linkIsAffiliate(href: string | undefined, affiliateUrl?: string | null): boolean {
  if (!href) return false;
  const aff = (affiliateUrl || "").trim();
  if (aff && href === aff) return true;
  if (/YOUR_AFFILIATE_LINK/i.test(href)) return true;
  return false;
}

function looksLikeUrl(text: string) {
  return /^https?:\/\//i.test(text.trim());
}

export function MarkdownContent({ content, affiliateUrl, postId }: Props) {
  const trackedHref = postId && affiliateUrl ? `/api/go/${postId}` : null;

  const components: Components = {
    a({ href, children, ...props }) {
      // Keep emails as plain text (no mailto) so Cloudflare won't inject /cdn-cgi/email-protection links.
      if (href?.startsWith("mailto:")) {
        return <span>{children}</span>;
      }
      const text = String(children ?? "").trim();
      // Only YOUR_AFFILIATE_LINK / the post affiliate URL become CTA buttons - not other phrases.
      const affiliate = linkIsAffiliate(href, affiliateUrl);
      if (affiliate && href) {
        const dest = trackedHref || href;
        const label = !text || looksLikeUrl(text) || /YOUR_AFFILIATE_LINK/i.test(text) ? "Get started" : children;
        return (
          <a
            href={dest}
            className="cta-btn"
            rel="nofollow sponsored noopener"
            target="_blank"
            {...props}
          >
            {label}
          </a>
        );
      }
      return (
        <a href={href} rel="noopener" {...props}>
          {children}
        </a>
      );
    },
    table({ children }) {
      return (
        <div className="table-scroll">
          <table>{children}</table>
        </div>
      );
    },
    blockquote({ children }) {
      return <blockquote className="disclosure">{children}</blockquote>;
    }
  };

  return (
    <div className="prose">
      {/* Cloudflare Scrape Shield: keep emails as plain text, not /cdn-cgi/email-protection */}
      <span dangerouslySetInnerHTML={{ __html: "<!--email_off-->" }} />
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
      <span dangerouslySetInnerHTML={{ __html: "<!--/email_off-->" }} />
    </div>
  );
}
