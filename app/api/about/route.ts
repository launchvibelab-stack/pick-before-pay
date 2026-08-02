import { isAdmin } from "@/lib/auth";
import { getAboutProfile, saveAboutProfile, type AboutProfile } from "@/lib/about";
import { NextResponse } from "next/server";

export async function GET() {
  const profile = await getAboutProfile();
  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as AboutProfile;
  try {
    const saved = await saveAboutProfile(body);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 400 }
    );
  }
}
