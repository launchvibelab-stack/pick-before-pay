import { isAdmin } from "@/lib/auth";
import { mergeWarnings, parseScheduledAt, runGoLiveSideEffects } from "@/lib/go-live";
import { getNicheById } from "@/lib/niches";
import { applySeoPipeline, syncNicheInternalLinks } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const title = String(b.title || "").trim();
  const focus_keyword = String(b.focus_keyword || "").trim();
  const content = String(b.content || "").trim();
  const niche_id = b.niche_id ? String(b.niche_id) : null;
  const affiliate_url = b.affiliate_url ? String(b.affiliate_url).trim() : null;
  const cover_url = b.cover_url || null;
  let published = b.published === true || b.published === "true";
  let scheduled_at = parseScheduledAt(b.scheduled_at);

  if (!title || !content || !niche_id || !focus_keyword) {
    return NextResponse.json(
      { error: "Title, focus keyword, niche, and content are required" },
      { status: 400 }
    );
  }

  if (published) {
    scheduled_at = null;
  } else if (scheduled_at) {
    if (new Date(scheduled_at).getTime() <= Date.now() - 30_000) {
      return NextResponse.json({ error: "Scheduled time must be in the future." }, { status: 400 });
    }
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
    scheduled_at,
    index_status: published ? "pending" : null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await getSupabaseAdmin().from("posts").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (!published) {
    return NextResponse.json(
      {
        ...data,
        warning: scheduled_at ? `Scheduled for ${new Date(scheduled_at).toISOString()}` : undefined
      },
      { status: 201 }
    );
  }

  const side = await runGoLiveSideEffects({
    id: data.id,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    focus_keyword: data.focus_keyword,
    slug: data.slug,
    category: data.category,
    niche_id: data.niche_id,
    created_at: data.created_at,
    previousStatus: null,
    wordpressPostedAt: null
  });

  return NextResponse.json(
    {
      ...data,
      index_status: side.index_status ?? data.index_status,
      warning: side.warning,
      wordpress_posted: side.wordpress_posted,
      wordpress_post_url: side.wordpress_post_url,
      niche_links_updated: side.niche_links_updated
    },
    { status: 201 }
  );
}
