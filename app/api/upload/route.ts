import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image max size is 5MB" }, { status: 400 });
  const ext = file.name.split(".").pop() || "jpg";
  const path = `covers/${crypto.randomUUID()}.${ext}`;
  const db = getSupabaseAdmin();
  const { error } = await db.storage.from("post-images").upload(path, file, {
    contentType: file.type,
    upsert: false
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data } = db.storage.from("post-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
