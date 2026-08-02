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
  linkedin_url: string;
  youtube_url: string;
  products: AboutProduct[];
};

const BUCKET = "site-config";
const OBJECT_PATH = "about.json";

export const defaultAboutProfile = (): AboutProfile => ({
  name: "PickBeforePay",
  headline: "Honest product reviews before you buy",
  bio: "I research niche digital products and share clear, practical reviews so you can decide with confidence.",
  avatar_url: null,
  facebook_url: "",
  pinterest_url: "",
  telegram_url: "",
  linkedin_url: "",
  youtube_url: "",
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
    linkedin_url: String(row.linkedin_url || ""),
    youtube_url: String(row.youtube_url || ""),
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
  const profile: AboutProfile = {
    name: input.name.trim() || defaultAboutProfile().name,
    headline: input.headline.trim(),
    bio: input.bio.trim(),
    avatar_url: input.avatar_url?.trim() || null,
    facebook_url: (input.facebook_url || "").trim(),
    pinterest_url: (input.pinterest_url || "").trim(),
    telegram_url: (input.telegram_url || "").trim(),
    linkedin_url: (input.linkedin_url || "").trim(),
    youtube_url: (input.youtube_url || "").trim(),
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
    await getSupabaseAdmin()
      .from("about_profile")
      .upsert({
        id: 1,
        ...profile,
        updated_at: new Date().toISOString()
      });
  } catch {
    /* ignore */
  }

  return profile;
}
