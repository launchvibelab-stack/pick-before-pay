"use client";

import { PostCard } from "@/components/PostCard";
import type { Post } from "@/lib/types";
import { useMemo, useState } from "react";

const LATEST_COUNT = 6;

export function RecentReviews({ posts }: { posts: Post[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return posts.slice(0, LATEST_COUNT);
    const words = needle.split(/\s+/).filter(Boolean);
    return posts.filter((p) => {
      const hay = [p.title, p.excerpt, p.category, p.focus_keyword, p.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/[-_]+/g, " ");
      return words.every((w) => hay.includes(w));
    });
  }, [posts, q]);

  const searching = q.trim().length > 0;

  return (
    <>
      <div className="section-head reviews-head">
        <span className="eyebrow">Latest</span>
        <h2>Recent reviews</h2>
        <div className="reviews-search">
          <label htmlFor="review-search">Search reviews</label>
          <div className="reviews-search-field">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20 16.5 16.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              id="review-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type a product or keyword…"
              autoComplete="off"
            />
          </div>
        </div>
      </div>
      {searching && (
        <p className="reviews-search-hint">
          {filtered.length} match{filtered.length === 1 ? "" : "es"}
        </p>
      )}
      {filtered.length > 0 ? (
        <div className="post-grid">
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          {searching
            ? `No reviews match “${q.trim()}”.`
            : "No posts yet. Publish your first review in admin."}
        </div>
      )}
    </>
  );
}
