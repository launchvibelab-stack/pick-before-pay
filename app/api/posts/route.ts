import { isAdmin } from "@/lib/auth";
import { mergeWarnings, parseScheduledAt, runGoLiveSideEffects } from "@/lib/go-live";
import { getNicheById } from "@/lib/niches";
import { isMissingDbColumn } from "@/lib/posts";
import { parseEditorScore } from "@/lib/rating";
import { applySeoPipeline, syncNicheInternalLinks } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeSafeHttpsUrl } from "@/lib/urls";
import { normalizeYoutubeUrl } from "@/lib/youtube";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const title = String(b.title || "").trim();
  const focus_keyword = String(b.focus_keyword || "").trim();
  const content = String(b.content || "").trim();
  const niche_id = b.niche_id ? String(b.niche_id) : null;
  const aff = normalizeSafeHttpsUrl(b.affiliate_url, "Affiliate URL");
  if (aff.error) return NextResponse.json({ error: aff.error }, { status: 400 });
  const affiliate_url = aff.url;
  const cover = normalizeSafeHttpsUrl(b.cover_url, "Cover image URL");
  if (cover.error) return NextResponse.json({ error: cover.error }, { status: 400 });
  const cover_url = cover.url;
  const editor_score = parseEditorScore(b.editor_score);
  const youtube = normalizeYoutubeUrl(b.youtube_url);
  if (youtube.error) return NextResponse.json({ error: youtube.error }, { status: 400 });
  const youtube_url = youtube.url;
  let published = b.published === true || b.published === "true";
  let scheduled_at = parseScheduledAt(b.scheduled_at);

  if (!title || !content || !niche_id || !focus_keyword) {
    return NextResponse.json(
      { error: "Title, focus keyword, niche, and content are required" },
      { status: 400 }
    );
  }

  if (b.editor_score != null && b.editor_score !== "" && editor_score == null) {
    return NextResponse.json({ error: "Editor score must be between 1.0 and 5.0" }, { status: 400 });
  }

  if ((published || scheduled_at) && editor_score == null) {
    return NextResponse.json(
      { error: "Add an editor score (1.0-5.0) before publishing or scheduling." },
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
    editor_score,
    youtube_url,
    published,
    scheduled_at,
    index_status: published ? "pending" : null,
    updated_at: new Date().toISOString()
  };

  let { data, error } = await getSupabaseAdmin().from("posts").insert(payload).select().single();
  let youtubeWarning: string | undefined;
  if (isMissingDbColumn(error, "youtube_url")) {
    const { youtube_url: _omit, ...rest } = payload;
    const retry = await getSupabaseAdmin().from("posts").insert(rest).select().single();
    data = retry.data;
    error = retry.error;
    if (!error && youtube_url) {
      youtubeWarning = "Saved without video. Run supabase/migration_youtube.sql in the Supabase SQL editor.";
    }
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Save failed" }, { status: 400 });

  if (!published) {
    return NextResponse.json(
      {
        ...data,
        warning: mergeWarnings(
          scheduled_at ? `Scheduled for ${new Date(scheduled_at).toISOString()}` : undefined,
          youtubeWarning
        )
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
      warning: mergeWarnings(side.warning, youtubeWarning),
      wordpress_posted: side.wordpress_posted,
      wordpress_post_url: side.wordpress_post_url,
      niche_links_updated: side.niche_links_updated
    },
    { status: 201 }
  );
}
