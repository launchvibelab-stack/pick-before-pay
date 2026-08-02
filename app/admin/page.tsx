import { isAdmin } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/analytics";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const db = getSupabaseAdmin();
  const [{ count: posts }, { count: published }, { count: niches }, analytics] = await Promise.all([
    db.from("posts").select("*", { count: "exact", head: true }),
    db.from("posts").select("*", { count: "exact", head: true }).eq("published", true),
    db.from("niches").select("*", { count: "exact", head: true }),
    getAnalyticsSummary().catch(() => null)
  ]);

  const thisMonth = analytics?.thisMonth;
  const months = analytics?.months || [];
  const topPosts = analytics?.topPosts || [];

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

      <div className="stat-grid analytics-grid">
        <div>
          <span>Pageviews · {thisMonth?.label || "This month"}</span>
          <b>{thisMonth?.pageviews ?? 0}</b>
        </div>
        <div>
          <span>Affiliate clicks · {thisMonth?.label || "This month"}</span>
          <b>{thisMonth?.affiliate_clicks ?? 0}</b>
        </div>
        <div>
          <span>Data retention</span>
          <b className="stat-note">90 days</b>
        </div>
      </div>

      <div className="admin-card">
        <h2>Traffic by month</h2>
        <p className="card-lead">Pageviews and affiliate CTA clicks. Older than 3 months is deleted automatically.</p>
        {months.length === 0 ? (
          <p className="muted-line">No traffic yet — stats appear after public visits and affiliate clicks.</p>
        ) : (
          <div className="table-card analytics-table">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Pageviews</th>
                  <th>Affiliate clicks</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.key}>
                    <td>{m.label}</td>
                    <td>{m.pageviews}</td>
                    <td>{m.affiliate_clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2>Top posts (last 90 days)</h2>
        {topPosts.length === 0 ? (
          <p className="muted-line">No post-level stats yet.</p>
        ) : (
          <div className="table-card analytics-table">
            <table>
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Views</th>
                  <th>Aff clicks</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((p) => (
                  <tr key={p.post_id}>
                    <td>
                      {p.slug ? (
                        <Link href={`/posts/${p.slug}`} target="_blank">
                          {p.title}
                        </Link>
                      ) : (
                        p.title
                      )}
                    </td>
                    <td>{p.pageviews}</td>
                    <td>{p.affiliate_clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
