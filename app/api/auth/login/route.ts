import { createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const fd = await req.formData();
  if (fd.get("password") !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url));
  }
  try {
    await createSession();
  } catch (err) {
    console.error("createSession:", err);
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url));
  }
  return NextResponse.redirect(new URL("/admin", req.url));
}
