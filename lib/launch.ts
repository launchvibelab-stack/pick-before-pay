import {
  BANNER_COUNTDOWN_LABELS,
  countdownLabelText,
  type BannerCountdownLabel
} from "@/lib/banner";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeSafeHttpsUrl } from "@/lib/urls";

export { BANNER_COUNTDOWN_LABELS, countdownLabelText };
export type { BannerCountdownLabel };

export const LAUNCH_LABEL_VARIANTS = [
  "early_access",
  "featured_launch",
  "partner_spotlight",
  "exclusive_readers"
] as const;
export type LaunchLabelVariant = (typeof LAUNCH_LABEL_VARIANTS)[number];

/** Config for /launch email-capture page (independent from homepage banner). */
export type Launch = {
  enabled: boolean;
  product_name: string;
  /** Outcome-first H1 for cold visitors. Falls back to product_name. */
  headline: string;
  /** Short supporting line under the headline. */
  description: string;
  /** Line under the email CTA reinforcing the offer. */
  cta_note: string;
  /** Long-form prelaunch copy (markdown). */
  body_md: string;
  /** Short proof / social-proof block (markdown). */
  proof_md: string;
  image_url: string | null;
  expires_at: string | null;
  discount_code: string | null;
  cta_url: string | null;
  review_url: string | null;
  label_variant: LaunchLabelVariant;
  countdown_label: BannerCountdownLabel;
};

export const defaultLaunch = (): Launch => ({
  enabled: false,
  product_name: "",
  headline: "",
  description: "",
  cta_note: "",
  body_md: "",
  proof_md: "",
  image_url: null,
  expires_at: null,
  discount_code: null,
  cta_url: null,
  review_url: null,
  label_variant: "early_access",
  countdown_label: "ends_in"
});

export function launchLabelText(variant: LaunchLabelVariant): string {
  if (variant === "early_access") return "Early access · Launch offer";
  if (variant === "featured_launch") return "Featured Launch";
  if (variant === "partner_spotlight") return "Partner Spotlight";
  return "Exclusive for PickBeforePay readers";
}

function normalizeLabelVariant(v: unknown): LaunchLabelVariant {
  const s = String(v || "").trim().toLowerCase();
  if (
    s === "early_access" ||
    s === "featured_launch" ||
    s === "partner_spotlight" ||
    s === "exclusive_readers"
  ) {
    return s;
  }
  return "early_access";
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
    headline: String(row.headline || ""),
    description: String(row.description || ""),
    cta_note: String(row.cta_note || ""),
    body_md: String(row.body_md || ""),
    proof_md: String(row.proof_md || ""),
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
    headline: String(input.headline || "").trim(),
    description: String(input.description || "").trim(),
    cta_note: String(input.cta_note || "").trim(),
    body_md: String(input.body_md || "").trim(),
    proof_md: String(input.proof_md || "").trim(),
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
    if (/body_md|headline|cta_note|proof_md|column .* does not exist/i.test(error.message)) {
      throw new Error(
        "Launch columns missing. Run supabase/migration_launch_body.sql and migration_launch_conversion.sql in Supabase."
      );
    }
    throw new Error(error.message);
  }
  return launch;
}
