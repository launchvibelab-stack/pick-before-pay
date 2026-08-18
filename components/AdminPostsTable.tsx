"use client";

import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";
import { useMemo, useState } from "react";

export type AdminPostRow = {
  id: string;
  title: string;
  slug: string;
  category?: string | null;
  focus_keyword?: string | null;
  published?: boolean | null;
  scheduled_at?: string | null;
  index_status?: string | null;
  wordpress_post_url?: string | null;
  created_at: string;
};

export function AdminPostsTable({ posts }: { posts: AdminPostRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((p) => {
      const hay = [p.title, p.slug, p.focus_keyword, p.category].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [posts, q]);

  return (
    <>
      <div className="admin-search">
        <label className="admin-search-label">
          Search reviews
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title, keyword, slug, niche…"
            autoComplete="off"
          />
        </label>
        <p className="field-hint">
          {q.trim()
            ? `${filtered.length} match${filtered.length === 1 ? "" : "es"} of ${posts.length}`
            : `${posts.length} post${posts.length === 1 ? "" : "s"} total`}
        </p>
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
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.title}</b>
                  <small>/{p.slug}</small>
                </td>
                <td>{p.category || "-"}</td>
                <td>{p.focus_keyword || "-"}</td>
                <td>
                  <span
                    className={
                      p.published ? "status live" : p.scheduled_at ? "status scheduled" : "status"
                    }
                  >
                    {p.published
                      ? "Published"
                      : p.scheduled_at
                        ? `Scheduled ${new Date(p.scheduled_at).toISOString().slice(0, 10)} (~21:00 VN)`
                        : "Draft"}
                  </span>
                </td>
                <td>
                  <span className="status">{p.index_status || "-"}</span>
                </td>
                <td>
                  {p.wordpress_post_url ? (
                    <a href={p.wordpress_post_url} target="_blank" rel="noreferrer" className="status live">
                      Live
                    </a>
                  ) : (
                    <span className="status">-</span>
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
        {!posts.length && <div className="empty">No posts yet.</div>}
        {!!posts.length && !filtered.length && (
          <div className="empty">No reviews match “{q.trim()}”. Try another keyword.</div>
        )}
      </div>
    </>
  );
}
