import { siteUrl } from "@/lib/seo";

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  for (const line of content.split("\n")) {
    const m = /^(?:##|###)\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const h = stripMarkdown(m[1]);
    if (
      !h ||
      /related reviews|get started|faq|frequently asked/i.test(h) ||
      h.length < 4
    ) {
      continue;
    }
    headings.push(h);
    if (headings.length >= 5) break;
  }
  return headings;
}

function extractParagraphs(content: string): string[] {
  const blocks = content
    .split(/\n\s*\n/)
    .map((b) => stripMarkdown(b))
    .filter((b) => b.length > 60 && !/^related reviews/i.test(b));
  return blocks.slice(0, 3);
}

export type SatelliteArticle = {
  title: string;
  contentHtml: string;
  tags: string;
};

/** Build one short SEO companion post that links back to the original review. */
export function buildSatelliteArticle(opts: {
  title: string;
  excerpt?: string | null;
  content: string;
  focus_keyword?: string | null;
  slug: string;
  category?: string | null;
}): SatelliteArticle {
  const origin = `${siteUrl()}/posts/${opts.slug}`;
  const keyword = (opts.focus_keyword || "").trim();
  const headings = extractHeadings(opts.content);
  const paragraphs = extractParagraphs(opts.content);
  const excerpt =
    (opts.excerpt || "").trim() ||
    truncate(paragraphs[0] || stripMarkdown(opts.content), 220);

  const title = keyword
    ? truncate(`${keyword}: quick notes before you buy`, 120)
    : truncate(`Before you buy: ${opts.title}`, 120);

  const bullets =
    headings.length > 0
      ? headings.map((h) => `<li>${escapeHtml(h)}</li>`).join("")
      : paragraphs
          .slice(0, 3)
          .map((p) => `<li>${escapeHtml(truncate(p, 140))}</li>`)
          .join("");

  const contentHtml = `
<p>${escapeHtml(excerpt)}</p>
<p>Here are the key points worth checking before you spend money on this pick:</p>
<ul>${bullets}</ul>
<p>This is a short companion note. For the full breakdown — pros, cons, who it is for, and practical buying advice — read the original review on PickBeforePay.</p>
<p><a href="${escapeHtml(origin)}"><strong>Read the full review →</strong></a></p>
<p><em>Source: <a href="${escapeHtml(origin)}">${escapeHtml(opts.title)}</a> on PickBeforePay.</em></p>
`.trim();

  const tags = ["pickbeforepay", "review", keyword || opts.category || "buying-guide"]
    .map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .filter(Boolean)
    .join(",");

  return { title, contentHtml, tags };
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
