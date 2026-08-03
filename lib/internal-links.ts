import { getSupabaseAdmin } from "@/lib/supabase";
import type { Post } from "@/lib/types";

export const RELATED_MARKER = "## Related reviews";
export const RELATED_LIMIT = 5;

export type LinkPeer = Pick<Post, "id" | "title" | "slug" | "focus_keyword"> & {
  created_at?: string;
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function removeRelatedSection(content: string): string {
  const re = new RegExp(
    `\\n*${RELATED_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?(?=\\n## |$)`,
    "i"
  );
  return content.replace(re, "").trim();
}

function extractRelatedSection(content: string): string {
  const re = new RegExp(
    `${RELATED_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?(?=\\n## |$)`,
    "i"
  );
  const m = content.match(re);
  return (m?.[0] || "").trim();
}

function isProtectedLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^#{1,6}\s/.test(t)) return true;
  if (/^```/.test(t)) return true;
  if (/^\|/.test(t)) return true;
  if (/^>/.test(t)) return true;
  if (/^[-*+]\s+\[[^\]]+\]\([^)]+\)/.test(t)) return true;
  return false;
}

function phraseCandidates(peer: LinkPeer): string[] {
  const out: string[] = [];
  const kw = (peer.focus_keyword || "").trim();
  if (kw.length >= 4) out.push(kw);
  const title = (peer.title || "").trim();
  if (title.length >= 6) {
    out.push(title);
    const short = title.replace(/\s+review\s*$/i, "").trim();
    if (short.length >= 6 && short.toLowerCase() !== title.toLowerCase()) out.push(short);
  }
  return [...new Set(out)].sort((a, b) => b.length - a.length);
}

function linkFirstPhrase(line: string, phrase: string, href: string): { line: string; linked: boolean } {
  if (line.includes(href)) return { line, linked: false };
  const re = new RegExp(`(?<![\\w/\`])(${escapeRegExp(phrase)})(?![\\w]|\\]\\()`, "i");
  const m = re.exec(line);
  if (!m || m.index === undefined) return { line, linked: false };

  const before = line.slice(0, m.index);
  const openBrackets = (before.match(/\[/g) || []).length;
  const closeBrackets = (before.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) return { line, linked: false };

  const linked = `${line.slice(0, m.index)}[${m[1]}](${href})${line.slice(m.index + m[1].length)}`;
  return { line: linked, linked: true };
}

/** Newest first by created_at (missing dates sort last). */
export function sortPeersNewestFirst(peers: LinkPeer[]): LinkPeer[] {
  return [...peers].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return tb - ta;
  });
}

/**
 * Insert up to `maxLinks` contextual internal links to peer posts.
 * Only the first natural mention of each peer's keyword/title is linked.
 */
export function injectContextualLinks(
  content: string,
  peers: LinkPeer[],
  maxLinks = 3
): string {
  if (!peers.length || maxLinks <= 0) return content;

  const body = removeRelatedSection(content);
  const lines = body.split("\n");
  const existingLinks = (body.match(/\]\(\/posts\/[^)]+\)/g) || []).length;
  let linkedCount = existingLinks;
  const usedSlugs = new Set<string>();

  const ranked = [...peers].sort(
    (a, b) => (b.focus_keyword?.length || 0) - (a.focus_keyword?.length || 0)
  );

  for (const peer of ranked) {
    if (linkedCount >= maxLinks) break;
    if (usedSlugs.has(peer.slug)) continue;
    const href = `/posts/${peer.slug}`;
    if (body.includes(href)) {
      usedSlugs.add(peer.slug);
      continue;
    }

    const phrases = phraseCandidates(peer);
    let done = false;
    for (let i = 0; i < lines.length && !done; i++) {
      if (isProtectedLine(lines[i])) continue;
      for (const phrase of phrases) {
        const result = linkFirstPhrase(lines[i], phrase, href);
        if (result.linked) {
          lines[i] = result.line;
          usedSlugs.add(peer.slug);
          linkedCount += 1;
          done = true;
          break;
        }
      }
    }
  }

  return lines.join("\n").trim();
}

export function buildRelatedSection(peers: LinkPeer[], limit = RELATED_LIMIT): string {
  const newest = sortPeersNewestFirst(peers).slice(0, limit);
  const list = newest.map((p) => `- [${p.title}](/posts/${p.slug})`).join("\n");
  if (!list) return "";
  return `\n\n${RELATED_MARKER}\n\n${list}`;
}

export function applyInternalLinks(content: string, peers: LinkPeer[]): string {
  const newest = sortPeersNewestFirst(peers);
  const relatedPeers = newest.slice(0, RELATED_LIMIT);
  const withInline = injectContextualLinks(content, newest, 3);
  const base = removeRelatedSection(withInline);
  const related = buildRelatedSection(relatedPeers, RELATED_LIMIT);
  return `${base}${related}`.trim();
}

/** Rebuild related (+ contextual) links for every published post in a niche. */
export async function syncNicheInternalLinks(opts: {
  nicheId: string;
  seedPost?: LinkPeer | null;
}): Promise<number> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("posts")
    .select("id, title, slug, focus_keyword, content, published, niche_id, created_at")
    .eq("niche_id", opts.nicheId)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  let posts = (data || []) as (LinkPeer & {
    content: string;
    published: boolean;
    niche_id: string | null;
  })[];

  if (opts.seedPost && !posts.some((p) => p.id === opts.seedPost!.id)) {
    posts = [
      {
        ...opts.seedPost,
        created_at: opts.seedPost.created_at || new Date().toISOString(),
        content: "",
        published: true,
        niche_id: opts.nicheId
      },
      ...posts
    ];
  }

  posts = sortPeersNewestFirst(posts) as typeof posts;

  if (posts.length < 2) return 0;

  let updated = 0;
  const now = new Date().toISOString();

  for (const post of posts) {
    let content = post.content;
    if (!content) {
      const { data: full } = await db.from("posts").select("content").eq("id", post.id).maybeSingle();
      content = full?.content || "";
      if (!content) continue;
    }

    const peers = posts
      .filter((p) => p.id !== post.id)
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        focus_keyword: p.focus_keyword,
        created_at: p.created_at
      }));

    const next = applyInternalLinks(content, peers);
    const relatedChanged = extractRelatedSection(content) !== extractRelatedSection(next);
    if (next === content && !relatedChanged) continue;

    const { error: upErr } = await db
      .from("posts")
      .update({ content: next, updated_at: now })
      .eq("id", post.id);

    if (!upErr) updated += 1;
  }

  return updated;
}
