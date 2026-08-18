import { revalidatePublicSurfaces } from "@/lib/revalidate-public";
import { syncNicheInternalLinks } from "@/lib/seo";
import { maybeIndexPost } from "@/lib/sinbyte";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { IndexStatus } from "@/lib/types";
import { maybeSyndicateToWordPress } from "@/lib/wordpress";

export function mergeWarnings(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(" ") || undefined;
}

export type GoLiveResult = {
  niche_links_updated: number;
  index_status?: IndexStatus;
  warning?: string;
  wordpress_posted?: boolean;
  wordpress_post_url?: string;
};

/** Sinbyte + niche link sync + WordPress.com companion after a post goes live. */
export async function runGoLiveSideEffects(opts: {
  id: string;
  title: string;
  excerpt?: string | null;
  content: string;
  focus_keyword?: string | null;
  slug: string;
  category?: string | null;
  niche_id?: string | null;
  created_at?: string | null;
  previousSlug?: string;
  previousStatus?: IndexStatus;
  wordpressPostedAt?: string | null;
}): Promise<GoLiveResult> {
  let nicheSync = 0;
  if (opts.niche_id) {
    try {
      nicheSync = await syncNicheInternalLinks({
        nicheId: opts.niche_id,
        seedPost: {
          id: opts.id,
          title: opts.title,
          slug: opts.slug,
          focus_keyword: opts.focus_keyword || "",
          created_at: opts.created_at || new Date().toISOString()
        }
      });
    } catch {
      nicheSync = 0;
    }
  }

  const index = await maybeIndexPost({
    id: opts.id,
    slug: opts.slug,
    title: opts.title,
    published: true,
    previousSlug: opts.previousSlug,
    previousStatus: opts.previousStatus ?? null
  });

  const indexStatus = index?.index_status ?? opts.previousStatus ?? null;

  revalidatePublicSurfaces(opts.slug, opts.previousSlug);

  const syndicate = await maybeSyndicateToWordPress({
    id: opts.id,
    title: opts.title,
    excerpt: opts.excerpt,
    content: opts.content,
    focus_keyword: opts.focus_keyword,
    slug: opts.slug,
    category: opts.category,
    published: true,
    indexStatus:
      index?.index_status === "submitted"
        ? "submitted"
        : opts.previousStatus === "submitted" && !opts.wordpressPostedAt
          ? "submitted"
          : indexStatus,
    wordpressPostedAt: opts.wordpressPostedAt ?? null
  });

  return {
    niche_links_updated: nicheSync,
    index_status: index?.index_status ?? undefined,
    warning: mergeWarnings(index?.warning, syndicate?.warning),
    wordpress_posted: syndicate?.posted === true,
    wordpress_post_url: syndicate?.url
  };
}

/** Publish every due scheduled draft. */
export async function publishDueScheduledPosts(): Promise<{
  published: number;
  results: Array<{ id: string; slug: string; warning?: string }>;
}> {
  const now = new Date().toISOString();
  const { data: due, error } = await getSupabaseAdmin()
    .from("posts")
    .select("*")
    .eq("published", false)
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (error) throw new Error(error.message);
  if (!due?.length) return { published: 0, results: [] };

  const results: Array<{ id: string; slug: string; warning?: string }> = [];

  for (const post of due) {
    const liveAt = new Date().toISOString();
    const { data: updated, error: upErr } = await getSupabaseAdmin()
      .from("posts")
      .update({
        published: true,
        scheduled_at: null,
        index_status: "pending",
        // Public "published" date = go-live day, not the day the draft was written.
        created_at: liveAt,
        updated_at: liveAt
      })
      .eq("id", post.id)
      .eq("published", false)
      .select()
      .maybeSingle();

    if (upErr || !updated) {
      results.push({ id: post.id, slug: post.slug, warning: upErr?.message || "Skip (race)" });
      continue;
    }

    const side = await runGoLiveSideEffects({
      id: updated.id,
      title: updated.title,
      excerpt: updated.excerpt,
      content: updated.content,
      focus_keyword: updated.focus_keyword,
      slug: updated.slug,
      category: updated.category,
      niche_id: updated.niche_id,
      created_at: updated.created_at,
      previousStatus: (post.index_status as IndexStatus) || null,
      wordpressPostedAt: post.wordpress_posted_at ?? null
    });

    results.push({
      id: updated.id,
      slug: updated.slug,
      warning: side.warning
    });
  }

  return { published: results.filter((r) => !r.warning?.includes("Skip")).length, results };
}

/** Cron runs daily ~21:00 VN (= 14:00 UTC). Date-only values map to that slot. */
export function parseScheduledAt(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    let iso = `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T14:00:00.000Z`;
    // If today's 21:00 VN slot already passed, roll to the next day.
    if (new Date(iso).getTime() <= Date.now()) {
      const next = new Date(iso);
      next.setUTCDate(next.getUTCDate() + 1);
      iso = next.toISOString().replace(/\.\d{3}Z$/, ".000Z");
    }
    return iso;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
