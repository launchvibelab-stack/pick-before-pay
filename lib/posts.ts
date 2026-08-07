import { getSupabaseAdmin } from "@/lib/supabase";
import type { Post } from "@/lib/types";
import { cache } from "react";

const LIST_FIELDS =
  "id, title, slug, excerpt, category, cover_url, created_at, focus_keyword, niche_id, published";

const DETAIL_FIELDS =
  "id, title, slug, excerpt, content, category, cover_url, created_at, updated_at, focus_keyword, niche_id, affiliate_url, meta_title, meta_description, published";

export async function getPublishedPosts(nicheId?: string, limit = 24): Promise<Post[]> {
  const db = getSupabaseAdmin();
  let query = db
    .from("posts")
    .select(LIST_FIELDS)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (nicheId) query = query.eq("niche_id", nicheId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Post[];
}

/** Dedupes metadata + page fetch in the same request. */
export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select(DETAIL_FIELDS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data as Post | null;
});

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Post | null;
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
