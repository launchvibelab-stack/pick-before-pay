import { revalidatePath } from "next/cache";

type RevalidateOpts = {
  postSlug?: string | null;
  previousPostSlug?: string | null;
  /** Only the affected niche page(s), not every niche. */
  nicheSlugs?: Array<string | null | undefined>;
  /** Bust homepage. Default true when any post slug is provided. */
  home?: boolean;
};

/** Bust ISR only for surfaces that actually changed. */
export function revalidatePublicSurfaces(opts: RevalidateOpts = {}) {
  const bustHome = opts.home ?? Boolean(opts.postSlug || opts.previousPostSlug);
  if (bustHome) revalidatePath("/");

  const nicheSlugs = [
    ...new Set((opts.nicheSlugs || []).map((s) => String(s || "").trim()).filter(Boolean))
  ];
  for (const nicheSlug of nicheSlugs) {
    revalidatePath(`/niche/${nicheSlug}`);
  }

  if (opts.postSlug) revalidatePath(`/posts/${opts.postSlug}`);
  if (opts.previousPostSlug && opts.previousPostSlug !== opts.postSlug) {
    revalidatePath(`/posts/${opts.previousPostSlug}`);
  }
}
