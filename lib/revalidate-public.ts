import { revalidatePath } from "next/cache";

/** Bust ISR/CDN for surfaces Google actually crawls. */
export function revalidatePublicSurfaces(slug?: string | null, extraSlug?: string | null) {
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/niche/[slug]", "page");
  if (slug) revalidatePath(`/posts/${slug}`);
  if (extraSlug && extraSlug !== slug) revalidatePath(`/posts/${extraSlug}`);
}
