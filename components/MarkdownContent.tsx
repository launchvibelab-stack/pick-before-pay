import { isCtaLinkText } from "@/lib/content";
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

export function MarkdownContent({ content, affiliateUrl, postId }: Props) {
  const trackedHref = postId && affiliateUrl ? `/api/go/${postId}` : null;

  const components: Components = {
    a({ href, children, ...props }) {
      const text = String(children ?? "");
      const cta = linkIsAffiliate(href, affiliateUrl) || isCtaLinkText(text);
      if (cta && href) {
        const dest = trackedHref || href;
        return (
          <a
            href={dest}
            className="cta-btn"
            rel="nofollow sponsored noopener"
            target="_blank"
            {...props}
          >
            {children}
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
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
