import { siteUrl } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { IndexStatus } from "@/lib/types";

export type IndexResult = {
  index_status: IndexStatus;
  indexed_at: string | null;
  warning?: string;
};

export async function submitToSinbyte(slug: string, taskName: string): Promise<IndexResult> {
  const apikey = process.env.SINBYTE_API_KEY?.trim();
  if (!apikey) {
    return {
      index_status: "skipped",
      indexed_at: null,
      warning: "SINBYTE_API_KEY is not set; skipped indexing."
    };
  }

  const url = `${siteUrl()}/posts/${slug}`;

  try {
    const res = await fetch("https://app.sinbyte.com/api/indexing/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apikey,
        name: taskName.slice(0, 80) || `Index ${slug}`,
        dripfeed: 0,
        urls: [url]
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        index_status: "failed",
        indexed_at: null,
        warning: `Sinbyte indexing failed (${res.status}): ${text.slice(0, 200)}`
      };
    }

    return {
      index_status: "submitted",
      indexed_at: new Date().toISOString()
    };
  } catch (err) {
    return {
      index_status: "failed",
      indexed_at: null,
      warning: err instanceof Error ? err.message : "Sinbyte request failed"
    };
  }
}

export async function maybeIndexPost(opts: {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  previousSlug?: string;
  previousStatus?: IndexStatus;
}): Promise<IndexResult | null> {
  if (!opts.published) {
    return { index_status: "skipped", indexed_at: null };
  }

  const slugChanged = opts.previousSlug && opts.previousSlug !== opts.slug;
  const shouldSubmit =
    !opts.previousStatus ||
    opts.previousStatus === "failed" ||
    opts.previousStatus === "pending" ||
    opts.previousStatus === "skipped" ||
    slugChanged;

  if (!shouldSubmit && opts.previousStatus === "submitted") {
    return null;
  }

  const result = await submitToSinbyte(opts.slug, opts.title);
  await getSupabaseAdmin()
    .from("posts")
    .update({
      index_status: result.index_status,
      indexed_at: result.indexed_at,
      updated_at: new Date().toISOString()
    })
    .eq("id", opts.id);

  return result;
}
