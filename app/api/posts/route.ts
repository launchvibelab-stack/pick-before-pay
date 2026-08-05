import { isAdmin } from "@/lib/auth";
import { getNicheById } from "@/lib/niches";
import { applySeoPipeline, syncNicheInternalLinks } from "@/lib/seo";
import { maybeIndexPost } from "@/lib/sinbyte";
import { getSupabaseAdmin } from "@/lib/supabase";
import { maybeSyndicateToWordPress } from "@/lib/wordpress";
import { NextResponse } from "next/server";

function mergeWarnings(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(" ") || undefined;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const title = String(b.title || "").trim();
  const focus_keyword = String(b.focus_keyword || "").trim();
  const content = String(b.content || "").trim();
  const niche_id = b.niche_id ? String(b.niche_id) : null;
  const affiliate_url = b.affiliate_url ? String(b.affiliate_url).trim() : null;
  const cover_url = b.cover_url || null;
  const published = b.published === true || b.published === "true";

  if (!title || !content || !niche_id || !focus_keyword) {
    return NextResponse.json(
      { error: "Title, focus keyword, niche, and content are required" },
      { status: 400 }
    );
  }

  const niche = await getNicheById(niche_id);
  if (!niche) return NextResponse.json({ error: "Niche not found" }, { status: 400 });

  const seo = await applySeoPipeline({
    title,
    slug: String(b.slug || "").trim(),
    excerpt: String(b.excerpt || "").trim(),
    content,
    focus_keyword,
    affiliate_url,
    niche_id
  });

  const payload = {
    title,
    slug: seo.slug,
    excerpt: seo.excerpt,
    content: seo.content,
    category: niche.name,
    niche_id,
    focus_keyword,
    affiliate_url,
    meta_title: seo.meta_title,
    meta_description: seo.meta_description,
    cover_url,
    published,
    index_status: published ? "pending" : null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await getSupabaseAdmin().from("posts").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let nicheSync = 0;
  if (published && niche_id) {
    try {
      nicheSync = await syncNicheInternalLinks({
        nicheId: niche_id,
        seedPost: {
          id: data.id,
          title: data.title,
          slug: data.slug,
          focus_keyword: data.focus_keyword,
          created_at: data.created_at || new Date().toISOString()
        }
      });
    } catch {
      nicheSync = 0;
    }
  }

  const index = await maybeIndexPost({
    id: data.id,
    slug: data.slug,
    title: data.title,
    published,
    previousStatus: null
  });

  const syndicate = await maybeSyndicateToWordPress({
    id: data.id,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    focus_keyword: data.focus_keyword,
    slug: data.slug,
    category: data.category,
    published,
    indexStatus: index?.index_status ?? data.index_status,
    wordpressPostedAt: data.wordpress_posted_at ?? null
  });

  return NextResponse.json(
    {
      ...data,
      index_status: index?.index_status ?? data.index_status,
      warning: mergeWarnings(index?.warning, syndicate?.warning),
      wordpress_posted: syndicate?.posted === true,
      wordpress_post_url: syndicate?.url,
      niche_links_updated: nicheSync
    },
    { status: 201 }
  );
}
