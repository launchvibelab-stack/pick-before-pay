import { getSupabaseAdmin } from "@/lib/supabase";

export type AboutProduct = {
  title: string;
  url: string;
  description?: string;
};

export type AboutProfile = {
  name: string;
  headline: string;
  bio: string;
  avatar_url: string | null;
  facebook_url: string;
  pinterest_url: string;
  telegram_url: string;
  products: AboutProduct[];
};

export const defaultAboutProfile = (): AboutProfile => ({
  name: "PickBeforePay",
  headline: "Honest product reviews before you buy",
  bio: "I research niche digital products and share clear, practical reviews so you can decide with confidence.",
  avatar_url: null,
  facebook_url: "",
  pinterest_url: "",
  telegram_url: "",
  products: []
});

function normalize(row: Record<string, unknown> | null | undefined): AboutProfile {
  const base = defaultAboutProfile();
  if (!row) return base;
  const products = Array.isArray(row.products)
    ? (row.products as AboutProduct[]).filter((p) => p && typeof p.title === "string")
    : [];
  return {
    name: String(row.name || base.name),
    headline: String(row.headline || base.headline),
    bio: String(row.bio || base.bio),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    facebook_url: String(row.facebook_url || ""),
    pinterest_url: String(row.pinterest_url || ""),
    telegram_url: String(row.telegram_url || ""),
    products
  };
}

export async function getAboutProfile(): Promise<AboutProfile> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("about_profile")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) return defaultAboutProfile();
    return normalize(data);
  } catch {
    return defaultAboutProfile();
  }
}

export async function saveAboutProfile(input: AboutProfile): Promise<AboutProfile> {
  const payload = {
    id: 1,
    name: input.name.trim(),
    headline: input.headline.trim(),
    bio: input.bio.trim(),
    avatar_url: input.avatar_url?.trim() || null,
    facebook_url: input.facebook_url.trim(),
    pinterest_url: input.pinterest_url.trim(),
    telegram_url: input.telegram_url.trim(),
    products: (input.products || [])
      .map((p) => ({
        title: String(p.title || "").trim(),
        url: String(p.url || "").trim(),
        description: String(p.description || "").trim()
      }))
      .filter((p) => p.title && p.url),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await getSupabaseAdmin()
    .from("about_profile")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return normalize(data);
}
