import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const db = getSupabaseAdmin();
  const [{ count: posts }, { count: published }, { count: niches }] = await Promise.all([
    db.from("posts").select("*", { count: "exact", head: true }),
    db.from("posts").select("*", { count: "exact", head: true }).eq("published", true),
    db.from("niches").select("*", { count: "exact", head: true })
  ]);

  return (
    <main className="admin-main">
      <div className="admin-title">
        <div>
          <p>CONTENT CMS</p>
          <h1>Dashboard</h1>
        </div>
        <Link className="primary-btn" href="/admin/new">
          + New post
        </Link>
      </div>
      <div className="stat-grid">
        <div>
          <span>Total posts</span>
          <b>{posts || 0}</b>
        </div>
        <div>
          <span>Published</span>
          <b>{published || 0}</b>
        </div>
        <div>
          <span>Niches</span>
          <b>{niches || 0}</b>
        </div>
      </div>
      <div className="admin-card">
        <h2>Quick start</h2>
        <p>
          Add a niche, then publish a review with a focus keyword, cover image, and affiliate link. SEO
          meta, internal links, and Sinbyte indexing run automatically on publish.
        </p>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <Link href="/admin/niches">Manage niches →</Link>
          <Link href="/admin/new">Write first post →</Link>
        </div>
      </div>
    </main>
  );
}
