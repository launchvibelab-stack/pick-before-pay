/** Normalize pasted review Markdown for SEO + conversion. */

/** Only this placeholder becomes the affiliate URL (in markdown hrefs). */
const AFFILIATE_HREF = /\]\(\s*YOUR_AFFILIATE_LINK\s*\)/gi;

export function replaceAffiliatePlaceholders(content: string, affiliateUrl: string): string {
  const url = affiliateUrl.trim();
  if (!url) return content;

  let out = content;
  // [YOUR_AFFILIATE_LINK](YOUR_AFFILIATE_LINK) → [Get started](real-url)
  out = out.replace(
    /\[YOUR_AFFILIATE_LINK\]\(\s*YOUR_AFFILIATE_LINK\s*\)/gi,
    `[Get started](${url})`
  );
  // [Any label](YOUR_AFFILIATE_LINK) → [Any label](real-url)
  out = out.replace(AFFILIATE_HREF, `](${url})`);
  return out;
}

/** Convert content H1 (`#`) to H2 so the page title remains the only H1. Idempotent on re-save. */
export function demoteHeadingsForSeo(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      // Only single-hash headings; leave ##+ untouched so re-saves stay stable.
      if (/^#\s+/.test(line) && !/^##/.test(line)) {
        return `#${line}`;
      }
      return line;
    })
    .join("\n");
}

export function normalizeReviewContent(content: string, affiliateUrl?: string | null): string {
  let out = content.replace(/\r\n/g, "\n").trim();
  // Drop a lone bold title line that duplicates the post H1
  out = out.replace(/^\*\*[^*\n]+\*\*\s*\n+/, "");
  out = demoteHeadingsForSeo(out);
  if (affiliateUrl) {
    out = replaceAffiliatePlaceholders(out, affiliateUrl);
  }
  return out.trim();
}

export type FaqItem = { question: string; answer: string };

/** Pull Q&A pairs from a FAQ section for JSON-LD. */
export function extractFaqs(content: string): FaqItem[] {
  const faqs: FaqItem[] = [];
  const faqStart = content.search(/^#{2,4}\s+.*frequently asked questions/im);
  if (faqStart < 0) return faqs;

  const rest = content.slice(faqStart);
  // Stop at Conclusion / next non-question major block
  const stop = rest.search(/\n#{2}\s+[^\n]*(conclusion|exclusive|related reviews)/i);
  const section = stop > 0 ? rest.slice(0, stop) : rest;

  const parts = section.split(/\n(?=#{2,4}\s+)/);
  for (const part of parts) {
    const m = /^(#{2,4})\s+\*?\*?(.+?)\*?\*?\s*\n([\s\S]*)$/.exec(part.trim());
    if (!m) continue;
    const question = m[2].replace(/\*\*/g, "").trim();
    if (/frequently asked questions/i.test(question)) continue;
    if (!/\?$/.test(question)) continue;
    const answer = m[3]
      .replace(/^#{1,6}\s+.*$/gm, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`>#]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (question && answer && question.length < 200) {
      faqs.push({ question, answer: answer.slice(0, 500) });
    }
  }
  return faqs.slice(0, 12);
}
