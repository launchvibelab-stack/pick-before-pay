import { buildSatelliteArticle } from "@/lib/satellite";
import { getSupabaseAdmin } from "@/lib/supabase";

export type SyndicateResult = {
  posted: boolean;
  url?: string;
  warning?: string;
};

function wpCredentials() {
  const token = process.env.WORDPRESS_COM_TOKEN?.trim();
  const site = process.env.WORDPRESS_COM_SITE?.trim();
  if (!token || !site) return null;
  return { token, site };
}

export async function publishSatelliteToWordPress(opts: {
  title: string;
  contentHtml: string;
  tags?: string;
}): Promise<SyndicateResult> {
  const creds = wpCredentials();
  if (!creds) {
    return {
      posted: false,
      warning:
        "WordPress.com is not configured (WORDPRESS_COM_TOKEN / WORDPRESS_COM_SITE). Skipped satellite post."
    };
  }

  const body = new URLSearchParams();
  body.set("title", opts.title);
  body.set("content", opts.contentHtml);
  body.set("status", "publish");
  if (opts.tags) body.set("tags", opts.tags);

  const res = await fetch(
    `https://public-api.wordpress.com/rest/v1.1/sites/${encodeURIComponent(creds.site)}/posts/new`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }
  );

  const text = await res.text().catch(() => "");
  let json: { URL?: string; url?: string; message?: string; error?: string } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    return {
      posted: false,
      warning:
        json.message ||
        json.error ||
        `WordPress.com post failed (${res.status}): ${text.slice(0, 180)}`
    };
  }

  return {
    posted: true,
    url: json.URL || json.url
  };
}

/**
 * After first successful Sinbyte submit: create 1 companion SEO post on WordPress.com.
 * Skips drafts, republishes, and posts already syndicated.
 */
export async function maybeSyndicateToWordPress(opts: {
  id: string;
  title: string;
  excerpt?: string | null;
  content: string;
  focus_keyword?: string | null;
  slug: string;
  category?: string | null;
  published: boolean;
  indexStatus?: string | null;
  wordpressPostedAt?: string | null;
}): Promise<SyndicateResult | null> {
  if (!opts.published) return null;
  if (opts.wordpressPostedAt) return null;
  if (opts.indexStatus !== "submitted") return null;

  const article = buildSatelliteArticle({
    title: opts.title,
    excerpt: opts.excerpt,
    content: opts.content,
    focus_keyword: opts.focus_keyword,
    slug: opts.slug,
    category: opts.category
  });

  const result = await publishSatelliteToWordPress({
    title: article.title,
    contentHtml: article.contentHtml,
    tags: article.tags
  });

  if (result.posted) {
    await getSupabaseAdmin()
      .from("posts")
      .update({
        wordpress_posted_at: new Date().toISOString(),
        wordpress_post_url: result.url || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", opts.id);
  }

  return result;
}
