import Link from "next/link";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <Link
        href={`/posts/${post.slug}`}
        className="cover"
        style={{ backgroundImage: post.cover_url ? `url(${post.cover_url})` : undefined }}
      >
        {!post.cover_url && <span>REVIEW</span>}
      </Link>
      <div className="post-body">
        <span className="category-pill">{post.category || "Review"}</span>
        <h2>
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        <small>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</small>
      </div>
    </article>
  );
}
