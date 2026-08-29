import { isAdmin } from "@/lib/auth";
import { mergeWarnings, parseScheduledAt, runGoLiveSideEffects } from "@/lib/go-live";
import { getNicheById } from "@/lib/niches";
import { isMissingDbColumn } from "@/lib/posts";
import { parseEditorScore } from "@/lib/rating";
import { revalidatePublicSurfaces } from "@/lib/revalidate-public";
import { applySeoPipeline, syncNicheInternalLinks } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { IndexStatus } from "@/lib/types";
import { normalizeSafeHttpsUrl } from "@/lib/urls";
import { normalizeYoutubeUrl } from "@/lib/youtube";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: existing, error: fetchError } = await getSupabaseAdmin()
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });
  if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const b = await req.json();
  const title = String(b.title || "").trim();
  const focus_keyword = String(b.focus_keyword || "").trim();
  const content = String(b.content || "").trim();
  const niche_id = b.niche_id ? String(b.niche_id) : null;
  const aff = normalizeSafeHttpsUrl(b.affiliate_url, "Affiliate URL");
  if (aff.error) return NextResponse.json({ error: aff.error }, { status: 400 });
  const affiliate_url = aff.url;
  const cover =
    b.cover_url !== undefined
      ? normalizeSafeHttpsUrl(b.cover_url, "Cover image URL")
      : { url: existing.cover_url as string | null };
  if ("error" in cover && cover.error) return NextResponse.json({ error: cover.error }, { status: 400 });
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
  } else {
    scheduled_at = null;
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
    niche_id,
    excludePostId: id
  });

  const goingLive = published && !existing.published;
  const liveAt = goingLive ? new Date().toISOString() : null;

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
    ...(goingLive
      ? {
          index_status: "pending" as const,
          // Draft written earlier → show the day it actually goes live.
          created_at: liveAt as string
        }
      : {}),
    updated_at: new Date().toISOString()
  };

  let { data, error } = await getSupabaseAdmin()
    .from("posts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  let youtubeSkipped = false;
  if (isMissingDbColumn(error, "youtube_url")) {
    const { youtube_url: _omit, ...rest } = payload;
    const retry = await getSupabaseAdmin().from("posts").update(rest).eq("id", id).select().single();
    data = retry.data;
    error = retry.error;
    youtubeSkipped = Boolean(youtube_url);
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Save failed" }, { status: 400 });
  const youtubeWarning = youtubeSkipped
    ? "Saved without video. Run supabase/migration_youtube.sql in the Supabase SQL editor."
    : undefined;

  // Niche sync when already live, or unpublish/move niche
  if (published && !goingLive) {
    const nichesToSync = new Set<string>();
    if (niche_id) nichesToSync.add(niche_id);
    if (existing.niche_id && existing.niche_id !== niche_id) nichesToSync.add(existing.niche_id);

    let nicheSync = 0;
    for (const nid of nichesToSync) {
      try {
        nicheSync += await syncNicheInternalLinks({
          nicheId: nid,
          seedPost:
            nid === niche_id
              ? {
                  id: data.id,
                  title: data.title,
                  slug: data.slug,
                  focus_keyword: data.focus_keyword,
                  created_at: data.created_at || new Date().toISOString()
                }
              : null
        });
      } catch {
        /* ignore */
      }
    }

    revalidatePublicSurfaces(data.slug, existing.slug);
    return NextResponse.json({
      ...data,
      niche_links_updated: nicheSync,
      warning: youtubeWarning
    });
  }

  if (!published) {
    if (existing.published && existing.niche_id) {
      try {
        await syncNicheInternalLinks({ nicheId: existing.niche_id });
      } catch {
        /* ignore */
      }
    }
    revalidatePublicSurfaces(existing.slug, seo.slug);
    return NextResponse.json({
      ...data,
      warning: mergeWarnings(
        scheduled_at ? `Scheduled for ${new Date(scheduled_at).toLocaleString()}` : undefined,
        youtubeWarning
      )
    });
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
    previousSlug: existing.slug,
    previousStatus: existing.index_status as IndexStatus,
    wordpressPostedAt: existing.wordpress_posted_at ?? null
  });

  return NextResponse.json({
    ...data,
    index_status: side.index_status ?? data.index_status,
    warning: mergeWarnings(side.warning, youtubeWarning),
    wordpress_posted: side.wordpress_posted,
    wordpress_post_url: side.wordpress_post_url,
    niche_links_updated: side.niche_links_updated
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: existing } = await getSupabaseAdmin()
    .from("posts")
    .select("niche_id, published, slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await getSupabaseAdmin().from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (existing?.niche_id && existing.published) {
    try {
      await syncNicheInternalLinks({ nicheId: existing.niche_id });
    } catch {
      /* ignore */
    }
  }

  if (existing?.slug) revalidatePublicSurfaces(existing.slug);
  return NextResponse.json({ ok: true });
}
