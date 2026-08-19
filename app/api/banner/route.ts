import { isAdmin } from "@/lib/auth";
import { getBanner, saveBanner, type Banner } from "@/lib/banner";
import { NextResponse } from "next/server";

export async function GET() {
  const banner = await getBanner();
  return NextResponse.json(banner);
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Banner;
  try {
    const saved = await saveBanner(body);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 400 }
    );
  }
}
