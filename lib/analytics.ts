import { getSupabaseAdmin } from "@/lib/supabase";

const RETENTION_DAYS = 90;

export type AnalyticsDayRow = {
  day: string;
  path: string;
  post_id: string | null;
  pageviews: number;
  affiliate_clicks: number;
};

export type MonthBucket = {
  key: string; // YYYY-MM
  label: string;
  pageviews: number;
  affiliate_clicks: number;
};

export async function cleanupOldAnalytics(): Promise<number> {
  const db = getSupabaseAdmin();
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
  const cutoffDay = cutoff.toISOString().slice(0, 10);
  const { data, error } = await db.from("analytics_daily").delete().lt("day", cutoffDay).select("day");
  if (error) return 0;
  return data?.length || 0;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function bumpPageview(path: string, postId?: string | null): Promise<void> {
  const db = getSupabaseAdmin();
  const day = todayUTC();
  const normalized = path.startsWith("/") ? path : `/${path}`;

  const { data: existing } = await db
    .from("analytics_daily")
    .select("pageviews")
    .eq("day", day)
    .eq("path", normalized)
    .maybeSingle();

  if (existing) {
    await db
      .from("analytics_daily")
      .update({ pageviews: (existing.pageviews || 0) + 1, post_id: postId || null })
      .eq("day", day)
      .eq("path", normalized);
  } else {
    await db.from("analytics_daily").insert({
      day,
      path: normalized,
      post_id: postId || null,
      pageviews: 1,
      affiliate_clicks: 0
    });
  }

  // Opportunistic retention (~1/20 requests)
  if (Math.random() < 0.05) void cleanupOldAnalytics();
}

export async function bumpAffiliateClick(postId: string, path: string): Promise<void> {
  const db = getSupabaseAdmin();
  const day = todayUTC();
  const normalized = path.startsWith("/") ? path : `/${path}`;

  const { data: existing } = await db
    .from("analytics_daily")
    .select("affiliate_clicks, pageviews")
    .eq("day", day)
    .eq("path", normalized)
    .maybeSingle();

  if (existing) {
    await db
      .from("analytics_daily")
      .update({
        affiliate_clicks: (existing.affiliate_clicks || 0) + 1,
        post_id: postId
      })
      .eq("day", day)
      .eq("path", normalized);
  } else {
    await db.from("analytics_daily").insert({
      day,
      path: normalized,
      post_id: postId,
      pageviews: 0,
      affiliate_clicks: 1
    });
  }

  if (Math.random() < 0.05) void cleanupOldAnalytics();
}

function monthKey(day: string): string {
  return day.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}

/** Last up to 3 calendar months of aggregates (retention window). */
export async function getAnalyticsSummary(): Promise<{
  months: MonthBucket[];
  thisMonth: MonthBucket;
  topPosts: { post_id: string; title: string; slug: string; pageviews: number; affiliate_clicks: number }[];
}> {
  await cleanupOldAnalytics();
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("analytics_daily")
    .select("day, path, post_id, pageviews, affiliate_clicks")
    .order("day", { ascending: false });

  const rows = (data || []) as AnalyticsDayRow[];
  const byMonth = new Map<string, MonthBucket>();

  for (const row of rows) {
    const key = monthKey(row.day);
    const cur = byMonth.get(key) || {
      key,
      label: monthLabel(key),
      pageviews: 0,
      affiliate_clicks: 0
    };
    cur.pageviews += row.pageviews || 0;
    cur.affiliate_clicks += row.affiliate_clicks || 0;
    byMonth.set(key, cur);
  }

  const months = [...byMonth.values()]
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 3);

  const nowKey = todayUTC().slice(0, 7);
  const thisMonth = byMonth.get(nowKey) || {
    key: nowKey,
    label: monthLabel(nowKey),
    pageviews: 0,
    affiliate_clicks: 0
  };

  const byPost = new Map<string, { pageviews: number; affiliate_clicks: number }>();
  for (const row of rows) {
    if (!row.post_id) continue;
    const cur = byPost.get(row.post_id) || { pageviews: 0, affiliate_clicks: 0 };
    cur.pageviews += row.pageviews || 0;
    cur.affiliate_clicks += row.affiliate_clicks || 0;
    byPost.set(row.post_id, cur);
  }

  const postIds = [...byPost.keys()];
  let titles = new Map<string, { title: string; slug: string }>();
  if (postIds.length) {
    const { data: posts } = await db.from("posts").select("id, title, slug").in("id", postIds);
    titles = new Map((posts || []).map((p: { id: string; title: string; slug: string }) => [p.id, p]));
  }

  const topPosts = [...byPost.entries()]
    .map(([post_id, stats]) => ({
      post_id,
      title: titles.get(post_id)?.title || "Untitled",
      slug: titles.get(post_id)?.slug || "",
      ...stats
    }))
    .sort((a, b) => b.pageviews + b.affiliate_clicks * 3 - (a.pageviews + a.affiliate_clicks * 3))
    .slice(0, 8);

  return { months, thisMonth, topPosts };
}
