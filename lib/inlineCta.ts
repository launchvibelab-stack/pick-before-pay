/**
 * Splits markdown into sections by ## headings and injects a CTA
 * placeholder after every section that has >= MIN_PARAGRAPHS paragraphs.
 *
 * The placeholder %%INLINE_CTA%% is later swapped for a real CTA box
 * inside MarkdownContent via a custom ReactMarkdown component.
 */

const CTA_PLACEHOLDER = "%%INLINE_CTA%%";
const MIN_PARAGRAPHS = 3; // insert CTA after sections with ≥ 3 paragraphs

export { CTA_PLACEHOLDER };

/** Count non-empty paragraphs in a markdown block (rough heuristic) */
function countParagraphs(text: string): number {
  return text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("#") && !s.startsWith("|") && !s.startsWith("```"))
    .length;
}

/**
 * Injects %%INLINE_CTA%% placeholders into markdown.
 * Only inserted when a post has an affiliate URL and the section is long enough.
 */
export function injectInlineCtas(markdown: string, affiliateUrl: string | null | undefined): string {
  if (!affiliateUrl || !markdown.trim()) return markdown;

  // Split on ## headings (keep the heading line at the start of each chunk)
  const parts = markdown.split(/(?=^##\s)/m);

  return parts
    .map((part, idx) => {
      // Skip the very first intro block and very last block to avoid double CTA
      if (idx === 0 || idx === parts.length - 1) return part;
      if (countParagraphs(part) >= MIN_PARAGRAPHS) {
        return part.trimEnd() + "\n\n" + CTA_PLACEHOLDER + "\n\n";
      }
      return part;
    })
    .join("");
}
