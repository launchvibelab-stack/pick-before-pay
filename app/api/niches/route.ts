import { isAdmin } from "@/lib/auth";
import { getNiches } from "@/lib/niches";
import { slugify } from "@/lib/slugify";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const niches = await getNiches();
    return NextResponse.json(niches);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const slug = slugify(String(body.slug || name));
  if (!name || !slug) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("niches")
    .insert({ name, slug, description })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
