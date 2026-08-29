import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeSafeHttpsUrl } from "@/lib/urls";

export const BANNER_LABEL_VARIANTS = ["featured_launch", "partner_spotlight", "exclusive_readers"] as const;
export type BannerLabelVariant = (typeof BANNER_LABEL_VARIANTS)[number];

export const BANNER_COUNTDOWN_LABELS = ["ends_in", "launches_in", "offer_ends"] as const;
export type BannerCountdownLabel = (typeof BANNER_COUNTDOWN_LABELS)[number];

export type Banner = {
  enabled: boolean;
  product_name: string;
  description: string;
  image_url: string | null;
  expires_at: string | null;
  discount_code: string | null;
  cta_url: string | null;
  review_url: string | null;
  label_variant: BannerLabelVariant;
  countdown_label: BannerCountdownLabel;
};

export const defaultBanner = (): Banner => ({
  enabled: false,
  product_name: "",
  description: "",
  image_url: null,
  expires_at: null,
  discount_code: null,
  cta_url: null,
  review_url: null,
  label_variant: "exclusive_readers",
  countdown_label: "ends_in"
});

function normalizeLabelVariant(v: unknown): BannerLabelVariant {
  const s = String(v || "").trim().toLowerCase();
  if (s === "featured_launch" || s === "partner_spotlight" || s === "exclusive_readers") return s;
  return "exclusive_readers";
}

function normalizeCountdownLabel(v: unknown): BannerCountdownLabel {
  const s = String(v || "").trim().toLowerCase();
  if (s === "ends_in" || s === "launches_in" || s === "offer_ends") return s;
  return "ends_in";
}

export function countdownLabelText(v: BannerCountdownLabel | null | undefined): string {
  if (v === "launches_in") return "Launches in";
  if (v === "offer_ends") return "Offer ends in";
  return "Ends in";
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
    review_url: row.review_url ? String(row.review_url) : null,
    label_variant: normalizeLabelVariant(row.label_variant),
    countdown_label: normalizeCountdownLabel(row.countdown_label)
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

export async function saveBanner(input: Banner): Promise<{ banner: Banner; warning?: string }> {
  const image = normalizeSafeHttpsUrl(input.image_url, "Banner image URL");
  if (image.error) throw new Error(image.error);
  const cta = normalizeSafeHttpsUrl(input.cta_url, "CTA URL");
  if (cta.error) throw new Error(cta.error);
  const review = normalizeSafeHttpsUrl(input.review_url, "Review article URL", { allowRelative: true });
  if (review.error) throw new Error(review.error);

  const banner: Banner = {
    enabled: Boolean(input.enabled),
    product_name: String(input.product_name || "").trim(),
    description: String(input.description || "").trim(),
    image_url: image.url,
    expires_at: input.expires_at || null,
    discount_code: input.discount_code?.trim() || null,
    cta_url: cta.url,
    review_url: review.url,
    label_variant: normalizeLabelVariant(input.label_variant),
    countdown_label: normalizeCountdownLabel(input.countdown_label)
  };

  let payload: Record<string, unknown> = { id: 1, ...banner, updated_at: new Date().toISOString() };
  let { error } = await getSupabaseAdmin().from("banners").upsert(payload);

  const optionalCols = ["countdown_label", "review_url", "label_variant"] as const;
  const dropped: string[] = [];
  while (error) {
    const missing = optionalCols.find((col) => isMissingDbColumn(error, col) && col in payload);
    if (!missing) break;
    dropped.push(missing);
    const { [missing]: _omit, ...rest } = payload;
    payload = rest;
    const retry = await getSupabaseAdmin().from("banners").upsert(payload);
    error = retry.error;
  }

  if (error) throw new Error(error.message);

  const saved: Banner = {
    ...banner,
    review_url: dropped.includes("review_url") ? null : banner.review_url,
    countdown_label: dropped.includes("countdown_label") ? "ends_in" : banner.countdown_label,
    label_variant: dropped.includes("label_variant") ? "exclusive_readers" : banner.label_variant
  };

  const warning =
    dropped.length > 0
      ? `Saved, but missing DB columns (${dropped.join(", ")}). Run supabase/migration_banner_review_countdown.sql then save again.`
      : undefined;

  return { banner: saved, warning };
}
