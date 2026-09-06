import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeSafeHttpsUrl } from "@/lib/urls";

export type AboutProduct = {
  title: string;
  url: string;
  description?: string;
};

export type AboutSocial = {
  label: string;
  url: string;
};

export type AboutProfile = {
  name: string;
  headline: string;
  bio: string;
  avatar_url: string | null;
  profile_image_url: string | null;
  /** @deprecated kept for storage/SQL mirror; prefer `socials`. */
  facebook_url: string;
  pinterest_url: string;
  telegram_url: string;
  linkedin_url: string;
  youtube_url: string;
  socials: AboutSocial[];
  products: AboutProduct[];
};

const BUCKET = "site-config";
const OBJECT_PATH = "about.json";

const LEGACY_SOCIAL_KEYS = [
  ["Facebook", "facebook_url"],
  ["Pinterest", "pinterest_url"],
  ["Telegram", "telegram_url"],
  ["LinkedIn", "linkedin_url"],
  ["YouTube", "youtube_url"]
] as const;

export const defaultAboutProfile = (): AboutProfile => ({
  name: "PickBeforePay",
  headline: "Honest product reviews before you buy",
  bio: "I research niche digital products and share clear, practical reviews so you can decide with confidence.",
  avatar_url: null,
  profile_image_url: null,
  facebook_url: "",
  pinterest_url: "",
  telegram_url: "",
  linkedin_url: "",
  youtube_url: "",
  socials: [],
  products: []
});

function normalizeSocials(row: Record<string, unknown>): AboutSocial[] {
  if (Array.isArray(row.socials)) {
    const fromList = (row.socials as AboutSocial[])
      .map((s) => ({
        label: String(s?.label || "").trim(),
        url: String(s?.url || "").trim()
      }))
      .filter((s) => s.label && s.url);
    if (fromList.length) return fromList;
  }

  return LEGACY_SOCIAL_KEYS.map(([label, key]) => ({
    label,
    url: String(row[key] || "").trim()
  })).filter((s) => s.url);
}

function legacyFromSocials(socials: AboutSocial[]) {
  const byLabel = (name: string) =>
    socials.find((s) => s.label.toLowerCase() === name.toLowerCase())?.url || "";
  return {
    facebook_url: byLabel("Facebook"),
    pinterest_url: byLabel("Pinterest"),
    telegram_url: byLabel("Telegram"),
    linkedin_url: byLabel("LinkedIn"),
    youtube_url: byLabel("YouTube")
  };
}

function normalize(row: Record<string, unknown> | null | undefined): AboutProfile {
  const base = defaultAboutProfile();
  if (!row) return base;
  const products = Array.isArray(row.products)
    ? (row.products as AboutProduct[]).filter((p) => p && typeof p.title === "string")
    : [];
  const socials = normalizeSocials(row);
  const legacy = legacyFromSocials(socials);
  return {
    name: String(row.name || base.name),
    headline: String(row.headline || base.headline),
    bio: String(row.bio || base.bio),
    avatar_url: row.avatar_url ? String(row.avatar_url) : null,
    profile_image_url: row.profile_image_url ? String(row.profile_image_url) : null,
    ...legacy,
    socials,
    products
  };
}

async function ensureBucket() {
  const db = getSupabaseAdmin();
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await db.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 1_000_000
    });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(error.message);
    }
  }
}

async function readFromStorage(): Promise<AboutProfile | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.storage.from(BUCKET).download(OBJECT_PATH);
  if (error || !data) return null;
  const text = await data.text();
  try {
    return normalize(JSON.parse(text) as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function writeToStorage(profile: AboutProfile): Promise<void> {
  await ensureBucket();
  const db = getSupabaseAdmin();
  const body = JSON.stringify(profile, null, 2);
  const { error } = await db.storage.from(BUCKET).upload(OBJECT_PATH, body, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "60"
  });
  if (error) throw new Error(error.message);
}

async function readFromTable(): Promise<AboutProfile | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("about_profile")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return null;
    return normalize(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getAboutProfile(): Promise<AboutProfile> {
  try {
    const fromStorage = await readFromStorage();
    if (fromStorage) return fromStorage;
    const fromTable = await readFromTable();
    if (fromTable) return fromTable;
  } catch {
    /* fall through */
  }
  return defaultAboutProfile();
}

export async function saveAboutProfile(input: AboutProfile): Promise<AboutProfile> {
  const socials: AboutSocial[] = (input.socials || [])
    .map((s) => {
      const label = String(s.label || "").trim();
      const checked = normalizeSafeHttpsUrl(String(s.url || "").trim(), `${label || "Social"} URL`);
      if (checked.error) throw new Error(checked.error);
      return { label, url: checked.url || "" };
    })
    .filter((s) => s.label && s.url);

  const legacy = legacyFromSocials(socials);

  const profile: AboutProfile = {
    name: input.name.trim() || defaultAboutProfile().name,
    headline: input.headline.trim(),
    bio: input.bio.trim(),
    avatar_url: input.avatar_url?.trim() || null,
    profile_image_url: input.profile_image_url?.trim() || null,
    ...legacy,
    socials,
    products: (input.products || [])
      .map((p) => ({
        title: String(p.title || "").trim(),
        url: String(p.url || "").trim(),
        description: String(p.description || "").trim()
      }))
      .filter((p) => p.title && p.url)
  };

  await writeToStorage(profile);

  // Best-effort sync to SQL table when it exists (optional)
  try {
    const { socials: _socials, ...sqlRow } = profile;
    await getSupabaseAdmin()
      .from("about_profile")
      .upsert({
        id: 1,
        ...sqlRow,
        updated_at: new Date().toISOString()
      });
  } catch {
    /* ignore */
  }

  return profile;
}
