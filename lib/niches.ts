import { getSupabaseAdmin } from "@/lib/supabase";
import type { Niche } from "@/lib/types";

export async function getNiches(): Promise<Niche[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("niches")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as Niche[];
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("niches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Niche | null;
}

export async function getNicheById(id: string): Promise<Niche | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("niches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Niche | null;
}
