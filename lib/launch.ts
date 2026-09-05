import {
  BANNER_COUNTDOWN_LABELS,
  BANNER_LABEL_VARIANTS,
  countdownLabelText,
  type BannerCountdownLabel,
  type BannerLabelVariant
} from "@/lib/banner";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeSafeHttpsUrl } from "@/lib/urls";

export { BANNER_COUNTDOWN_LABELS, BANNER_LABEL_VARIANTS, countdownLabelText };
export type { BannerCountdownLabel, BannerLabelVariant };

/** Config for /launch email-capture page (independent from homepage banner). */
export type Launch = {
  enabled: boolean;
  product_name: string;
  /** Short hero hook (1–2 sentences). */
  description: string;
  /** Long-form prelaunch copy (markdown). */
  body_md: string;
  image_url: string | null;
  expires_at: string | null;
  discount_code: string | null;
  cta_url: string | null;
  review_url: string | null;
  label_variant: BannerLabelVariant;
  countdown_label: BannerCountdownLabel;
};

export const defaultLaunch = (): Launch => ({
  enabled: false,
  product_name: "",
  description: "",
  body_md: "",
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

function normalize(row: Record<string, unknown> | null | undefined): Launch {
  if (!row) return defaultLaunch();
  return {
    enabled: Boolean(row.enabled),
    product_name: String(row.product_name || ""),
    description: String(row.description || ""),
    body_md: String(row.body_md || ""),
    image_url: row.image_url ? String(row.image_url) : null,
    expires_at: row.expires_at ? String(row.expires_at) : null,
    discount_code: row.discount_code ? String(row.discount_code) : null,
    cta_url: row.cta_url ? String(row.cta_url) : null,
    review_url: row.review_url ? String(row.review_url) : null,
    label_variant: normalizeLabelVariant(row.label_variant),
    countdown_label: normalizeCountdownLabel(row.countdown_label)
  };
}

export async function getLaunch(): Promise<Launch> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("launches")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return defaultLaunch();
    return normalize(data as Record<string, unknown>);
  } catch {
    return defaultLaunch();
  }
}

export async function saveLaunch(input: Launch): Promise<Launch> {
  const image = normalizeSafeHttpsUrl(input.image_url, "Launch image URL");
  if (image.error) throw new Error(image.error);
  const cta = normalizeSafeHttpsUrl(input.cta_url, "CTA URL");
  if (cta.error) throw new Error(cta.error);
  const review = normalizeSafeHttpsUrl(input.review_url, "Review article URL", { allowRelative: true });
  if (review.error) throw new Error(review.error);

  const launch: Launch = {
    enabled: Boolean(input.enabled),
    product_name: String(input.product_name || "").trim(),
    description: String(input.description || "").trim(),
    body_md: String(input.body_md || "").trim(),
    image_url: image.url,
    expires_at: input.expires_at || null,
    discount_code: input.discount_code?.trim() || null,
    cta_url: cta.url,
    review_url: review.url,
    label_variant: normalizeLabelVariant(input.label_variant),
    countdown_label: normalizeCountdownLabel(input.countdown_label)
  };

  const { error } = await getSupabaseAdmin()
    .from("launches")
    .upsert({ id: 1, ...launch, updated_at: new Date().toISOString() });

  if (error) {
    if (/relation .*launches.* does not exist|Could not find the table|schema cache/i.test(error.message)) {
      throw new Error("Launch table missing. Run supabase/migration_launch.sql in the Supabase SQL editor.");
    }
    if (/body_md|column .* does not exist/i.test(error.message)) {
      throw new Error("Launch body column missing. Run supabase/migration_launch_body.sql in the Supabase SQL editor.");
    }
    throw new Error(error.message);
  }
  return launch;
}
