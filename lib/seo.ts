import { normalizeReviewContent } from "@/lib/content";
import {
  RELATED_MARKER,
  applyInternalLinks,
  type LinkPeer
} from "@/lib/internal-links";
import { getSupabaseAdmin } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import type { Post } from "@/lib/types";

const CTA_MARKER = "## Get started";

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function ensureKeyword(text: string, keyword: string, max: number): string {
  const base = truncate(text || keyword, max);
  if (!keyword) return base;
  if (base.toLowerCase().includes(keyword.toLowerCase())) return base;
  const withKw = `${keyword}: ${base}`;
  return truncate(withKw, max);
}

function removeSection(content: string, heading: string): string {
  const re = new RegExp(`\\n*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?(?=\\n## |$)`, "i");
  return content.replace(re, "").trim();
}

export async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = getSupabaseAdmin();
  let candidate = base || "post";
  let n = 2;
  for (;;) {
    let query = db.from("posts").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data?.length) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

export type SeoInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  focus_keyword: string;
  affiliate_url?: string | null;
  niche_id?: string | null;
  excludePostId?: string;
};

export type SeoResult = {
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
};

async function loadNichePeers(nicheId: string, excludePostId?: string): Promise<LinkPeer[]> {
  const db = getSupabaseAdmin();
  let query = db
    .from("posts")
    .select("id, title, slug, focus_keyword, created_at")
    .eq("niche_id", nicheId)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(12);
  if (excludePostId) query = query.neq("id", excludePostId);
  const { data } = await query;
  return (data || []) as LinkPeer[];
}

export async function applySeoPipeline(input: SeoInput): Promise<SeoResult> {
  const keyword = input.focus_keyword.trim();
  const title = input.title.trim();
  let content = normalizeReviewContent(input.content, input.affiliate_url);

  const slugBase = slugify(input.slug?.trim() || keyword || title);
  const slug = await ensureUniqueSlug(slugBase, input.excludePostId);

  let excerpt = (input.excerpt || "").trim();
  if (!excerpt) {
    excerpt = truncate(stripMarkdown(content) || title, 160);
  }

  const meta_title = ensureKeyword(title, keyword, 60);
  const meta_description = ensureKeyword(excerpt || stripMarkdown(content), keyword, 155);

  content = removeSection(content, RELATED_MARKER);
  const affiliate = (input.affiliate_url || "").trim();
  if (!affiliate) {
    content = removeSection(content, CTA_MARKER);
  }

  if (input.niche_id) {
    const peers = await loadNichePeers(input.niche_id, input.excludePostId);
    content = applyInternalLinks(content, peers);
  }

  return { slug, excerpt, content, meta_title, meta_description };
}

export { RELATED_MARKER };
export { syncNicheInternalLinks } from "@/lib/internal-links";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://pickbeforepay.com").replace(/\/$/, "");
}
