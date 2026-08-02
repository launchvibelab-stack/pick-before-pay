import { bumpAffiliateClick } from "@/lib/analytics";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const { data: post } = await getSupabaseAdmin()
    .from("posts")
    .select("id, slug, affiliate_url, published")
    .eq("id", postId)
    .maybeSingle();

  if (!post?.affiliate_url || !post.published) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const path = `/posts/${post.slug}`;
  try {
    await bumpAffiliateClick(post.id, path);
  } catch {
    /* still redirect */
  }

  return NextResponse.redirect(post.affiliate_url, 302);
}
