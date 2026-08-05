import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton";

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
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Niche</th>
              <th>Keyword</th>
              <th>Status</th>
              <th>Index</th>
              <th>WP.com</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.title}</b>
                  <small>/{p.slug}</small>
                </td>
                <td>{p.category || "—"}</td>
                <td>{p.focus_keyword || "—"}</td>
                <td>
                  <span className={p.published ? "status live" : "status"}>
                    {p.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td>
                  <span className="status">{p.index_status || "—"}</span>
                </td>
                <td>
                  {p.wordpress_post_url ? (
                    <a href={p.wordpress_post_url} target="_blank" rel="noreferrer" className="status live">
                      Live
                    </a>
                  ) : (
                    <span className="status">—</span>
                  )}
                </td>
                <td>{new Date(p.created_at).toLocaleDateString("en-US")}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <Link href={`/admin/posts/${p.id}/edit`} className="primary-btn" style={{ padding: "7px 10px" }}>
                    Edit
                  </Link>
                  <DeleteButton id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && <div className="empty">No posts yet.</div>}
      </div>
    </main>
  );
}
