import { bumpPageview } from "@/lib/analytics";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = String(body.path || "/").slice(0, 300);
    const postId = body.postId ? String(body.postId) : null;
    // Ignore admin / api noise
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    await bumpPageview(path, postId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "track failed" },
      { status: 500 }
    );
  }
}
