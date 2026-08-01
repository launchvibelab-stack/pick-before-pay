import { getSupabaseAdmin } from "@/lib/supabase";
import type { Post } from "@/lib/types";

export async function getPublishedPosts(nicheId?: string): Promise<Post[]> {
  const db = getSupabaseAdmin();
  let query = db.from("posts").select("*").eq("published", true).order("created_at", { ascending: false });
  if (nicheId) query = query.eq("niche_id", nicheId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data as Post | null;
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await getSupabaseAdmin().from("posts").select("*").eq("id", id).maybeSingle();
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
