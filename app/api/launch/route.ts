import { isAdmin } from "@/lib/auth";
import { getLaunch, saveLaunch, type Launch } from "@/lib/launch";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  const launch = await getLaunch();
  return NextResponse.json(launch);
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Launch;
  try {
    const saved = await saveLaunch(body);
    revalidatePath("/launch");
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 400 }
    );
  }
}
