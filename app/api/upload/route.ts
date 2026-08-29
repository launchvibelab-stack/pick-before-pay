import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

function sniffImageExt(buf: Uint8Array): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "png";
  }
  if (
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38
  ) {
    return "gif";
  }
  // RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image max size is 5MB" }, { status: 400 });
  }

  const declared = String(file.type || "").toLowerCase();
  if (declared && !ALLOWED[declared]) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or GIF images are allowed." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageExt(bytes);
  if (!sniffed) {
    return NextResponse.json(
      { error: "File content is not a valid JPEG, PNG, WebP, or GIF image." },
      { status: 400 }
    );
  }

  // Prefer sniffed type; declared MIME must agree when present
  if (declared && ALLOWED[declared] !== sniffed) {
    return NextResponse.json({ error: "File type does not match image content." }, { status: 400 });
  }

  const contentType =
    sniffed === "jpg"
      ? "image/jpeg"
      : sniffed === "png"
        ? "image/png"
        : sniffed === "webp"
          ? "image/webp"
          : "image/gif";

  const path = `covers/${crypto.randomUUID()}.${sniffed}`;
  const db = getSupabaseAdmin();
  const { error } = await db.storage.from("post-images").upload(path, bytes, {
    contentType,
    upsert: false
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data } = db.storage.from("post-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
