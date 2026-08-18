import { getSupabaseAdmin } from "@/lib/supabase";
import type { Post } from "@/lib/types";
import { cache } from "react";

const LIST_FIELDS =
  "id, title, slug, excerpt, category, cover_url, created_at, focus_keyword, niche_id, published, editor_score";

const DETAIL_FIELDS =
  "id, title, slug, excerpt, content, category, cover_url, created_at, updated_at, focus_keyword, niche_id, affiliate_url, meta_title, meta_description, published, editor_score, youtube_url";

const LIST_FIELDS_LEGACY = LIST_FIELDS.replace(", editor_score", "");
const DETAIL_FIELDS_NO_YOUTUBE = DETAIL_FIELDS.replace(", youtube_url", "");
const DETAIL_FIELDS_LEGACY = DETAIL_FIELDS_NO_YOUTUBE.replace(", editor_score", "");

export function isMissingDbColumn(
  error: { code?: string; message?: string } | null | undefined,
  column: string
) {
  if (!error) return false;
  const msg = String(error.message || "");
  if (!msg.includes(column)) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /schema cache/i.test(msg) ||
    /does not exist/i.test(msg)
  );
}

export async function getPublishedPosts(nicheId?: string, limit = 24): Promise<Post[]> {
  const db = getSupabaseAdmin();
  const run = async (fields: string) => {
    let query = db
      .from("posts")
      .select(fields)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (nicheId) query = query.eq("niche_id", nicheId);
    return query;
  };

  const first = await run(LIST_FIELDS);
  if (isMissingDbColumn(first.error, "editor_score")) {
    const second = await run(LIST_FIELDS_LEGACY);
    if (second.error) throw second.error;
    return (second.data || []) as unknown as Post[];
  }
  if (first.error) throw first.error;
  return (first.data || []) as unknown as Post[];
}

/** Dedupes metadata + page fetch in the same request. */
export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const db = getSupabaseAdmin();
  const run = (fields: string) =>
    db.from("posts").select(fields).eq("slug", slug).eq("published", true).maybeSingle();

  let result = await run(DETAIL_FIELDS);
  if (isMissingDbColumn(result.error, "youtube_url")) {
    result = await run(DETAIL_FIELDS_NO_YOUTUBE);
  }
  if (isMissingDbColumn(result.error, "editor_score")) {
    result = await run(DETAIL_FIELDS_LEGACY);
  }
  if (result.error) throw result.error;
  return result.data as unknown as Post | null;
});

export async function getPostById(id: string): Promise<Post | null> {
  const db = getSupabaseAdmin();
  const first = await db.from("posts").select("*").eq("id", id).maybeSingle();
  if (!first.error) {
    const row = first.data as Post | null;
    if (!row) return null;
    return { ...row, youtube_url: row.youtube_url ?? null };
  }
  if (isMissingDbColumn(first.error, "youtube_url") || isMissingDbColumn(first.error, "editor_score")) {
    const second = await db.from("posts").select(DETAIL_FIELDS_LEGACY).eq("id", id).maybeSingle();
    if (second.error) throw second.error;
    const row = second.data as Post | null;
    if (!row) return null;
    return { ...row, youtube_url: null };
  }
  throw first.error;
}

export async function getAllPublishedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select("slug, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as { slug: string; updated_at: string }[];
}
