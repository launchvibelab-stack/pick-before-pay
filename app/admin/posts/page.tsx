import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { AdminPostsTable, type AdminPostRow } from "@/components/AdminPostsTable";

export const dynamic = "force-dynamic";

export default async function Posts() {
  if (!(await isAdmin())) redirect("/admin/login");
  const { data } = await getSupabaseAdmin().from("posts").select("*").order("created_at", { ascending: false });

  return (
    <main className="admin-main">
      <div className="admin-title">
        <div>
          <p>CONTENT</p>
          <h1>Posts</h1>
        </div>
        <Link href="/admin/new" className="primary-btn">
          + New post
        </Link>
      </div>
      <AdminPostsTable posts={(data || []) as AdminPostRow[]} />
    </main>
  );
}
