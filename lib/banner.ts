import { getSupabaseAdmin } from "@/lib/supabase";

export const BANNER_LABEL_VARIANTS = ["featured_launch", "partner_spotlight", "exclusive_readers"] as const;
export type BannerLabelVariant = (typeof BANNER_LABEL_VARIANTS)[number];

export type Banner = {
  enabled: boolean;
  product_name: string;
  description: string;
  image_url: string | null;
  expires_at: string | null;
  discount_code: string | null;
  cta_url: string | null;
  label_variant: BannerLabelVariant;
};

export const defaultBanner = (): Banner => ({
  enabled: false,
  product_name: "",
  description: "",
  image_url: null,
  expires_at: null,
  discount_code: null,
  cta_url: null,
  label_variant: "exclusive_readers"
});

function normalizeLabelVariant(v: unknown): BannerLabelVariant {
  const s = String(v || "").trim().toLowerCase();
  if (s === "featured_launch" || s === "partner_spotlight" || s === "exclusive_readers") return s;
  return "exclusive_readers";
}

function isMissingDbColumn(error: { code?: string; message?: string } | null | undefined, column: string) {
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

function normalize(row: Record<string, unknown> | null | undefined): Banner {
  if (!row) return defaultBanner();
  return {
    enabled: Boolean(row.enabled),
    product_name: String(row.product_name || ""),
    description: String(row.description || ""),
    image_url: row.image_url ? String(row.image_url) : null,
    expires_at: row.expires_at ? String(row.expires_at) : null,
    discount_code: row.discount_code ? String(row.discount_code) : null,
    cta_url: row.cta_url ? String(row.cta_url) : null,
    label_variant: normalizeLabelVariant(row.label_variant)
  };
}

export async function getBanner(): Promise<Banner> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("banners")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return defaultBanner();
    return normalize(data as Record<string, unknown>);
  } catch {
    return defaultBanner();
  }
}

export async function saveBanner(input: Banner): Promise<Banner> {
  const banner: Banner = {
    enabled: Boolean(input.enabled),
    product_name: String(input.product_name || "").trim(),
    description: String(input.description || "").trim(),
    image_url: input.image_url?.trim() || null,
    expires_at: input.expires_at || null,
    discount_code: input.discount_code?.trim() || null,
    cta_url: input.cta_url?.trim() || null,
    label_variant: normalizeLabelVariant(input.label_variant)
  };

  let { error } = await getSupabaseAdmin()
    .from("banners")
    .upsert({ id: 1, ...banner, updated_at: new Date().toISOString() });
  if (isMissingDbColumn(error, "label_variant")) {
    const { label_variant: _omit, ...legacy } = banner;
    const retry = await getSupabaseAdmin()
      .from("banners")
      .upsert({ id: 1, ...legacy, updated_at: new Date().toISOString() });
    error = retry.error;
  }

  if (error) throw new Error(error.message);
  return banner;
}
