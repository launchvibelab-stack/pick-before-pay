/** Normalize pasted review Markdown for SEO + conversion. */

const AFFILIATE_PLACEHOLDERS = [
  /YOUR_AFFILIATE_LINK/gi,
  /\{\{\s*AFFILIATE_URL\s*\}\}/gi,
  /%AFFILIATE_URL%/gi,
  /\[AFFILIATE_LINK\]/gi
];

const CTA_TEXT =
  /get .+ through our link|claim .+bonus|check current offer|buy .+ now|get started|claim your|exclusive .+bonus/i;

export function isCtaLinkText(text: string): boolean {
  return CTA_TEXT.test(text.replace(/\s+/g, " ").trim());
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

export function replaceAffiliatePlaceholders(content: string, affiliateUrl: string): string {
  const url = affiliateUrl.trim();
  if (!url) return content;
  let out = content;
  for (const re of AFFILIATE_PLACEHOLDERS) {
    out = out.replace(re, url);
  }
  return out;
}

/** Ensure at least one strong CTA exists when affiliate URL is set. */
export function ensureAffiliateCtas(content: string, affiliateUrl: string): string {
  const url = affiliateUrl.trim();
  if (!url) return content;
  if (content.includes(url)) return content;
  return `${content.trim()}\n\n## Get started\n\n[Check current offer](${url})\n`;
}

export function normalizeReviewContent(content: string, affiliateUrl?: string | null): string {
  let out = content.replace(/\r\n/g, "\n").trim();
  // Drop a lone bold title line that duplicates the post H1
  out = out.replace(/^\*\*[^*\n]+\*\*\s*\n+/, "");
  out = demoteHeadingsForSeo(out);
  if (affiliateUrl) {
    out = replaceAffiliatePlaceholders(out, affiliateUrl);
    out = ensureAffiliateCtas(out, affiliateUrl);
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
