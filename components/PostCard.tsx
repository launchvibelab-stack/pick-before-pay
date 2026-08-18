import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <Link href={`/posts/${post.slug}`} className="cover" aria-label={post.title}>
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt=""
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
            className="cover-img"
            loading="lazy"
          />
        ) : (
          <span aria-hidden>REVIEW</span>
        )}
      </Link>
      <div className="post-body">
        <span className="category-pill">{post.category || "Review"}</span>
        {typeof post.editor_score === "number" && post.editor_score >= 1 && (
          <span className="score-pill">{Number(post.editor_score).toFixed(1)}/5</span>
        )}
        <h2>
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        <small>
          {new Date(post.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </small>
      </div>
    </article>
  );
}
