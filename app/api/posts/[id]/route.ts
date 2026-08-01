import { isAdmin } from "@/lib/auth";
import { getNicheById } from "@/lib/niches";
import { applySeoPipeline } from "@/lib/seo";
import { maybeIndexPost } from "@/lib/sinbyte";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { IndexStatus } from "@/lib/types";
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
  const affiliate_url = b.affiliate_url ? String(b.affiliate_url).trim() : null;
  const cover_url = b.cover_url !== undefined ? b.cover_url || null : existing.cover_url;
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
    niche_id,
    excludePostId: id
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
    updated_at: new Date().toISOString()
  };

  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const index = await maybeIndexPost({
    id: data.id,
    slug: data.slug,
    title: data.title,
    published,
    previousSlug: existing.slug,
    previousStatus: existing.index_status as IndexStatus
  });

  return NextResponse.json({
    ...data,
    index_status: index?.index_status ?? data.index_status,
    warning: index?.warning
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
