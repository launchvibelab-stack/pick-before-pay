import { isAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const payload: Record<string, string> = {};
  if (body.name !== undefined) payload.name = String(body.name).trim();
  if (body.description !== undefined) payload.description = String(body.description).trim();
  if (body.slug !== undefined) payload.slug = slugify(String(body.slug));
  else if (payload.name) payload.slug = slugify(payload.name);

  if (!Object.keys(payload).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  if (payload.name !== undefined && !payload.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("niches")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("niches").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
