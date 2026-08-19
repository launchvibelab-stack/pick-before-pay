/**
 * Splits markdown into sections by ## headings and injects a CTA
 * placeholder after every section that has >= MIN_PARAGRAPHS paragraphs.
 *
 * The placeholder %%INLINE_CTA%% is later swapped for a real CTA box
 * inside MarkdownContent via a custom ReactMarkdown component.
 */

const CTA_PLACEHOLDER = "%%INLINE_CTA%%";
const MIN_PARAGRAPHS = 3; // section must have at least 3 paragraphs
const MAX_CTAS = 2; // keep article clean: at most two inline CTAs

export { CTA_PLACEHOLDER };

/** Count non-empty paragraphs in a markdown block (rough heuristic) */
function countParagraphs(text: string): number {
  return text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("#") && !s.startsWith("|") && !s.startsWith("```"))
    .length;
}

function pickBestPositions(candidates: number[]): Set<number> {
  if (candidates.length <= MAX_CTAS) return new Set(candidates);
  // Spread placements through the article: roughly 35% and 75% of eligible sections.
  const first = candidates[Math.floor((candidates.length - 1) * 0.35)];
  const second = candidates[Math.floor((candidates.length - 1) * 0.75)];
  if (first === second) {
    return new Set([first, candidates[candidates.length - 1]]);
  }
  return new Set([first, second]);
}

/**
 * Injects %%INLINE_CTA%% placeholders into markdown.
 * Only inserted when a post has an affiliate URL; selects up to 2 best positions.
 */
export function injectInlineCtas(markdown: string, affiliateUrl: string | null | undefined): string {
  if (!affiliateUrl || !markdown.trim()) return markdown;

  // Split on ## headings (keep the heading line at the start of each chunk)
  const parts = markdown.split(/(?=^##\s)/m);
  const eligible: number[] = [];
  for (let idx = 1; idx < parts.length - 1; idx += 1) {
    if (countParagraphs(parts[idx]) >= MIN_PARAGRAPHS) eligible.push(idx);
  }
  const selected = pickBestPositions(eligible);

  return parts
    .map((part, idx) =>
      selected.has(idx) ? part.trimEnd() + "\n\n" + CTA_PLACEHOLDER + "\n\n" : part
    )
    .join("");
}
